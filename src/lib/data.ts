import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";

import {
  agendaItems,
  documents,
  governingBodies,
  jurisdictions,
  mediaAssets,
  meetings as dbMeetings,
  transcriptSegments,
} from "@/db/schema";
import {
  alerts,
  coverageStats,
  dashboardCards,
  meetings as mockMeetings,
  municipalities as mockMunicipalities,
  personas,
  projects,
  sampleResults,
} from "@/lib/mock-data";

type MeetingView = (typeof mockMeetings)[number] & {
  agendaUrl?: string | null;
  id?: string;
  agendaItemDetails?: Array<{
    body: string | null;
    bodySections: string[];
    title: string;
  }>;
  sourceDocuments?: Array<{
    sourceUrl: string;
    title: string;
    type: string;
  }>;
  sourceUrl?: string;
  sourceDocumentCount?: number;
  mediaAssetCount?: number;
  transcriptSegmentCount?: number;
  videoUrl?: string | null;
  readableItemCount?: number;
};

type SearchResultView = (typeof sampleResults)[number] & {
  bodySections?: string[];
  href?: string;
  sourceUrl?: string | null;
  timestamp?: string;
  videoUrl?: string | null;
};

type MunicipalityView = (typeof mockMunicipalities)[number];

async function getDatabase() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const database = await import("@/db");
    return database.db;
  } catch (error) {
    console.warn("Database unavailable, using mock data.", error);
    return null;
  }
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "America/Vancouver",
    year: "numeric",
  }).format(date);
}

function formatTimestamp(seconds: string | null | undefined) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.max(0, Math.floor(value));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;

  return [hours, minutes, remainingSeconds]
    .filter((part, index) => index > 0 || part > 0)
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

function excerpt(value: string | null | undefined, limit = 320) {
  if (!value) {
    return null;
  }

  const normalized = cleanExtractedText(value);
  if (!normalized) {
    return null;
  }

  return normalized.length > limit
    ? `${normalized.slice(0, limit).trimEnd()}...`
    : normalized;
}

function readableSections(value: string | null | undefined, limit = 1100) {
  const normalized = excerpt(value, limit);
  if (!normalized) {
    return [];
  }

  const sentences = normalized
    .replace(/\s+-\s+/g, ". ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return [normalized];
  }

  const sections: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > 260 && current) {
      sections.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current) {
    sections.push(current);
  }

  return sections.slice(0, 5);
}

function queryTerms(query: string | null | undefined) {
  return (query ?? "")
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1);
}

function transcriptSearchFilter(query: string | null | undefined) {
  const terms = queryTerms(query);
  if (terms.length === 0) {
    return undefined;
  }

  return and(
    ...terms.map((term) =>
      or(
        ilike(transcriptSegments.text, `%${term}%`),
        ilike(transcriptSegments.speaker, `%${term}%`),
        ilike(dbMeetings.title, `%${term}%`),
        ilike(jurisdictions.name, `%${term}%`),
      ),
    ),
  );
}

function matchesQuery(
  query: string | null | undefined,
  values: Array<string | null | undefined>,
) {
  const terms = queryTerms(query);
  if (terms.length === 0) {
    return true;
  }

  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function excerptForQuery(
  value: string | null | undefined,
  query: string | null | undefined,
  limit = 360,
) {
  if (!value) {
    return null;
  }

  const normalized = cleanExtractedText(value);
  const firstTerm = queryTerms(query)[0];
  if (!firstTerm) {
    return excerpt(normalized, limit);
  }

  const index = normalized.toLowerCase().indexOf(firstTerm);
  if (index < 0) {
    return excerpt(normalized, limit);
  }

  const start = Math.max(0, index - 80);
  const prefix = start > 0 ? "... " : "";
  return excerpt(`${prefix}${normalized.slice(start)}`, limit);
}

function readableSectionsForQuery(
  value: string | null | undefined,
  query: string | null | undefined,
  limit = 900,
) {
  return readableSections(excerptForQuery(value, query, limit), limit);
}

function cleanExtractedText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/&#58;/g, ":")
    .replace(/No Item Selected This item has no attachments\./gi, " ")
    .replace(/No Item Attachments\s*\(\d+\)\s*\|\s*Public Comments\s*\(\d+\)/gi, " ")
    .replace(/Attachments\s*\|\s*Public Comments/gi, " ")
    .replace(/This item has no public comment command to move to the parent document or exit the frame\./gi, " ")
    .replace(/Title\s*[×x]\s*close/gi, " ")
    .replace(/Details\s*[×x]\s*close[\s\S]*?(?=\b[A-Z][A-Z ]{4,}\b|$)/gi, " ")
    .replace(/Powered by eSCRIBE Software Ltd\./gi, " ")
    .replace(/\bPublic Comments:\s*/gi, " ")
    .replace(
      /This is an embedded content area\. To exit and return to the dialog, use your screen reader.+?(?=[A-Z][A-Z ]{4,}|$)/gi,
      " ",
    )
    .replace(/\bSelected\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+\d+(?:\.\d+)?\s*$/g, "")
    .trim();
}

