import { createReadStream, existsSync } from "node:fs";
import { mkdir, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { spawn } from "node:child_process";

import OpenAI from "openai";

import { db, sqlClient } from "@/db";
import { transcriptSegments } from "@/db/schema";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static") as string | null;
const defaultChunkSeconds = 20 * 60;

type TranscriptSegmentInput = {
  start: number;
  end: number;
  text: string;
};

type TranscriptionResult = {
  processed: number;
  transcribed: number;
  skipped: number;
  errors: Array<{ mediaAssetId: string; message: string; audioPath: string | null }>;
};

export async function transcribeQueuedAudio(options: { limit?: number } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to transcribe audio.");
  }
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not provide an ffmpeg binary path.");
  }

  const client = new OpenAI({ apiKey });
  const ffmpegBinary = ffmpegPath;
  const rows = await sqlClient<Array<{ id: string; storage_key: string }>>`
    select ma.id, ma.storage_key
    from media_assets ma
    where ma.storage_key is not null
      and not exists (
        select 1
        from transcript_segments ts
        where ts.media_asset_id = ma.id
      )
    order by ma.updated_at asc
    limit ${options.limit ?? 1}
  `;

  const result: TranscriptionResult = {
    processed: 0,
    transcribed: 0,
    skipped: 0,
    errors: [],
  };

  for (const mediaAsset of rows) {
    result.processed += 1;

    const audioPath = mediaAsset.storage_key
      ? path.resolve(process.cwd(), mediaAsset.storage_key)
      : null;

    if (!audioPath || !existsSync(audioPath)) {
      result.errors.push({
        audioPath,
        mediaAssetId: mediaAsset.id,
        message: "Audio file missing.",
      });
      continue;
    }

    try {
      const segments = await transcribeAudioFile(client, audioPath, {
        ffmpegBinary,
        mediaAssetId: mediaAsset.id,
      });
      await insertTranscriptSegments(mediaAsset.id, segments);
      result.transcribed += 1;
    } catch (error) {
      result.errors.push({
        audioPath,
        mediaAssetId: mediaAsset.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

async function transcribeAudioFile(
  client: OpenAI,
  audioPath: string,
  options: { ffmpegBinary: string; mediaAssetId: string },
) {
  const model = process.env.OPENAI_TRANSCRIPTION_MODEL ?? "whisper-1";
  const chunkSeconds =
    Number(process.env.TRANSCRIPTION_CHUNK_SECONDS) || defaultChunkSeconds;
  const chunks = await chunkAudioFile({
    audioPath,
    chunkSeconds,
    ffmpegBinary: options.ffmpegBinary,
    mediaAssetId: options.mediaAssetId,
  });
  const segments: TranscriptSegmentInput[] = [];
  const chunkDir = path.dirname(chunks[0].path);

  try {
    for (const chunk of chunks) {
      const response = await client.audio.transcriptions.create({
        file: createReadStream(chunk.path),
        model,
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      });

      segments.push(...readSegments(response, chunk.offsetSeconds));
    }
  } finally {
    await rm(chunkDir, {
      force: true,
      recursive: true,
    });
  }

  return segments;
}

function readSegments(response: unknown, offsetSeconds: number) {
  const typed = response as {
    segments?: Array<{ end?: number; start?: number; text?: string }>;
    text?: string;
  };

  if (Array.isArray(typed.segments) && typed.segments.length > 0) {
    return typed.segments
      .map((segment) => ({
        end: Number(segment.end) + offsetSeconds,
        start: Number(segment.start) + offsetSeconds,
        text: String(segment.text ?? "").trim(),
      }))
      .filter((segment) => segment.text);
  }

  const text = typed.text ? String(typed.text).trim() : "";
  return text ? [{ end: offsetSeconds, start: offsetSeconds, text }] : [];
}

async function chunkAudioFile({
  audioPath,
  chunkSeconds,
  ffmpegBinary,
  mediaAssetId,
}: {
  audioPath: string;
  chunkSeconds: number;
  ffmpegBinary: string;
  mediaAssetId: string;
}) {
  const chunkDir = path.join(
    process.cwd(),
    "data",
    "media",
    "chunks",
    mediaAssetId,
  );
  await rm(chunkDir, { force: true, recursive: true });
  await mkdir(chunkDir, { recursive: true });

  await runFfmpeg(ffmpegBinary, [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-y",
    "-i",
    audioPath,
    "-f",
    "segment",
    "-segment_time",
    String(chunkSeconds),
    "-c",
    "copy",
    path.join(chunkDir, "chunk-%03d.mp3"),
  ]);

  const chunkFiles = (await readdir(chunkDir))
    .filter((fileName) => fileName.endsWith(".mp3"))
    .sort();

  if (chunkFiles.length === 0) {
    throw new Error(`No audio chunks were created for ${audioPath}.`);
  }

  return chunkFiles.map((fileName, index) => ({
    offsetSeconds: index * chunkSeconds,
    path: path.join(chunkDir, fileName),
  }));
}

async function runFfmpeg(ffmpegBinary: string, args: string[]) {
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

async function insertTranscriptSegments(
  mediaAssetId: string,
  segments: TranscriptSegmentInput[],
) {
  if (segments.length === 0) {
    return;
  }

  await db.insert(transcriptSegments).values(
    segments.map((segment) => ({
      endSeconds: segment.end.toFixed(2),
      mediaAssetId,
      startSeconds: segment.start.toFixed(2),
      text: segment.text,
    })),
  );
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
  const result = await transcribeQueuedAudio({
    limit: readNumericArg("--limit") ?? 1,
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith("openai-transcribe.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sqlClient.end();
    });
}
