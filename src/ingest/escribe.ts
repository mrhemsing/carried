import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";

export type EscribeTenant = {
  jurisdictionSlug: string;
  baseUrl: string;
};

export type EscribeDocumentLink = {
  Title?: string;
  Type?: string;
  Format?: string;
  Url?: string;
  AriaLabel?: string;
  HasVideo?: boolean;
  HasLiveVideo?: boolean;
};

export type EscribeCalendarMeeting = {
  ID: string;
  MeetingName: string;
  StartDate: string;
  EndDate?: string;
  FormattedStart?: string;
  Location?: string;
  Description?: string;
  MeetingType?: string;
  HasAgenda?: boolean;
  HasVideo?: boolean;
  HasLiveVideo?: boolean;
  MeetingDocumentLink?: EscribeDocumentLink[];
};

export type NormalizedDocument = {
  type: "agenda" | "minutes" | "report" | "attachment";
  title: string;
  sourceUrl: string;
  format: string;
};

export type NormalizedMeeting = {
  externalId: string;
  jurisdictionSlug: string;
  governingBodyName: string;
  governingBodySlug: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  status: "scheduled" | "held";
  sourceUrl: string;
  agendaUrl: string | null;
  videoUrl: string | null;
  documents: NormalizedDocument[];
};

export type NormalizedAgendaItem = {
  documents: NormalizedDocument[];
  itemNumber: string;
  title: string;
};

export const ESCRIBE_TENANTS: Record<string, EscribeTenant> = {
  burnaby: {
    jurisdictionSlug: "burnaby",
    baseUrl: "https://pub-burnaby.escribemeetings.com",
  },
  delta: {
    jurisdictionSlug: "delta",
    baseUrl: "https://pub-delta.escribemeetings.com",
  },
  "maple-ridge": {
    jurisdictionSlug: "maple-ridge",
    baseUrl: "https://pub-mapleridge.escribemeetings.com",
  },
  "new-westminster": {
    jurisdictionSlug: "new-westminster",
    baseUrl: "https://pub-newwestcity.escribemeetings.com",
  },
  "port-coquitlam": {
    jurisdictionSlug: "port-coquitlam",
    baseUrl: "https://pub-portcoquitlam.escribemeetings.com",
  },
  "port-moody": {
    jurisdictionSlug: "port-moody",
    baseUrl: "https://pub-portmoody.escribemeetings.com",
  },
  "langley-city": {
    jurisdictionSlug: "langley-city",
    baseUrl: "https://pub-langleycity.escribemeetings.com",
  },
  "white-rock": {
    jurisdictionSlug: "white-rock",
    baseUrl: "https://pub-whiterockcity.escribemeetings.com",
  },
  "pitt-meadows": {
    jurisdictionSlug: "pitt-meadows",
    baseUrl: "https://pub-pittmeadows.escribemeetings.com",
  },
};

type EscribeCalendarResponse = {
  d: EscribeCalendarMeeting[];
};

export async function fetchEscribeCalendarMeetings(
  tenant: EscribeTenant,
  range: { from: string; to: string },
) {
  const endpoint = new URL(
    "/MeetingsCalendarView.aspx/GetCalendarMeetings",
    tenant.baseUrl,
  );
  const payload = await requestJson<EscribeCalendarResponse>(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      calendarStartDate: range.from,
      calendarEndDate: range.to,
    }),
  });
  return payload.d ?? [];
}

export async function fetchEscribeAgendaHtml(
  tenant: EscribeTenant,
  meeting: NormalizedMeeting,
) {
  if (!meeting.agendaUrl) {
    return null;
  }

  return requestText(new URL(meeting.agendaUrl));
}

