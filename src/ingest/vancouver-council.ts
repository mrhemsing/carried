import fs from "node:fs/promises";
import path from "node:path";

export type VancouverMeetingKind = "council" | "public-hearing" | "standing-committee";

export type VancouverCouncilDocument = {
  type: "agenda" | "minutes" | "report" | "attachment";
  title: string;
  sourceUrl: string;
  format: string;
};

export type VancouverCouncilAgendaItem = {
  itemNumber: string;
  title: string;
  sourceUrl: string;
  documents: VancouverCouncilDocument[];
};

export type VancouverCouncilMeeting = {
  externalId: string;
  kind: VancouverMeetingKind;
  governingBodyName: string;
  governingBodySlug: string;
  title: string;
  startsAt: string | null;
  status: "scheduled" | "held";
  sourceUrl: string;
  agendaUrl: string;
  videoUrl: string | null;
  documents: VancouverCouncilDocument[];
  agendaItems: VancouverCouncilAgendaItem[];
};

type Candidate = {
  code: string;
  date: Date;
  kind: VancouverMeetingKind;
};

const BASE_URL = "https://council.vancouver.ca";
const VANCOUVER_TIME_ZONE = "America/Vancouver";
const DEFAULT_LOOKBACK_MONTHS = 12;

const MEETING_CODES: Array<{
  code: string;
  kind: VancouverMeetingKind;
  governingBodyName: string;
  governingBodySlug: string;
}> = [
  {
    code: "regu",
    kind: "council",
    governingBodyName: "Vancouver Council",
    governingBodySlug: "vancouver-council",
  },
  {
    code: "phea",
    kind: "public-hearing",
    governingBodyName: "Vancouver Public Hearing",
    governingBodySlug: "vancouver-public-hearing",
  },
  {
    code: "cfsc",
    kind: "standing-committee",
    governingBodyName: "Standing Committee on City Finance and Services",
    governingBodySlug: "vancouver-standing-committee-city-finance-services",
  },
  {
    code: "pspc",
    kind: "standing-committee",
    governingBodyName: "Standing Committee on Policy and Strategic Priorities",
    governingBodySlug: "vancouver-standing-committee-policy-strategic-priorities",
  },
];

export function getDefaultVancouverRange() {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - DEFAULT_LOOKBACK_MONTHS);
  return { from, to };
}

export function buildVancouverAgendaUrl(date: Date, code: string) {
  const stamp = formatDateStamp(date);
  return `${BASE_URL}/${stamp}/${code}${stamp}ag.htm`;
}

