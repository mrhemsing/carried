import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT_DIR = "data/manual/vancouver/inbox";
const DEFAULT_OUTPUT_DIR = "data/manual/vancouver";
const VALID_CODES = new Set(["cfsc", "phea", "pspc", "regu"]);

type NormalizedFile = {
  source: string;
  destination: string;
  url: string;
};

type SkippedFile = {
  source: string;
  reason: string;
};

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const inputDir = path.resolve(process.cwd(), readArg("--input") ?? DEFAULT_INPUT_DIR);
  const outputDir = path.resolve(process.cwd(), readArg("--output") ?? DEFAULT_OUTPUT_DIR);
  const normalized: NormalizedFile[] = [];
  const skipped: SkippedFile[] = [];

  await fs.mkdir(inputDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const entries = await fs.readdir(inputDir, { withFileTypes: true });
  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html"))
    .map((entry) => entry.name)
    .sort();

  for (const file of htmlFiles) {
    const sourcePath = path.join(inputDir, file);
    const html = await fs.readFile(sourcePath, "utf8");
    const source = path.relative(process.cwd(), sourcePath);

    if (isBlockedOrMissingPage(html)) {
      skipped.push({ source, reason: "blocked-or-missing-page" });
      continue;
    }

    const inferred = inferAgendaUrl(html);

    if (!inferred) {
      skipped.push({ source, reason: "could-not-infer-agenda-url" });
      continue;
    }

    const destinationPath = path.join(outputDir, `${inferred.stamp}-${inferred.code}-ag.html`);

    if (path.resolve(sourcePath) !== path.resolve(destinationPath)) {
      await fs.copyFile(sourcePath, destinationPath);
    }

    normalized.push({
      source,
      destination: path.relative(process.cwd(), destinationPath),
      url: inferred.url,
    });
  }

  console.log(JSON.stringify({ normalized, skipped }, null, 2));
}

function inferAgendaUrl(html: string) {
  const match = html.match(
    /https?:\/\/council\.vancouver\.ca\/(\d{8})\/([a-z]+)\1ag\.htm/i,
  );

  if (!match) {
    return null;
  }

  const [, stamp, rawCode] = match;
  const code = rawCode.toLowerCase();

  if (!VALID_CODES.has(code)) {
    return null;
  }

  return {
    stamp,
    code,
    url: `https://council.vancouver.ca/${stamp}/${code}${stamp}ag.htm`,
  };
}

function isBlockedOrMissingPage(html: string) {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("sorry, you have been blocked") ||
    normalized.includes("document you're looking for can't be found") ||
    normalized.includes("the document you are looking for can't be found")
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
