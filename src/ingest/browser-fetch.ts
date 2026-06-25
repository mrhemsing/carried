import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

type FetchOptions = {
  cacheNamespace: string;
  delayMs?: number;
  timeoutMs?: number;
};

type FetchResult = {
  html: string | null;
  source: "cache" | "manual" | "http" | "browser" | "miss";
  status?: number;
  url: string;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari/537.36 Carried civic records research";
const BROWSER_WAIT_MS = Number(process.env.CARRIED_BROWSER_WAIT_MS ?? 0);

export async function fetchPublicPageHtml(
  url: string,
  options: FetchOptions,
): Promise<FetchResult> {
  const cachePath = htmlCachePath(url, options.cacheNamespace);
  const cached = await readCachedHtml(cachePath);

  if (isUsableHtml(cached)) {
    return { html: cached, source: "cache", url };
  }

  const manual = await readManualHtml(url, options.cacheNamespace);

  if (isUsableHtml(manual)) {
    await writeCachedHtml(cachePath, manual!);
    return { html: manual, source: "manual", url };
  }

  const httpResult = await fetchWithHttp(url, options.timeoutMs ?? 20_000);

  if (isUsableHtml(httpResult.html)) {
    await writeCachedHtml(cachePath, httpResult.html!);
    await politeDelay(options.delayMs);
    return { ...httpResult, source: "http", url };
  }

  const browserResult = await fetchWithBrowser(url, options);

  if (isUsableHtml(browserResult.html)) {
    await writeCachedHtml(cachePath, browserResult.html!);
  }

  await politeDelay(options.delayMs);
  return browserResult;
}

async function fetchWithHttp(url: string, timeoutMs: number): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
      },
    });
    const html = response.ok ? await response.text() : null;
    return { html, source: "http", status: response.status, url };
  } catch {
    return { html: null, source: "miss", url };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithBrowser(
  url: string,
  options: FetchOptions,
): Promise<FetchResult> {
  const userDataDir = path.resolve(
    process.cwd(),
    "data",
    "browser-state",
    options.cacheNamespace,
  );
  await fs.mkdir(userDataDir, { recursive: true });

  let context;

  try {
    const headless = process.env.CARRIED_BROWSER_HEADLESS !== "false";
    const channel = process.env.CARRIED_BROWSER_CHANNEL;
    context = await chromium.launchPersistentContext(userDataDir, {
      channel,
      headless,
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs ?? 30_000,
    });

    await page.waitForTimeout(BROWSER_WAIT_MS || (headless ? 3_000 : 10_000));

    const html = await page.content();
    return {
      html: isUsableHtml(html) ? html : null,
      source: "browser",
      status: response?.status(),
      url: page.url(),
    };
  } catch {
    return { html: null, source: "miss", url };
  } finally {
    await context?.close();
  }
}

function isUsableHtml(html: string | null | undefined) {
  if (!html) {
    return false;
  }

  return !(
    html.includes("Sorry, you have been blocked") ||
    html.includes("Attention Required! | Cloudflare") ||
    html.includes("/cdn-cgi/challenge-platform/") ||
    html.includes("The document you're looking for can't be found")
  );
}

async function readCachedHtml(cachePath: string) {
  try {
    return await fs.readFile(cachePath, "utf8");
  } catch {
    return null;
  }
}

async function readManualHtml(url: string, namespace: string) {
  const urlPath = new URL(url).pathname;
  const fileName = path.basename(urlPath).toLowerCase();
  const stamp = urlPath.match(/\/(\d{8})\//)?.[1];
  const code = fileName.match(/^([a-z]+)\d{8}ag\.html?$/)?.[1];
  const candidates = [
    process.env.CARRIED_MANUAL_HTML_PATH
      ? path.resolve(process.cwd(), process.env.CARRIED_MANUAL_HTML_PATH)
      : null,
    stamp && code
      ? path.resolve(process.cwd(), "data", "manual", "vancouver", `${stamp}-${code}-ag.html`)
      : null,
    stamp && code
      ? path.resolve(process.cwd(), "data", "manual", namespace, `${stamp}-${code}-ag.html`)
      : null,
    path.resolve(process.cwd(), "data", "manual", namespace, fileName),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    const html = await readCachedHtml(candidate);

    if (html) {
      return html;
    }
  }

  return null;
}

async function writeCachedHtml(cachePath: string, html: string) {
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, html, "utf8");
}

function htmlCachePath(url: string, namespace: string) {
  const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 20);
  const slug = new URL(url).pathname
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return path.resolve(
    process.cwd(),
    "data",
    "raw",
    namespace,
    `${slug || "index"}-${hash}.html`,
  );
}

async function politeDelay(delayMs = 1_000) {
  if (delayMs <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
