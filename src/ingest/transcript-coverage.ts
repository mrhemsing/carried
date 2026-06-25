import { sqlClient } from "@/db";

type CoverageRow = {
  audio_extracted: number;
  city: string;
  earliest_meeting: Date | string | null;
  earliest_video: Date | string | null;
  latest_meeting: Date | string | null;
  latest_video: Date | string | null;
  media_assets: number;
  meetings: number;
  meetings_with_video: number;
  needs_audio: number;
  ready_needs_transcription: number;
  transcribed_assets: number;
  transcript_hours: string;
  transcript_segments: number;
};

function formatRow(row: CoverageRow) {
  return {
    city: row.city,
    videos: `${row.transcribed_assets}/${row.media_assets}`,
    audio: `${row.audio_extracted}/${row.media_assets}`,
    needsAudio: row.needs_audio,
    readyNeedsTranscription: row.ready_needs_transcription,
    segments: row.transcript_segments,
    hours: row.transcript_hours,
    meetingsWithVideo: row.meetings_with_video,
    meetings: row.meetings,
    meetingWindow: formatWindow(row.earliest_meeting, row.latest_meeting),
    videoWindow: formatWindow(row.earliest_video, row.latest_video),
  };
}

function formatWindow(start: Date | string | null, end: Date | string | null) {
  if (!start || !end) {
    return "none";
  }

  const startDate = formatDateOnly(start);
  const endDate = formatDateOnly(end);
  return startDate === endDate ? startDate : `${startDate} to ${endDate}`;
}

function formatDateOnly(value: Date | string) {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value.slice(0, 10);
}

export async function getTranscriptCoverage() {
  const cities = await sqlClient<CoverageRow[]>`
    select
      j.name as city,
      min(m.starts_at) as earliest_meeting,
      max(m.starts_at) as latest_meeting,
      min(m.starts_at) filter (where m.video_url is not null) as earliest_video,
      max(m.starts_at) filter (where m.video_url is not null) as latest_video,
      count(distinct m.id)::int as meetings,
      count(distinct m.id) filter (where m.video_url is not null)::int as meetings_with_video,
      count(distinct ma.id)::int as media_assets,
      count(distinct ma.id) filter (where ma.storage_key is not null)::int as audio_extracted,
      count(distinct ma.id) filter (where ma.storage_key is null)::int as needs_audio,
      count(distinct ma.id) filter (
        where exists (
          select 1
          from transcript_segments ts_inner
          where ts_inner.media_asset_id = ma.id
        )
      )::int as transcribed_assets,
      count(distinct ma.id) filter (
        where ma.storage_key is not null
          and not exists (
            select 1
            from transcript_segments ts_inner
            where ts_inner.media_asset_id = ma.id
          )
      )::int as ready_needs_transcription,
      count(ts.id)::int as transcript_segments,
      coalesce(
        round((sum((ts.end_seconds::numeric - ts.start_seconds::numeric)) / 3600)::numeric, 2),
        0
      )::text as transcript_hours
    from jurisdictions j
    left join governing_bodies gb on gb.jurisdiction_id = j.id
    left join meetings m on m.governing_body_id = gb.id
    left join media_assets ma on ma.meeting_id = m.id
    left join transcript_segments ts on ts.media_asset_id = ma.id
    group by j.name
    order by j.name
  `;

  const totals = await sqlClient<Array<Omit<CoverageRow, "city">>>`
    select
      count(distinct m.id)::int as meetings,
      min(m.starts_at) as earliest_meeting,
      max(m.starts_at) as latest_meeting,
      min(m.starts_at) filter (where m.video_url is not null) as earliest_video,
      max(m.starts_at) filter (where m.video_url is not null) as latest_video,
      count(distinct m.id) filter (where m.video_url is not null)::int as meetings_with_video,
      count(distinct ma.id)::int as media_assets,
      count(distinct ma.id) filter (where ma.storage_key is not null)::int as audio_extracted,
      count(distinct ma.id) filter (where ma.storage_key is null)::int as needs_audio,
      count(distinct ma.id) filter (
        where exists (
          select 1
          from transcript_segments ts_inner
          where ts_inner.media_asset_id = ma.id
        )
      )::int as transcribed_assets,
      count(distinct ma.id) filter (
        where ma.storage_key is not null
          and not exists (
            select 1
            from transcript_segments ts_inner
            where ts_inner.media_asset_id = ma.id
          )
      )::int as ready_needs_transcription,
      count(ts.id)::int as transcript_segments,
      coalesce(
        round((sum((ts.end_seconds::numeric - ts.start_seconds::numeric)) / 3600)::numeric, 2),
        0
      )::text as transcript_hours
    from meetings m
    left join media_assets ma on ma.meeting_id = m.id
    left join transcript_segments ts on ts.media_asset_id = ma.id
  `;

  return {
    cities: cities.map(formatRow),
    totals: formatRow({ city: "Total", ...totals[0] }),
  };
}

async function main() {
  const coverage = await getTranscriptCoverage();
  console.log(JSON.stringify(coverage, null, 2));
}

if (process.argv[1]?.endsWith("transcript-coverage.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sqlClient.end();
    });
}
