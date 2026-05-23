export type VancouverVoteRecord = {
  meeting_id: number;
  meeting_type: string;
  vote_date: string;
  vote_number: string;
  agenda_description: string;
  vote_start_date_time: string;
  council_member: string;
  vote: string;
  decision: string;
  vote_detail_id: string;
};

export type VancouverVoteMotion = {
  externalId: string;
  meetingExternalId: string;
  meetingType: string;
  voteDate: string;
  voteStartedAt: string;
  title: string;
  decision: string;
  votes: {
    councilMember: string;
    vote: string;
    voteDetailId: string;
  }[];
};

type VancouverOpenDataResponse = {
  total_count: number;
  results: VancouverVoteRecord[];
};

const DATASET_ID = "council-voting-records";
const API_BASE =
  "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets";

export async function fetchVancouverVoteRecords(options: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  where?: string;
} = {}) {
  const url = new URL(`${API_BASE}/${DATASET_ID}/records`);
  url.searchParams.set("limit", String(options.limit ?? 20));
  url.searchParams.set("offset", String(options.offset ?? 0));
  url.searchParams.set(
    "order_by",
    options.orderBy ?? "vote_start_date_time desc",
  );

  if (options.where) {
    url.searchParams.set("where", options.where);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Vancouver open data fetch failed: ${response.status} ${await response.text()}`,
    );
  }

  return (await response.json()) as VancouverOpenDataResponse;
}

export function normalizeVancouverVoteMotions(records: VancouverVoteRecord[]) {
  const motions = new Map<string, VancouverVoteMotion>();

  for (const record of records) {
    const externalId = `${record.meeting_id}-${record.vote_number}`;
    const existing = motions.get(externalId);

    if (existing) {
      existing.votes.push({
        councilMember: record.council_member,
        vote: record.vote,
        voteDetailId: record.vote_detail_id,
      });
      continue;
    }

    motions.set(externalId, {
      externalId,
      meetingExternalId: String(record.meeting_id),
      meetingType: record.meeting_type,
      voteDate: record.vote_date,
      voteStartedAt: record.vote_start_date_time,
      title: record.agenda_description,
      decision: record.decision,
      votes: [
        {
          councilMember: record.council_member,
          vote: record.vote,
          voteDetailId: record.vote_detail_id,
        },
      ],
    });
  }

  return [...motions.values()];
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const payload = await fetchVancouverVoteRecords({
    limit: Number(readArg("--limit") ?? 25),
    where: readArg("--where"),
  });
  const motions = normalizeVancouverVoteMotions(payload.results);

  console.log(
    JSON.stringify(
      {
        totalCount: payload.total_count,
        recordCount: payload.results.length,
        motionCount: motions.length,
        sampleMotion: motions[0] ?? null,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1]?.endsWith("vancouver-open-data.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