export function buildVancouverCandidates(range: {
  from: Date;
  to: Date;
  kinds?: VancouverMeetingKind[];
}) {
  const kinds = new Set(range.kinds ?? ["council", "public-hearing", "standing-committee"]);
  const candidates: Candidate[] = [];
  const cursor = startOfDay(range.from);
  const end = startOfDay(range.to);

  while (cursor <= end) {
    for (const meetingCode of MEETING_CODES) {
      if (kinds.has(meetingCode.kind)) {
        candidates.push({
          code: meetingCode.code,
          date: new Date(cursor),
          kind: meetingCode.kind,
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return candidates;
}

export async function fetchVancouverCouncilMeetings(options: {
  from?: Date;
  to?: Date;
  kinds?: VancouverMeetingKind[];
  limit?: number;
} = {}) {
  const defaultRange = getDefaultVancouverRange();
  const candidates = buildVancouverCandidates({
    from: options.from ?? defaultRange.from,
    to: options.to ?? defaultRange.to,
    kinds: options.kinds,
  });
  const meetings: VancouverCouncilMeeting[] = [];

  for (const candidate of candidates) {
    if (options.limit && meetings.length >= options.limit) {
      break;
    }

    const agendaUrl = buildVancouverAgendaUrl(candidate.date, candidate.code);
    const html = await requestAgendaHtml(agendaUrl);

    if (!html) {
      continue;
    }

    meetings.push(parseVancouverCouncilMeeting(html, agendaUrl, candidate));
  }

  return meetings;
}

export function parseVancouverCouncilMeeting(
  html: string,
  agendaUrl: string,
  candidate: Candidate,
): VancouverCouncilMeeting {
  const code = MEETING_CODES.find((item) => item.code === candidate.code);

  if (!code) {
    throw new Error(`Unknown Vancouver meeting code: ${candidate.code}`);
  }

  const title = normalizeWhitespace(
    firstTextMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ??
      firstTextMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ??
      defaultTitle(code.kind, candidate.date),
  );
  const startsAt = parseStartsAt(html, candidate.date);
  const documents = parseVancouverDocuments(html, agendaUrl);
  const agendaDocument: VancouverCouncilDocument = {
    type: "agenda",
    title: "Agenda",
    sourceUrl: agendaUrl,
    format: "html",
  };
  const allDocuments = upsertDocument(documents, agendaDocument);

  return {
    externalId: `${candidate.code}-${formatDateStamp(candidate.date)}`,
    kind: code.kind,
    governingBodyName: code.governingBodyName,
    governingBodySlug: code.governingBodySlug,
    title,
    startsAt,
    status: startsAt ? (new Date(startsAt).getTime() < Date.now() ? "held" : "scheduled") : "scheduled",
    sourceUrl: agendaUrl,
    agendaUrl,
    videoUrl: findVideoUrl(html, agendaUrl),
    documents: allDocuments,
    agendaItems: parseVancouverAgendaItems(html, agendaUrl, allDocuments),
  };
}

export function parseVancouverDocuments(html: string, agendaUrl: string) {
  const documents = new Map<string, VancouverCouncilDocument>();
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = decodeHtml(match[1]).trim();
    const title = normalizeWhitespace(stripHtml(decodeHtml(match[2])));
    const sourceUrl = absoluteUrl(href, agendaUrl);

    if (!isVancouverSourceDocument(sourceUrl, title)) {
      continue;
    }

    documents.set(sourceUrl, {
      type: documentTypeFor(sourceUrl, title),
      title: title || path.basename(new URL(sourceUrl).pathname),
      sourceUrl,
      format: documentFormat(sourceUrl),
    });
  }

  return [...documents.values()];
}

export function parseVancouverAgendaItems(
  html: string,
  agendaUrl: string,
  documents: VancouverCouncilDocument[],
) {
  const items: VancouverCouncilAgendaItem[] = [];
  const documentByUrl = new Map(documents.map((document) => [document.sourceUrl, document]));
  const headingPattern =
    /<(?:h2|h3|h4|strong|b)\b[^>]*>\s*(?:(?:Item|Referral Report|Report|By-law|Motion)\s*)?([A-Z]?\d+[A-Z]?\.?)\s*[-:.]?\s*([\s\S]*?)<\/(?:h2|h3|h4|strong|b)>/gi;
  const matches = [...html.matchAll(headingPattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const itemNumber = normalizeWhitespace(stripHtml(decodeHtml(match[1]))).replace(/\.$/, "");
    const title = normalizeWhitespace(stripHtml(decodeHtml(match[2])));

    if (!itemNumber || !title || title.length < 3) {
      continue;
    }

    const blockStart = match.index ?? 0;
    const blockEnd = matches[index + 1]?.index ?? html.length;
    const block = html.slice(blockStart, blockEnd);
    const linkedDocuments = parseVancouverDocuments(block, agendaUrl)
      .map((document) => documentByUrl.get(document.sourceUrl) ?? document)
      .filter((document) => document.type !== "agenda");

    items.push({
      itemNumber,
      title,
      sourceUrl: linkedDocuments[0]?.sourceUrl ?? agendaUrl,
      documents: linkedDocuments,
    });
  }

  return dedupeAgendaItems(items);
}

async function requestAgendaHtml(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Carried ingestion/0.1 public civic records research",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return html.includes("Sorry, you have been blocked") ? null : html;
  } catch {
    return null;
  }
}

function parseStartsAt(html: string, fallbackDate: Date) {
  const text = normalizeWhitespace(stripHtml(decodeHtml(html)));
  const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  const date = new Date(fallbackDate);

  if (!timeMatch) {
    return date.toISOString();
  }

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2] ?? 0);
  const meridiem = timeMatch[3].toLowerCase();

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  }

  if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  const stamp = formatDateStamp(date);
  const isoLocal = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  return zonedLocalToUtcIso(isoLocal);
}

function findVideoUrl(html: string, agendaUrl: string) {
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  for (const match of links) {
    const href = decodeHtml(match[1]).trim();
    const label = normalizeWhitespace(stripHtml(decodeHtml(match[2]))).toLowerCase();
    const sourceUrl = absoluteUrl(href, agendaUrl);

    if (sourceUrl.includes("youtube.com") || sourceUrl.includes("youtu.be")) {
      return sourceUrl;
    }

    if (label.includes("watch") && label.includes("live")) {
      return sourceUrl;
    }
  }

  return null;
}

function isVancouverSourceDocument(sourceUrl: string, title: string) {
  const normalized = `${sourceUrl} ${title}`.toLowerCase();
  return (
    normalized.includes("/documents/") ||
    normalized.endsWith(".pdf") ||
    normalized.endsWith(".doc") ||
    normalized.endsWith(".docx") ||
    normalized.includes("minutes") ||
    normalized.includes("report")
  );
}

function documentTypeFor(sourceUrl: string, title: string): VancouverCouncilDocument["type"] {
  const normalized = `${sourceUrl} ${title}`.toLowerCase();

  if (normalized.includes("minutes")) {
    return "minutes";
  }

  if (normalized.includes("report") || /\/documents\/(?:rr|r|cfsc|pspc|phea)\d+/i.test(sourceUrl)) {
    return "report";
  }

  return "attachment";
}

function documentFormat(sourceUrl: string) {
  return sourceUrl.match(/\.([a-z0-9]+)(?:[?#].*)?$/i)?.[1]?.toLowerCase() ?? "html";
}

function upsertDocument(
  documents: VancouverCouncilDocument[],
  agendaDocument: VancouverCouncilDocument,
) {
  const byUrl = new Map(documents.map((document) => [document.sourceUrl, document]));
  byUrl.set(agendaDocument.sourceUrl, agendaDocument);
  return [...byUrl.values()];
}

function dedupeAgendaItems(items: VancouverCouncilAgendaItem[]) {
  const byKey = new Map<string, VancouverCouncilAgendaItem>();

  for (const item of items) {
    byKey.set(`${item.itemNumber}:${item.title.toLowerCase()}`, item);
  }

  return [...byKey.values()];
}

function firstTextMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match ? stripHtml(decodeHtml(match[1])) : null;
}

function defaultTitle(kind: VancouverMeetingKind, date: Date) {
  const displayDate = new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeZone: VANCOUVER_TIME_ZONE,
  }).format(date);

  if (kind === "public-hearing") {
    return `Public Hearing - ${displayDate}`;
  }

  if (kind === "standing-committee") {
    return `Standing Committee - ${displayDate}`;
  }

  return `Council - ${displayDate}`;
}

function absoluteUrl(href: string, baseUrl: string) {
  return new URL(href, baseUrl).toString();
}

function formatDateStamp(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: VANCOUVER_TIME_ZONE,
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}${month}${day}`;
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function zonedLocalToUtcIso(localIso: string) {
  const assumedUtc = new Date(`${localIso}.000Z`);
  const offsetMinutes = getTimeZoneOffsetMinutes(assumedUtc, VANCOUVER_TIME_ZONE);
  return new Date(assumedUtc.getTime() - offsetMinutes * 60_000).toISOString();
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return (asUtc - date.getTime()) / 60_000;
}

function stripHtml(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&#58;/g, ":")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readKinds() {
  const value = readArg("--kinds");
  return value ? (value.split(",") as VancouverMeetingKind[]) : undefined;
}

async function main() {
  const fixture = readArg("--fixture");
  const meetings = fixture
    ? [
        parseVancouverCouncilMeeting(
          await fs.readFile(path.resolve(process.cwd(), fixture), "utf8"),
          readArg("--url") ?? "https://council.vancouver.ca/20260505/phea20260505ag.htm",
          {
            code: readArg("--code") ?? "phea",
            date: new Date(readArg("--date") ?? "2026-05-05T12:00:00Z"),
            kind: "public-hearing",
          },
        ),
      ]
    : await fetchVancouverCouncilMeetings({
        from: readArg("--from") ? new Date(readArg("--from")!) : undefined,
        to: readArg("--to") ? new Date(readArg("--to")!) : undefined,
        kinds: readKinds(),
        limit: readArg("--limit") ? Number(readArg("--limit")) : undefined,
      });

  console.log(
    JSON.stringify(
      {
        meetingCount: meetings.length,
        sampleMeeting: meetings[0] ?? null,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1]?.endsWith("vancouver-council.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
