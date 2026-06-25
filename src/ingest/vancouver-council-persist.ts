import fs from "node:fs/promises";
import path from "node:path";

import { and, eq } from "drizzle-orm";

import { db, sqlClient } from "@/db";
import {
  agendaItems,
  documents,
  governingBodies,
  jurisdictions,
  meetings,
} from "@/db/schema";
import {
  fetchVancouverCouncilMeetings,
  parseVancouverCouncilMeeting,
  type VancouverCouncilAgendaItem,
  type VancouverCouncilDocument,
  type VancouverCouncilMeeting,
  type VancouverMeetingKind,
} from "@/ingest/vancouver-council";

type PersistResult = {
  meetingsSeen: number;
  meetingsInserted: number;
  documentsInserted: number;
  agendaItemsInserted: number;
};

const CODE_TO_KIND: Record<string, VancouverMeetingKind> = {
  cfsc: "standing-committee",
  phea: "public-hearing",
  pspc: "standing-committee",
  regu: "council",
};

export async function persistVancouverCouncilMeetings(options: {
  from?: Date;
  to?: Date;
  kinds?: VancouverMeetingKind[];
  limit?: number;
  meetings?: VancouverCouncilMeeting[];
} = {}): Promise<PersistResult> {
  const normalizedMeetings = options.meetings ?? (await fetchVancouverCouncilMeetings(options));
  const jurisdictionId = await ensureVancouverJurisdiction();
  const result: PersistResult = {
    meetingsSeen: normalizedMeetings.length,
    meetingsInserted: 0,
    documentsInserted: 0,
    agendaItemsInserted: 0,
  };

  for (const meeting of normalizedMeetings) {
    const bodyId = await ensureGoverningBody(jurisdictionId, meeting);
    const persistedMeeting = await ensureMeeting(bodyId, meeting);

    if (persistedMeeting.inserted) {
      result.meetingsInserted += 1;
    }

    const documentIds = new Map<string, string>();

    for (const document of meeting.documents) {
      const persistedDocument = await ensureDocument(persistedMeeting.id, document);

      if (persistedDocument.inserted) {
        result.documentsInserted += 1;
      }

      documentIds.set(document.sourceUrl, persistedDocument.id);
    }

    for (const item of meeting.agendaItems) {
      const inserted = await ensureAgendaItem(
        persistedMeeting.id,
        documentIds,
        item,
        meeting.agendaUrl,
      );

      if (inserted) {
        result.agendaItemsInserted += 1;
      }
    }
  }

  return result;
}

