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
  ESCRIBE_TENANTS,
  fetchEscribeAgendaHtml,
  fetchEscribeCalendarMeetings,
  normalizeEscribeMeetings,
  parseEscribeAgendaDocumentLinks,
  parseEscribeAgendaItems,
  type NormalizedMeeting,
} from "@/ingest/escribe";

type PersistResult = {
  meetingsSeen: number;
  meetingsInserted: number;
  documentsInserted: number;
  agendaItemsInserted: number;
};

export async function persistEscribeMeetings(
  tenantKey: string,
  range: { from: string; to: string },
  options: { limit?: number } = {},
): Promise<PersistResult> {
  const tenant = ESCRIBE_TENANTS[tenantKey];

  if (!tenant) {
    throw new Error(`Unknown eScribe tenant: ${tenantKey}`);
  }

  const rawMeetings = await fetchEscribeCalendarMeetings(tenant, range);
  const normalizedMeetings = normalizeEscribeMeetings(tenant, rawMeetings).slice(
    0,
    options.limit,
  );
  const jurisdictionId = await ensureJurisdiction(tenant);
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
      const persistedDocument = await ensureDocument(
        persistedMeeting.id,
        document,
      );

      if (persistedDocument.inserted) {
        result.documentsInserted += 1;
      }

      documentIds.set(document.sourceUrl, persistedDocument.id);
    }

    if (meeting.agendaUrl) {
      const agendaHtml = await fetchEscribeAgendaHtml(tenant, meeting);
      const agendaDocumentId = documentIds.get(meeting.agendaUrl);

      if (agendaHtml) {
        const linkedDocuments = parseEscribeAgendaDocumentLinks(
          tenant,
          agendaHtml,
        );

        for (const document of linkedDocuments) {
          const persistedDocument = await ensureDocument(
            persistedMeeting.id,
            document,
          );

          if (persistedDocument.inserted) {
            result.documentsInserted += 1;
          }

          documentIds.set(document.sourceUrl, persistedDocument.id);
        }

        const parsedItems = parseEscribeAgendaItems(agendaHtml, tenant);

        for (const parsedItem of parsedItems) {
          const primaryDocumentUrl =
            parsedItem.documents.find((document) =>
              documentIds.has(document.sourceUrl),
            )?.sourceUrl ?? meeting.agendaUrl;
          const inserted = await ensureAgendaItem(
            persistedMeeting.id,
            primaryDocumentUrl ? documentIds.get(primaryDocumentUrl) : agendaDocumentId,
            parsedItem,
            primaryDocumentUrl ?? meeting.agendaUrl,
          );

          if (inserted) {
            result.agendaItemsInserted += 1;
          }
        }
      }
    }
  }

  return result;
}

async function ensureJurisdiction(
  tenant: (typeof ESCRIBE_TENANTS)[keyof typeof ESCRIBE_TENANTS],
) {
  const existing = await db.query.jurisdictions.findFirst({
    where: eq(jurisdictions.slug, tenant.jurisdictionSlug),
    columns: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const [inserted] = await db
    .insert(jurisdictions)
    .values({
      name: titleCase(tenant.jurisdictionSlug),
      slug: tenant.jurisdictionSlug,
      platform: "eScribe",
      websiteUrl: tenant.baseUrl,
      connectorStatus: "active spike",
    })
    .returning({ id: jurisdictions.id });

  return inserted.id;
}

async function ensureGoverningBody(
  jurisdictionId: string,
  meeting: NormalizedMeeting,
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
      bodyType: meeting.governingBodySlug.includes("council")
        ? "council"
        : "committee",
      sourceUrl: meeting.sourceUrl,
    })
    .returning({ id: governingBodies.id });

  return inserted.id;
}

async function ensureMeeting(governingBodyId: string, meeting: NormalizedMeeting) {
  const existing = await db.query.meetings.findFirst({
    where: and(
      eq(meetings.governingBodyId, governingBodyId),
      eq(meetings.sourceExternalId, meeting.externalId),
    ),
    columns: { id: true },
  });

  if (existing) {
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
  document: NormalizedMeeting["documents"][number],
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
      sourceMetadata: { format: document.format },
    })
    .returning({ id: documents.id });

  return { id: inserted.id, inserted: true };
}

async function ensureAgendaItem(
  meetingId: string,
  documentId: string | undefined,
  item: { itemNumber: string; title: string },
  sourceUrl: string,
) {
  const existing = await db.query.agendaItems.findFirst({
    where: and(
      eq(agendaItems.meetingId, meetingId),
      eq(agendaItems.itemNumber, item.itemNumber),
    ),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(agendaItems)
      .set({
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

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const result = await persistEscribeMeetings(
    readArg("--tenant") ?? "burnaby",
    {
      from: readArg("--from") ?? "2026-02-01T00:00:00-08:00",
      to: readArg("--to") ?? "2026-02-28T23:59:59-08:00",
    },
    {
      limit: Number(readArg("--limit") ?? 5),
    },
  );

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith("escribe-persist.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sqlClient.end();
    });
}