export function normalizeEscribeMeeting(
  tenant: EscribeTenant,
  meeting: EscribeCalendarMeeting,
): NormalizedMeeting {
  const documents = (meeting.MeetingDocumentLink ?? [])
    .map((document) => normalizeEscribeDocument(tenant, document))
    .filter((document): document is NormalizedDocument => document !== null);
  const agenda =
    documents.find(
      (document) =>
        document.type === "agenda" && document.format.toLowerCase() === "html",
    ) ?? documents.find((document) => document.type === "agenda");
  const video = (meeting.MeetingDocumentLink ?? []).find(
    (document) => document.Type === "Video" && document.Url,
  );

  return {
    externalId: meeting.ID,
    jurisdictionSlug: tenant.jurisdictionSlug,
    governingBodyName: meeting.MeetingType || meeting.MeetingName,
    governingBodySlug: slugify(meeting.MeetingType || meeting.MeetingName),
    title: meeting.MeetingName,
    startsAt: parseEscribeDate(meeting.StartDate),
    endsAt: meeting.EndDate ? parseEscribeDate(meeting.EndDate) : null,
    status: isPastDate(meeting.StartDate) ? "held" : "scheduled",
    sourceUrl: absoluteUrl(
      tenant,
      `Meeting.aspx?Id=${meeting.ID}&lang=English`,
    ),
    agendaUrl: agenda?.sourceUrl ?? null,
    videoUrl: video?.Url ? absoluteUrl(tenant, video.Url) : null,
    documents,
  };
}

export function parseEscribeAgendaItems(
  html: string,
  tenant?: EscribeTenant,
): NormalizedAgendaItem[] {
  const items: NormalizedAgendaItem[] = [];
  const pattern =
    /<DIV class='AgendaItemCounter'[^>]*>\s*([^<]+?)\s*<\/DIV>[\s\S]*?<DIV class='AgendaItemTitle'[^>]*>\s*<a[^>]*>\s*([\s\S]*?)\s*<\/a>/gi;
  const matches = [...html.matchAll(pattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const itemNumber = stripHtml(match[1]).trim();
    const title = decodeHtml(stripHtml(match[2])).trim();

    if (itemNumber && title) {
      const blockStart = match.index ?? 0;
      const blockEnd = matches[index + 1]?.index ?? html.length;
      const block = html.slice(blockStart, blockEnd);
      items.push({
        documents: tenant ? parseEscribeAgendaDocumentLinks(tenant, block) : [],
        itemNumber,
        title,
      });
    }
  }

  return items;
}

export function parseEscribeAgendaDocumentLinks(
  tenant: EscribeTenant,
  html: string,
): NormalizedDocument[] {
  const documents = new Map<string, NormalizedDocument>();
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(pattern)) {
    const href = decodeHtml(match[1]).trim();
    const title = decodeHtml(stripHtml(match[2])).trim();

    if (!href || !title || !isSourceDocumentLink(href, title)) {
      continue;
    }

    const sourceUrl = absoluteUrl(tenant, href);
    documents.set(sourceUrl, {
      type: documentTypeFromTitle(title),
      title,
      sourceUrl,
      format: documentFormatFromTitle(title),
    });
  }

  return [...documents.values()];
}

export function normalizeEscribeMeetings(
  tenant: EscribeTenant,
  meetings: EscribeCalendarMeeting[],
) {
  return meetings.map((meeting) => normalizeEscribeMeeting(tenant, meeting));
}

function normalizeEscribeDocument(
  tenant: EscribeTenant,
  document: EscribeDocumentLink,
): NormalizedDocument | null {
  if (!document.Url) {
    return null;
  }

  const type = documentTypeFor(document);
  if (!type) {
    return null;
  }

  return {
    type,
    title: document.Title ?? type,
    sourceUrl: absoluteUrl(tenant, document.Url),
    format: document.Format ?? "",
  };
}

function documentTypeFor(document: EscribeDocumentLink) {
  if (document.Type === "Agenda") {
    return "agenda";
  }

  if (document.Title?.toLowerCase().includes("minutes")) {
    return "minutes";
  }

  if (document.Title?.toLowerCase().includes("report")) {
    return "report";
  }

  if (document.Type === "AdditionalDocuments") {
    return "attachment";
  }

  return null;
}