async function ensureVancouverJurisdiction() {
  const existing = await db.query.jurisdictions.findFirst({
    where: eq(jurisdictions.slug, "vancouver"),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(jurisdictions)
      .set({
        platform: "Custom + Open Data",
        websiteUrl: "https://council.vancouver.ca",
        connectorStatus: "active spike",
        updatedAt: new Date(),
      })
      .where(eq(jurisdictions.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db
    .insert(jurisdictions)
    .values({
      name: "Vancouver",
      slug: "vancouver",
      platform: "Custom + Open Data",
      websiteUrl: "https://council.vancouver.ca",
      population: "662K",
      priority: "P1",
      connectorStatus: "active spike",
    })
    .returning({ id: jurisdictions.id });

  return inserted.id;
}

async function ensureGoverningBody(
  jurisdictionId: string,
  meeting: VancouverCouncilMeeting,
) {
  const existing = await db.query.governingBodies.findFirst({
    where: and(
      eq(governingBodies.jurisdictionId, jurisdictionId),
      eq(governingBodies.slug, meeting.governingBodySlug),
    ),
    columns: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const [inserted] = await db
    .insert(governingBodies)
    .values({
      jurisdictionId,
      name: meeting.governingBodyName,
      slug: meeting.governingBodySlug,
      bodyType: meeting.kind === "standing-committee" ? "committee" : "council",
      sourceUrl: meeting.sourceUrl,
    })
    .returning({ id: governingBodies.id });

  return inserted.id;
}

async function ensureMeeting(
  governingBodyId: string,
  meeting: VancouverCouncilMeeting,
) {
  const existing = await db.query.meetings.findFirst({
    where: and(
      eq(meetings.governingBodyId, governingBodyId),
      eq(meetings.sourceExternalId, meeting.externalId),
    ),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(meetings)
      .set({
        title: meeting.title,
        status: meeting.status,
        startsAt: meeting.startsAt ? new Date(meeting.startsAt) : null,
        sourceUrl: meeting.sourceUrl,
        agendaUrl: meeting.agendaUrl,
        videoUrl: meeting.videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, existing.id));
    return { id: existing.id, inserted: false };
  }

  const [inserted] = await db
    .insert(meetings)
    .values({
      governingBodyId,
      title: meeting.title,
      status: meeting.status,
      startsAt: meeting.startsAt ? new Date(meeting.startsAt) : null,
      sourceUrl: meeting.sourceUrl,
      agendaUrl: meeting.agendaUrl,
      videoUrl: meeting.videoUrl,
      sourceExternalId: meeting.externalId,
    })
    .returning({ id: meetings.id });

  return { id: inserted.id, inserted: true };
}

async function ensureDocument(
  meetingId: string,
  document: VancouverCouncilDocument,
) {
  const existing = await db.query.documents.findFirst({
    where: and(
      eq(documents.meetingId, meetingId),
      eq(documents.sourceUrl, document.sourceUrl),
    ),
    columns: { id: true },
  });

  if (existing) {
    return { id: existing.id, inserted: false };
  }

  const [inserted] = await db
    .insert(documents)
    .values({
      meetingId,
      type: document.type,
      title: document.title,
      sourceUrl: document.sourceUrl,
      sourceMetadata: { format: document.format, sourcePlatform: "Vancouver Council" },
    })
    .returning({ id: documents.id });

  return { id: inserted.id, inserted: true };
}

async function ensureAgendaItem(
  meetingId: string,
  documentIds: Map<string, string>,
  item: VancouverCouncilAgendaItem,
  fallbackSourceUrl: string,
) {
  const existing = await db.query.agendaItems.findFirst({
    where: and(
      eq(agendaItems.meetingId, meetingId),
      eq(agendaItems.itemNumber, item.itemNumber),
    ),
    columns: { id: true },
  });
  const documentId = item.documents
    .map((document) => documentIds.get(document.sourceUrl))
    .find((id): id is string => Boolean(id));
  const sourceUrl = item.sourceUrl || fallbackSourceUrl;

  if (existing) {
    await db
      .update(agendaItems)
      .set({
        title: item.title,
        documentId: documentId ?? null,
        sourceUrl,
        updatedAt: new Date(),
      })
      .where(eq(agendaItems.id, existing.id));
    return false;
  }

  await db.insert(agendaItems).values({
    meetingId,
    documentId: documentId ?? null,
    itemNumber: item.itemNumber,
    title: item.title,
    sourceUrl,
  });

  return true;
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readKinds() {
  const value = readArg("--kinds");
  return value ? (value.split(",") as VancouverMeetingKind[]) : undefined;
}

async function readFixtureMeetings() {
  const fixture = readArg("--fixture");
  const fixtureDir = readArg("--fixture-dir");

  if (fixture) {
    return [await readFixtureMeeting(fixture)];
  }

  if (!fixtureDir) {
    return undefined;
  }

  const directory = path.resolve(process.cwd(), fixtureDir);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html"))
    .map((entry) => path.join(fixtureDir, entry.name))
    .sort();
  const meetings: VancouverCouncilMeeting[] = [];

  for (const file of files) {
    meetings.push(await readFixtureMeeting(file));
  }

  return meetings;
}

async function readFixtureMeeting(fixture: string) {
  const inferred = inferFixtureCandidate(fixture);
  return parseVancouverCouncilMeeting(
    await fs.readFile(path.resolve(process.cwd(), fixture), "utf8"),
    readArg("--url") ?? inferred.url,
    {
      code: readArg("--code") ?? inferred.code,
      date: new Date(readArg("--date") ?? inferred.date),
      kind: (readArg("--kind") as VancouverMeetingKind | undefined) ?? inferred.kind,
    },
  );
}

function inferFixtureCandidate(fixture: string) {
  const name = path.basename(fixture);
  const match = name.match(/^(\d{8})-([a-z]+)-ag\.html$/i);

  if (!match) {
    throw new Error(
      `Cannot infer Vancouver fixture metadata from ${name}. Use YYYYMMDD-code-ag.html, for example 20260505-phea-ag.html.`,
    );
  }

  const [, stamp, rawCode] = match;
  const code = rawCode.toLowerCase();
  const kind = CODE_TO_KIND[code];

  if (!kind) {
    throw new Error(`Unknown Vancouver meeting code in fixture filename: ${code}`);
  }

  return {
    code,
    date: `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T12:00:00Z`,
    kind,
    url: `https://council.vancouver.ca/${stamp}/${code}${stamp}ag.htm`,
  };
}

async function main() {
  const meetings = await readFixtureMeetings();
  const result = await persistVancouverCouncilMeetings({
    from: readArg("--from") ? new Date(readArg("--from")!) : undefined,
    to: readArg("--to") ? new Date(readArg("--to")!) : undefined,
    kinds: readKinds(),
    limit: readArg("--limit") ? Number(readArg("--limit")) : undefined,
    meetings,
  });

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith("vancouver-council-persist.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sqlClient.end();
    });
}
