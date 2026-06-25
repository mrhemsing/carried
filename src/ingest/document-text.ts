import https from "node:https";
import { existsSync, readFileSync } from "node:fs";

import { eq, isNotNull, isNull } from "drizzle-orm";
import { PDFParse } from "pdf-parse";

import { agendaItems, documents } from "@/db/schema";

type ExtractResult = {
  documentsProcessed: number;
  documentsUpdated: number;
  agendaItemsUpdated: number;
  errors: Array<{ documentId: string; message: string; sourceUrl: string }>;
};

export async function extractDocumentText(options: { limit?: number } = {}) {
  const { db } = await getDatabase();
  const result: ExtractResult = {
    documentsProcessed: 0,
    documentsUpdated: 0,
    agendaItemsUpdated: 0,
    errors: [],
  };
  const rows = await db.query.documents.findMany({
    where: isNull(documents.extractedText),
    limit: options.limit ?? 25,
    columns: {
      id: true,
      sourceUrl: true,
      title: true,
      type: true,
    },
  });

  for (const document of rows) {
    result.documentsProcessed += 1;

    const extractedText = await extractText(document.sourceUrl).catch((error) => {
      result.errors.push({
        documentId: document.id,
        message: error instanceof Error ? error.message : String(error),
        sourceUrl: document.sourceUrl,
      });
      return null;
    });

    if (!extractedText) {
      continue;
    }

    await db
      .update(documents)
      .set({ extractedText, updatedAt: new Date() })
      .where(eq(documents.id, document.id));
    result.documentsUpdated += 1;

    const updated = await backfillAgendaItemBodies(db, document.id, extractedText);
    result.agendaItemsUpdated += updated;
  }

  return result;
}

export async function backfillExtractedDocumentText() {
  const { db } = await getDatabase();
  const rows = await db.query.documents.findMany({
    where: isNotNull(documents.extractedText),
    columns: {
      extractedText: true,
      id: true,
    },
  });
  let agendaItemsUpdated = 0;

  for (const document of rows) {
    if (!document.extractedText) {
      continue;
    }

    agendaItemsUpdated += await backfillAgendaItemBodies(
      db,
      document.id,
      document.extractedText,
    );
  }

  return { agendaItemsUpdated, documentsProcessed: rows.length };
}

async function extractText(sourceUrl: string) {
  const buffer = await requestBuffer(new URL(sourceUrl));

  if (looksLikePdf(sourceUrl, buffer)) {
    return extractPdfText(buffer);
  }

  return normalizeWhitespace(stripHtmlDocument(buffer.toString("utf8")));
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  return normalizeWhitespace(parsed.text);
}

async function backfillAgendaItemBodies(
  db: typeof import("@/db").db,
  documentId: string,
  extractedText: string,
) {
  const items = await db.query.agendaItems.findMany({
    where: eq(agendaItems.documentId, documentId),
    columns: {
      id: true,
      itemNumber: true,
      title: true,
    },
  });
  let updated = 0;

  const sortedItems = [...items].sort((a, b) =>
    compareItemNumbers(a.itemNumber, b.itemNumber),
  );

  for (let index = 0; index < sortedItems.length; index += 1) {
    const item = sortedItems[index];
    const followingTitles = sortedItems
      .slice(index + 1)
      .map((followingItem) => followingItem.title);
    const body =
      excerptAroundTitle(extractedText, item.title, followingTitles) ??
      (sortedItems.length === 1 ? excerptFromDocument(extractedText) : null);
    if (!body) {
      continue;
    }

    await db
      .update(agendaItems)
      .set({
        body: isSubstantiveBody(body, item.title) ? body : null,
        updatedAt: new Date(),
      })
      .where(eq(agendaItems.id, item.id));
    updated += 1;
  }

  return updated;
}

function excerptAroundTitle(
  text: string,
  title: string,
  followingTitles: string[] = [],
) {
  const cleanText = cleanExtractedText(text);
  const normalizedTitle = normalizeWhitespace(title);
  const lowerText = cleanText.toLowerCase();
  const index = lowerText.indexOf(normalizedTitle.toLowerCase());

  if (index < 0) {
    return null;
  }

  const nextIndex = followingTitles.reduce<number | null>((closest, nextTitle) => {
    const normalizedNextTitle = normalizeWhitespace(nextTitle);
    if (!normalizedNextTitle) {
      return closest;
    }

    const candidate = lowerText.indexOf(
      normalizedNextTitle.toLowerCase(),
      index + normalizedTitle.length,
    );
    if (candidate < 0) {
      return closest;
    }

    return closest === null || candidate < closest ? candidate : closest;
  }, null);
  const end = nextIndex ?? Math.min(cleanText.length, index + 1400);
  const excerpt = cleanText.slice(index, end).trim();

  return excerpt.length > 1200 ? `${excerpt.slice(0, 1200).trimEnd()}...` : excerpt;
}

function excerptFromDocument(text: string, limit = 1600) {
  const cleanText = cleanExtractedText(text);

  if (!cleanText || cleanText.length < 140) {
    return null;
  }

  return cleanText.length > limit
    ? `${cleanText.slice(0, limit).trimEnd()}...`
    : cleanText;
}

function stripHtmlDocument(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

function cleanExtractedText(value: string) {
  return normalizeWhitespace(value)
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

function compareItemNumbers(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return String(left ?? "").localeCompare(String(right ?? ""));
}

function isSubstantiveBody(body: string, title: string) {
  const normalizedBody = normalizeWhitespace(body).toLowerCase();
  const normalizedTitle = normalizeWhitespace(title).toLowerCase();
  const bodyWithoutTitle = normalizedBody
    .replace(normalizedTitle, "")
    .replace(/^[\d. -]+/, "")
    .trim();

  return bodyWithoutTitle.length >= 140;
}

async function requestBuffer(url: URL) {
  return new Promise<Buffer>((resolve, reject) => {
    const request = https.request(
      url,
      {
        headers: {
          "user-agent": "Carried document extraction/0.1",
        },
        rejectUnauthorized: false,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          if (!response.statusCode || response.statusCode >= 400) {
            reject(
              new Error(
                `Request failed for ${url.toString()}: ${response.statusCode}`,
              ),
            );
            return;
          }

          resolve(Buffer.concat(chunks));
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

function looksLikePdf(sourceUrl: string, buffer: Buffer) {
  const normalizedUrl = sourceUrl.toLowerCase();
  return (
    normalizedUrl.includes(".pdf") ||
    normalizedUrl.includes("filestream") ||
    buffer.subarray(0, 5).toString("utf8") === "%PDF-"
  );
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  loadLocalEnv();
  if (process.argv.includes("--backfill-existing")) {
    const result = await backfillExtractedDocumentText();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const result = await extractDocumentText({
    limit: Number(readArg("--limit") ?? 25),
  });

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith("document-text.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      const { sqlClient } = await getDatabase();
      await sqlClient.end();
    });
}

async function getDatabase() {
  loadLocalEnv();
  return import("@/db");
}

function loadLocalEnv() {
  if (process.env.DATABASE_URL || !existsSync(".env.local")) {
    return;
  }

  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^DATABASE_URL=(.*)$/);
    if (match) {
      process.env.DATABASE_URL = match[1].trim().replace(/^"|"$/g, "");
    }
  }
}
