import { and, eq, isNotNull } from "drizzle-orm";

import { db, sqlClient } from "@/db";
import { mediaAssets, meetings } from "@/db/schema";

type MediaAudit = {
  meetings: number;
  meetingsWithVideo: number;
  mediaAssets: number;
  transcriptSegments: number;
};

export async function backfillVideoMediaAssets() {
  const rows = await db
    .select({
      id: meetings.id,
      videoUrl: meetings.videoUrl,
    })
    .from(meetings)
    .where(isNotNull(meetings.videoUrl));

  let inserted = 0;

  for (const row of rows) {
    if (!row.videoUrl) {
      continue;
    }

    const existing = await db.query.mediaAssets.findFirst({
      where: and(
        eq(mediaAssets.meetingId, row.id),
        eq(mediaAssets.mediaType, "video"),
        eq(mediaAssets.sourceUrl, row.videoUrl),
      ),
      columns: { id: true },
    });

    if (existing) {
      continue;
    }

    await db.insert(mediaAssets).values({
      meetingId: row.id,
      mediaType: "video",
      sourceUrl: row.videoUrl,
    });
    inserted += 1;
  }

  return {
    inserted,
    meetingsWithVideo: rows.length,
  };
}

export async function getMediaAudit(): Promise<MediaAudit> {
  const [meetingRows, videoRows, assetRows, transcriptRows] = await Promise.all([
    sqlClient`select count(*)::int as count from meetings`,
    sqlClient`select count(*)::int as count from meetings where video_url is not null`,
    sqlClient`select count(*)::int as count from media_assets`,
    sqlClient`select count(*)::int as count from transcript_segments`,
  ]);

  return {
    meetings: meetingRows[0].count,
    meetingsWithVideo: videoRows[0].count,
    mediaAssets: assetRows[0].count,
    transcriptSegments: transcriptRows[0].count,
  };
}

async function main() {
  const shouldBackfill = process.argv.includes("--backfill-video-links");

  const result = shouldBackfill
    ? await backfillVideoMediaAssets()
    : { inserted: 0, meetingsWithVideo: 0 };
  const audit = await getMediaAudit();

  console.log(
    JSON.stringify(
      {
        ...result,
        audit,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1]?.endsWith("media-assets.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sqlClient.end();
    });
}