function isSourceDocumentLink(href: string, title: string) {
  const value = `${href} ${title}`.toLowerCase();
  return (
    value.includes("filestream") ||
    value.includes("documentid=") ||
    value.includes(".pdf") ||
    value.includes(".doc") ||
    value.includes(".xls")
  );
}

function documentTypeFromTitle(title: string): NormalizedDocument["type"] {
  const normalized = title.toLowerCase();

  if (normalized.includes("agenda")) {
    return "agenda";
  }

  if (normalized.includes("minutes")) {
    return "minutes";
  }

  if (normalized.includes("report")) {
    return "report";
  }

  return "attachment";
}

function documentFormatFromTitle(title: string) {
  const extension = title.match(/\.([a-z0-9]+)$/i)?.[1];
  return extension ? extension.toLowerCase() : "";
}

function parseEscribeDate(value: string) {
  const normalized = value.replace(
    /^(\d{4})\/(\d{2})\/(\d{2})/,
    "$1-$2-$3",
  );
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function isPastDate(value: string) {
  const parsed = parseEscribeDate(value);
  return parsed ? new Date(parsed).getTime() < Date.now() : false;
}

function absoluteUrl(tenant: EscribeTenant, url: string) {
  const normalized = decodeHtml(url).replace(/^\.\//, "").trim();

  if (/^https?:\/\//i.test(normalized)) {
    return new URL(normalized).toString();
  }

  return new URL(normalized, `${tenant.baseUrl}/`).toString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ");
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

async function requestJson<T>(
  url: URL,
  options?: { method?: string; headers?: Record<string, string>; body?: string },
) {
  const response = await requestText(url, options);
  return JSON.parse(response) as T;
}

async function requestText(
  url: URL,
  options?: { method?: string; headers?: Record<string, string>; body?: string },
) {
  return new Promise<string>((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: options?.method ?? "GET",
        headers: {
          "user-agent": "Carried ingestion spike/0.1",
          ...(options?.headers ?? {}),
        },
        // Some municipal eScribe hosts fail Node's local CA chain in this dev
        // environment. These are public pages; keep the spike moving.
        rejectUnauthorized: false,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");

          if (!response.statusCode || response.statusCode >= 400) {
            reject(
              new Error(
                `Request failed for ${url.toString()}: ${response.statusCode}`,
              ),
            );
            return;
          }

          resolve(body);
        });
      },
    );

    request.on("error", reject);

    if (options?.body) {
      request.write(options.body);
    }

    request.end();
  });
}

async function readFixture(fixturePath: string) {
  const absolutePath = path.resolve(process.cwd(), fixturePath);
  const content = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(content) as EscribeCalendarResponse;
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const fixture = readArg("--fixture");
  const tenantKey = readArg("--tenant") ?? "burnaby";
  const tenant = ESCRIBE_TENANTS[tenantKey];

  if (!tenant) {
    throw new Error(`Unknown eScribe tenant: ${tenantKey}`);
  }

  const rawMeetings = fixture
    ? (await readFixture(fixture)).d
    : await fetchEscribeCalendarMeetings(tenant, {
        from: readArg("--from") ?? "2026-02-01T00:00:00-08:00",
        to: readArg("--to") ?? "2026-02-28T23:59:59-08:00",
      });

  const meetings = normalizeEscribeMeetings(tenant, rawMeetings);
  const meetingWithAgenda = meetings.find((meeting) => meeting.agendaUrl);
  let agendaItems: NormalizedAgendaItem[] = [];

  if (meetingWithAgenda && !fixture) {
    const html = await fetchEscribeAgendaHtml(tenant, meetingWithAgenda);
    agendaItems = html ? parseEscribeAgendaItems(html).slice(0, 10) : [];
  }

  console.log(
    JSON.stringify(
      {
        tenant,
        meetingCount: meetings.length,
        sampleMeeting: meetingWithAgenda ?? meetings[0] ?? null,
        sampleAgendaItems: agendaItems,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1]?.endsWith("escribe.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
