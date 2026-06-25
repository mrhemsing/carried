import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { spawn } from "node:child_process";

import { eq, isNull } from "drizzle-orm";

import { db, sqlClient } from "@/db";
import { mediaAssets } from "@/db/schema";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static") as string | null;

type ResolvedEscribeMedia = {
  clientId: string;
  fileName: string;
  directMp4Url: string;
  hlsUrl: string;
  playerUrl: string;
};

type ExtractAudioOptions = {
  limit?: number;
  maxSeconds?: number;
  outputDir?: string;
};

type ExtractAudioResult = {
  processed: number;
  extracted: number;
  skipped: number;
  errors: Array<{ mediaAssetId: string; message: string; sourceUrl: string | null }>;
  assets: Array<{
    mediaAssetId: string;
    sourceUrl: string | null;
    audioPath: string;
    dbUpdated: boolean;
    mediaUrl: string;
  }>;
};

export async function resolveEscribeMedia(
  playerUrl: string,
): Promise<ResolvedEscribeMedia> {
  const html = await requestText(playerUrl);
  const clientId = readDataAttribute(html, "client_id");
  const fileName = readDataAttribute(html, "file_name");

  if (!clientId || !fileName) {
    throw new Error("Could not find eScribe player client_id/file_name metadata.");
  }

  const encodedFileName = encodePathSegment(fileName);

  return {
    clientId,
    fileName,
    directMp4Url: `https://video.isilive.ca/${clientId}/${encodedFileName}`,
    hlsUrl: `https://video.isilive.ca/vod/_definst_/mp4:${clientId}/${encodedFileName}/playlist.m3u8`,
    playerUrl,
  };
}

export async function extractAudioForQueuedMedia(
  options: ExtractAudioOptions = {},
): Promise<ExtractAudioResult> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not provide an ffmpeg binary path.");
  }
  const ffmpegBinary = ffmpegPath;

  const outputDir = options.outputDir ?? path.join(process.cwd(), "data", "media", "audio");
  await mkdir(outputDir, { recursive: true });

  const rows = await db.query.mediaAssets.findMany({
    where: isNull(mediaAssets.storageKey),
    limit: options.limit ?? 1,
    columns: {
      id: true,
      sourceUrl: true,
    },
  });

  const result: ExtractAudioResult = {
    processed: 0,
    extracted: 0,
    skipped: 0,
    errors: [],
    assets: [],
  };

  for (const mediaAsset of rows) {
    result.processed += 1;

    if (!mediaAsset.sourceUrl) {
      result.skipped += 1;
      continue;
    }

    try {
      const resolved = await resolveMediaUrl(mediaAsset.sourceUrl);
      const audioPath = path.join(outputDir, `${mediaAsset.id}.mp3`);

      await runFfmpeg({
        ffmpegBinary,
        inputUrl: resolved.mediaUrl,
        outputPath: audioPath,
        maxSeconds: options.maxSeconds,
      });

      const dbUpdated = !options.maxSeconds;

      if (dbUpdated) {
        await db
          .update(mediaAssets)
          .set({
            storageKey: path.relative(process.cwd(), audioPath).replaceAll("\\", "/"),
            updatedAt: new Date(),
          })
          .where(eq(mediaAssets.id, mediaAsset.id));
      }

      result.extracted += 1;
      result.assets.push({
        audioPath,
        dbUpdated,
        mediaAssetId: mediaAsset.id,
        mediaUrl: resolved.mediaUrl,
        sourceUrl: mediaAsset.sourceUrl,
      });
    } catch (error) {
      result.errors.push({
        mediaAssetId: mediaAsset.id,
        message: error instanceof Error ? error.message : String(error),
        sourceUrl: mediaAsset.sourceUrl,
      });
    }
  }

  return result;
}

async function resolveMediaUrl(sourceUrl: string) {
  if (sourceUrl.includes("ISIStandAlonePlayer.aspx")) {
    const resolved = await resolveEscribeMedia(sourceUrl);
    await assertUrlAvailable(resolved.directMp4Url);
    return { mediaUrl: resolved.directMp4Url, resolved };
  }

  await assertUrlAvailable(sourceUrl);
  return { mediaUrl: sourceUrl, resolved: null };
}

async function assertUrlAvailable(url: string) {
  const statusCode = await requestHead(url);
  if (statusCode < 200 || statusCode >= 400) {
    throw new Error(`Media URL unavailable: ${statusCode} ${url}`);
  }
}

async function requestText(url: string) {
  return new Promise<string>((resolve, reject) => {
    https
      .get(url, { rejectUnauthorized: false }, (response) => {
        const statusCode = response.statusCode ?? 0;
        if (statusCode < 200 || statusCode >= 400) {
          response.resume();
          reject(new Error(`Request failed with status ${statusCode}: ${url}`));
          return;
        }

        response.setEncoding("utf8");
        let body = "";
        response.on("data", (chunk: string) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

async function requestHead(url: string) {
  return new Promise<number>((resolve, reject) => {
    const request = https.request(
      url,
      { method: "HEAD", rejectUnauthorized: false },
      (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      },
    );

    request.on("error", reject);
    request.end();
  });
}

function readDataAttribute(html: string, name: string) {
  const pattern = new RegExp(`data-${name}="([^"]+)"`);
  return html.match(pattern)?.[1] ? decodeHtml(html.match(pattern)![1]) : null;
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function encodePathSegment(value: string) {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function runFfmpeg({
  ffmpegBinary,
  inputUrl,
  maxSeconds,
  outputPath,
}: {
  ffmpegBinary: string;
  inputUrl: string;
  maxSeconds?: number;
  outputPath: string;
}) {
  const args = [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-y",
    "-i",
    inputUrl,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "64k",
  ];

  if (maxSeconds && maxSeconds > 0) {
    args.push("-t", String(maxSeconds));
  }

  args.push(outputPath);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegBinary, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`));
      }
    });
  });
}

function readNumericArg(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) ? value : undefined;
}

async function main() {
  const shouldExtractAudio = process.argv.includes("--extract-audio");
  const shouldResolveOnly = process.argv.includes("--resolve-only");
  const sourceUrl = process.argv[process.argv.indexOf("--source-url") + 1];

  if (shouldResolveOnly && sourceUrl) {
    console.log(JSON.stringify(await resolveEscribeMedia(sourceUrl), null, 2));
    return;
  }

  if (shouldExtractAudio) {
    const result = await extractAudioForQueuedMedia({
      limit: readNumericArg("--limit") ?? 1,
      maxSeconds: readNumericArg("--max-seconds"),
    });
    console.log(JSON.stringify(result, null, 2));
  }
}

if (process.argv[1]?.endsWith("escribe-media.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sqlClient.end();
    });
}