function slugify(parts: Array<string | Date | null | undefined>) {
  return parts
    .filter(Boolean)
    .map((part) => (part instanceof Date ? part.toISOString().slice(0, 10) : part))
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function meetingSlug(row: {
  id: string;
  jurisdictionSlug: string | null;
  startsAt: Date | null;
  title: string;
}) {
  return slugify([
    row.jurisdictionSlug,
    row.title,
    row.startsAt,
    row.id.slice(0, 8),
  ]);
}

export async function getCoverageStats() {
  const db = await getDatabase();

  if (db) {
    try {
      const [jurisdictionRows, meetingRows, documentRows, agendaItemRows] =
        await Promise.all([
          db.select({ id: jurisdictions.id }).from(jurisdictions),
          db.select({ id: dbMeetings.id }).from(dbMeetings),
          db.select({ id: documents.id }).from(documents),
          db.select({ id: agendaItems.id }).from(agendaItems),
        ]);

      return [
        { label: "DB jurisdictions", value: String(jurisdictionRows.length) },
        { label: "DB meetings", value: String(meetingRows.length) },
        { label: "Documents", value: String(documentRows.length) },
        { label: "Agenda items", value: String(agendaItemRows.length) },
      ];
    } catch (error) {
      console.warn("Database coverage query failed, using mock data.", error);
    }
  }

  return coverageStats;
}

export async function getPersonas() {
  return personas;
}

export async function getSearchResults(
  query?: string,
): Promise<SearchResultView[]> {
  const db = await getDatabase();

  if (db) {
    try {
      const rows = await db
        .select({
          agendaItemId: agendaItems.id,
          agendaBody: agendaItems.body,
          agendaTitle: agendaItems.title,
          date: dbMeetings.startsAt,
          documentId: documents.id,
          documentSourceUrl: documents.sourceUrl,
          documentText: documents.extractedText,
          documentTitle: documents.title,
          documentType: documents.type,
          jurisdictionSlug: jurisdictions.slug,
          jurisdictionName: jurisdictions.name,
          meetingId: dbMeetings.id,
          meetingTitle: dbMeetings.title,
        })
        .from(agendaItems)
        .innerJoin(dbMeetings, eq(agendaItems.meetingId, dbMeetings.id))
        .innerJoin(
          governingBodies,
          eq(dbMeetings.governingBodyId, governingBodies.id),
        )
        .innerJoin(
          jurisdictions,
          eq(governingBodies.jurisdictionId, jurisdictions.id),
        )
        .leftJoin(documents, eq(agendaItems.documentId, documents.id))
        .orderBy(desc(dbMeetings.startsAt))
        .limit(200);

      const documentRows = await db
        .select({
          date: dbMeetings.startsAt,
          documentId: documents.id,
          documentSourceUrl: documents.sourceUrl,
          documentText: documents.extractedText,
          documentTitle: documents.title,
          documentType: documents.type,
          jurisdictionSlug: jurisdictions.slug,
          jurisdictionName: jurisdictions.name,
          meetingId: dbMeetings.id,
          meetingTitle: dbMeetings.title,
        })
        .from(documents)
        .leftJoin(dbMeetings, eq(documents.meetingId, dbMeetings.id))
        .leftJoin(
          governingBodies,
          eq(dbMeetings.governingBodyId, governingBodies.id),
        )
        .leftJoin(
          jurisdictions,
          eq(governingBodies.jurisdictionId, jurisdictions.id),
        )
        .orderBy(desc(dbMeetings.startsAt))
        .limit(200);

      const transcriptQuery = db
        .select({
          date: dbMeetings.startsAt,
          endSeconds: transcriptSegments.endSeconds,
          jurisdictionName: jurisdictions.name,
          jurisdictionSlug: jurisdictions.slug,
          meetingId: dbMeetings.id,
          meetingTitle: dbMeetings.title,
          mediaSourceUrl: mediaAssets.sourceUrl,
          speaker: transcriptSegments.speaker,
          startSeconds: transcriptSegments.startSeconds,
          text: transcriptSegments.text,
        })
        .from(transcriptSegments)
        .innerJoin(
          mediaAssets,
          eq(transcriptSegments.mediaAssetId, mediaAssets.id),
        )
        .innerJoin(dbMeetings, eq(mediaAssets.meetingId, dbMeetings.id))
        .innerJoin(
          governingBodies,
          eq(dbMeetings.governingBodyId, governingBodies.id),
        )
        .innerJoin(
          jurisdictions,
          eq(governingBodies.jurisdictionId, jurisdictions.id),
        );
      const transcriptFilter = transcriptSearchFilter(query);
      const transcriptRows = await (transcriptFilter
        ? transcriptQuery.where(transcriptFilter)
        : transcriptQuery)
        .orderBy(desc(dbMeetings.startsAt))
        .limit(200);

      const matchingAgendaRows = rows.filter((row) =>
        matchesQuery(query, [
          row.agendaTitle,
          row.agendaBody,
          row.documentText,
          row.documentType,
          row.jurisdictionName,
        ]),
      );
      const agendaDocumentIds = new Set(
        rows.map((row) => row.documentId).filter(Boolean),
      );
      const matchingDocumentRows = documentRows.filter(
        (row) =>
          !agendaDocumentIds.has(row.documentId) &&
          matchesQuery(query, [
            row.documentTitle,
            row.documentText,
            row.documentType,
            row.jurisdictionName,
          ]),
        );
      const matchingTranscriptRows = transcriptRows.filter((row) =>
        matchesQuery(query, [
          row.text,
          row.speaker,
          row.meetingTitle,
          row.jurisdictionName,
        ]),
      );

      if (rows.length > 0 || documentRows.length > 0 || transcriptRows.length > 0) {
        const transcriptResults = matchingTranscriptRows.map<SearchResultView>(
          (row) => {
            const timestamp = formatTimestamp(row.startSeconds);

            return {
              title: row.speaker
                ? `${row.speaker} in ${row.meetingTitle}`
                : `Transcript moment in ${row.meetingTitle}`,
              body:
                excerptForQuery(row.text, query) ??
                "Transcript segment imported from meeting video.",
              bodySections: readableSectionsForQuery(row.text, query),
              city: row.jurisdictionName,
              date: formatDate(row.date),
              href: `/dashboard/meetings/${meetingSlug({
                id: row.meetingId,
                jurisdictionSlug: row.jurisdictionSlug,
                startsAt: row.date,
                title: row.meetingTitle,
              })}`,
              matches: [
                row.jurisdictionName,
                timestamp ? `timestamp ${timestamp}` : "timestamped",
                "transcript",
              ],
              sourceUrl: row.mediaSourceUrl,
              timestamp: timestamp ?? undefined,
              type: "Transcript moment",
              videoUrl: row.mediaSourceUrl,
            };
          },
        );
        const agendaResults = matchingAgendaRows.map<SearchResultView>((row) => ({
          title: row.agendaTitle,
          body:
            excerptForQuery(row.agendaBody, query) ??
            excerptForQuery(row.documentText, query) ??
            "Agenda item imported from source records.",
          bodySections: [
            ...readableSectionsForQuery(row.agendaBody, query),
            ...readableSectionsForQuery(row.documentText, query),
          ].slice(0, 4),
          city: row.jurisdictionName,
          date: formatDate(row.date),
          href: `/dashboard/meetings/${meetingSlug({
            id: row.meetingId,
            jurisdictionSlug: row.jurisdictionSlug,
            startsAt: row.date,
            title: row.meetingTitle,
          })}`,
          sourceUrl: row.documentSourceUrl,
          type: row.documentType
            ? `${sentenceCase(row.documentType)} item`
            : "Agenda item",
          matches: [row.jurisdictionName, "source linked", "database"],
        }));
        const documentResults = matchingDocumentRows.map<SearchResultView>(
          (row) => ({
            title: row.documentTitle,
            body:
              excerptForQuery(row.documentText, query) ??
              "Document imported from source records.",
            bodySections: readableSectionsForQuery(row.documentText, query),
            city: row.jurisdictionName ?? "Unknown jurisdiction",
            date: formatDate(row.date),
            href: row.meetingId
              ? `/dashboard/meetings/${meetingSlug({
                  id: row.meetingId,
                  jurisdictionSlug: row.jurisdictionSlug,
                  startsAt: row.date,
                  title: row.meetingTitle ?? row.documentTitle,
                })}`
              : undefined,
            sourceUrl: row.documentSourceUrl,
            type: row.documentType
              ? `${sentenceCase(row.documentType)} document`
              : "Source document",
            matches: [
              row.jurisdictionName ?? "source",
              "source linked",
              "database",
            ],
          }),
        );

        return [...transcriptResults, ...agendaResults, ...documentResults].slice(
          0,
          50,
        );
      }
    } catch (error) {
      console.warn("Database search query failed, using mock data.", error);
    }
  }

  return sampleResults.filter((result) =>
    matchesQuery(query, [
      result.title,
      result.body,
      result.city,
      result.type,
      ...result.matches,
    ]),
  );
}

export async function getDashboardCards() {
  return dashboardCards;
}

export async function getAlerts() {
  return alerts;
}

export async function getProjects() {
  return projects;
}

export async function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export async function getMeetings(): Promise<MeetingView[]> {
  const db = await getDatabase();

  if (db) {
    try {
      const rows = await db
        .select({
          bodyName: governingBodies.name,
          id: dbMeetings.id,
          jurisdictionName: jurisdictions.name,
          jurisdictionSlug: jurisdictions.slug,
          platform: jurisdictions.platform,
          agendaUrl: dbMeetings.agendaUrl,
          sourceUrl: dbMeetings.sourceUrl,
          startsAt: dbMeetings.startsAt,
          status: dbMeetings.status,
          title: dbMeetings.title,
          videoUrl: dbMeetings.videoUrl,
        })
        .from(dbMeetings)
        .innerJoin(
          governingBodies,
          eq(dbMeetings.governingBodyId, governingBodies.id),
        )
        .innerJoin(
          jurisdictions,
          eq(governingBodies.jurisdictionId, jurisdictions.id),
        )
        .orderBy(desc(dbMeetings.startsAt))
        .limit(50);

      if (rows.length === 0) {
        return mockMeetings;
      }

      const meetingIds = rows.map((row) => row.id);
      const itemRows = await db
        .select({
          body: agendaItems.body,
          meetingId: agendaItems.meetingId,
          title: agendaItems.title,
        })
        .from(agendaItems)
        .where(inArray(agendaItems.meetingId, meetingIds));

      const documentRows = await db
        .select({
          meetingId: documents.meetingId,
          extractedText: documents.extractedText,
          sourceUrl: documents.sourceUrl,
          title: documents.title,
          type: documents.type,
        })
        .from(documents)
        .where(inArray(documents.meetingId, meetingIds));

      const mediaRows = await db
        .select({
          id: mediaAssets.id,
          meetingId: mediaAssets.meetingId,
          mediaType: mediaAssets.mediaType,
          sourceUrl: mediaAssets.sourceUrl,
        })
        .from(mediaAssets)
        .where(inArray(mediaAssets.meetingId, meetingIds));

      const transcriptRows = await db
        .select({
          mediaAssetId: transcriptSegments.mediaAssetId,
        })
        .from(transcriptSegments)
        .innerJoin(
          mediaAssets,
          eq(transcriptSegments.mediaAssetId, mediaAssets.id),
        )
        .where(inArray(mediaAssets.meetingId, meetingIds));

      const itemsByMeeting = new Map<string, typeof itemRows>();
      for (const item of itemRows) {
        const existing = itemsByMeeting.get(item.meetingId) ?? [];
        existing.push(item);
        itemsByMeeting.set(item.meetingId, existing);
      }

      const documentsByMeeting = new Map<string, typeof documentRows>();
      for (const document of documentRows) {
        if (!document.meetingId) {
          continue;
        }

        const existing = documentsByMeeting.get(document.meetingId) ?? [];
        existing.push(document);
        documentsByMeeting.set(document.meetingId, existing);
      }

      const mediaByMeeting = new Map<string, typeof mediaRows>();
      for (const media of mediaRows) {
        const existing = mediaByMeeting.get(media.meetingId) ?? [];
        existing.push(media);
        mediaByMeeting.set(media.meetingId, existing);
      }

      const transcriptCountsByMedia = new Map<string, number>();
      for (const transcript of transcriptRows) {
        transcriptCountsByMedia.set(
          transcript.mediaAssetId,
          (transcriptCountsByMedia.get(transcript.mediaAssetId) ?? 0) + 1,
        );
      }

      return rows.map<MeetingView>((row) => {
        const meetingItems = itemsByMeeting.get(row.id) ?? [];
        const agendaTitles = meetingItems
          .map((item) => item.title)
          .filter(Boolean)
          .slice(0, 8);
        const summarySource = meetingItems.find((item) => item.body)?.body;
        const meetingDocuments = documentsByMeeting.get(row.id) ?? [];
        const meetingMedia = mediaByMeeting.get(row.id) ?? [];
        const transcriptSegmentCount = meetingMedia.reduce(
          (count, media) => count + (transcriptCountsByMedia.get(media.id) ?? 0),
          0,
        );
        const documentSummarySource = meetingDocuments
          ?.find((document) => document.extractedText)?.extractedText;
        const agendaItemDetails = meetingItems.map((item) => ({
          body: excerpt(item.body, 700),
          bodySections: readableSections(item.body, 1200),
          title: item.title,
        }));

        return {
          id: row.id,
          slug: meetingSlug(row),
          title: row.title,
          jurisdiction: row.jurisdictionName,
          body: row.bodyName,
          date: formatDate(row.startsAt),
          status: sentenceCase(row.status),
          source: row.platform,
          agendaUrl: row.agendaUrl,
          sourceUrl: row.sourceUrl,
          videoUrl: row.videoUrl,
          mediaAssetCount: meetingMedia.length,
          sourceDocumentCount: meetingDocuments.length,
          sourceDocuments: meetingDocuments.map((document) => ({
            sourceUrl: document.sourceUrl,
            title: document.title,
            type: sentenceCase(document.type),
          })),
          summary:
            excerpt(summarySource) ??
            excerpt(documentSummarySource) ??
            "Imported from the source meeting system. Agenda item extraction is ready for review.",
          agendaItems:
            agendaTitles.length > 0
              ? agendaTitles
              : ["No agenda items imported yet."],
          agendaItemDetails,
          readableItemCount: agendaItemDetails.filter(
            (item) => item.bodySections.length > 0,
          ).length,
          transcriptSegmentCount,
        };
      });
    } catch (error) {
      console.warn("Database meetings query failed, using mock data.", error);
    }
  }

  return mockMeetings;
}

export async function getMeeting(slug: string) {
  const meetings = await getMeetings();
  return meetings.find((meeting) => meeting.slug === slug);
}

export async function getMunicipalities() {
  const db = await getDatabase();

  if (db) {
    try {
      const rows = await db
        .select({
          connectorStatus: jurisdictions.connectorStatus,
          name: jurisdictions.name,
          platform: jurisdictions.platform,
          population: jurisdictions.population,
          priority: jurisdictions.priority,
        })
        .from(jurisdictions)
        .orderBy(jurisdictions.priority, jurisdictions.name);

      if (rows.length > 0) {
        return rows.map<MunicipalityView>((row) => ({
          name: row.name,
          platform: row.platform,
          status: row.connectorStatus,
          population: row.population ?? "Unknown",
          priority: row.priority,
        }));
      }
    } catch (error) {
      console.warn("Database jurisdictions query failed, using mock data.", error);
    }
  }

  return mockMunicipalities;
}
