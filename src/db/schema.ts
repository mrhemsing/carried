import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core/columns/vector_extension/vector";

export const documentType = pgEnum("document_type", [
  "agenda",
  "minutes",
  "report",
  "attachment",
  "transcript",
  "vote_record",
]);

export const meetingStatus = pgEnum("meeting_status", [
  "scheduled",
  "held",
  "cancelled",
  "archived",
]);

export const entityType = pgEnum("entity_type", [
  "address",
  "parcel",
  "project",
  "organization",
  "person",
  "topic",
  "policy",
]);

export const alertStatus = pgEnum("alert_status", [
  "preview",
  "queued",
  "sent",
  "dismissed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const jurisdictions = pgTable(
  "jurisdictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    region: text("region").notNull().default("Metro Vancouver"),
    platform: text("platform").notNull(),
    websiteUrl: text("website_url"),
    population: text("population"),
    priority: text("priority").notNull().default("P1"),
    connectorStatus: text("connector_status").notNull().default("planned"),
    ...timestamps,
  },
  (table) => [index("jurisdictions_slug_idx").on(table.slug)],
);

export const governingBodies = pgTable(
  "governing_bodies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jurisdictionId: uuid("jurisdiction_id")
      .references(() => jurisdictions.id)
      .notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    bodyType: text("body_type").notNull(),
    sourceUrl: text("source_url"),
    ...timestamps,
  },
  (table) => [
    index("governing_bodies_jurisdiction_idx").on(table.jurisdictionId),
    index("governing_bodies_slug_idx").on(table.slug),
  ],
);

export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    governingBodyId: uuid("governing_body_id")
      .references(() => governingBodies.id)
      .notNull(),
    title: text("title").notNull(),
    status: meetingStatus("status").notNull().default("scheduled"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    sourceUrl: text("source_url").notNull(),
    agendaUrl: text("agenda_url"),
    videoUrl: text("video_url"),
    sourceExternalId: text("source_external_id"),
    ...timestamps,
  },
  (table) => [
    index("meetings_governing_body_idx").on(table.governingBodyId),
    index("meetings_starts_at_idx").on(table.startsAt),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingId: uuid("meeting_id").references(() => meetings.id),
    type: documentType("type").notNull(),
    title: text("title").notNull(),
    sourceUrl: text("source_url").notNull(),
    storageKey: text("storage_key"),
    extractedText: text("extracted_text"),
    sourceMetadata: jsonb("source_metadata").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    index("documents_meeting_idx").on(table.meetingId),
    index("documents_type_idx").on(table.type),
  ],
);

export const agendaItems = pgTable(
  "agenda_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingId: uuid("meeting_id")
      .references(() => meetings.id)
      .notNull(),
    documentId: uuid("document_id").references(() => documents.id),
    itemNumber: text("item_number"),
    title: text("title").notNull(),
    body: text("body"),
    sourceUrl: text("source_url"),
    ...timestamps,
  },
  (table) => [
    index("agenda_items_meeting_idx").on(table.meetingId),
    index("agenda_items_document_idx").on(table.documentId),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingId: uuid("meeting_id")
      .references(() => meetings.id)
      .notNull(),
    mediaType: text("media_type").notNull(),
    sourceUrl: text("source_url"),
    storageKey: text("storage_key"),
    durationSeconds: text("duration_seconds"),
    ...timestamps,
  },
  (table) => [index("media_assets_meeting_idx").on(table.meetingId)],
);

export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mediaAssetId: uuid("media_asset_id")
      .references(() => mediaAssets.id)
      .notNull(),
    speaker: text("speaker"),
    startSeconds: text("start_seconds").notNull(),
    endSeconds: text("end_seconds").notNull(),
    text: text("text").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    ...timestamps,
  },
  (table) => [index("transcript_segments_media_idx").on(table.mediaAssetId)],
);

export const entities = pgTable(
  "entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: entityType("type").notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    index("entities_type_idx").on(table.type),
    index("entities_normalized_name_idx").on(table.normalizedName),
  ],
);

export const mentions = pgTable(
  "mentions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityId: uuid("entity_id")
      .references(() => entities.id)
      .notNull(),
    documentId: uuid("document_id").references(() => documents.id),
    agendaItemId: uuid("agenda_item_id").references(() => agendaItems.id),
    transcriptSegmentId: uuid("transcript_segment_id").references(
      () => transcriptSegments.id,
    ),
    confidence: text("confidence"),
    matchedText: text("matched_text").notNull(),
    ...timestamps,
  },
  (table) => [
    index("mentions_entity_idx").on(table.entityId),
    index("mentions_document_idx").on(table.documentId),
    index("mentions_agenda_item_idx").on(table.agendaItemId),
  ],
);

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    audience: text("audience").notNull(),
    query: text("query").notNull(),
    cadence: text("cadence").notNull().default("daily"),
    filters: jsonb("filters").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [index("saved_searches_query_idx").on(table.query)],
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    savedSearchId: uuid("saved_search_id")
      .references(() => savedSearches.id)
      .notNull(),
    status: alertStatus("status").notNull().default("preview"),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    evidence: jsonb("evidence").$type<Record<string, unknown>[]>(),
    ...timestamps,
  },
  (table) => [
    index("alerts_saved_search_idx").on(table.savedSearchId),
    index("alerts_status_idx").on(table.status),
  ],
);

export const summaries = pgTable(
  "summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingId: uuid("meeting_id").references(() => meetings.id),
    agendaItemId: uuid("agenda_item_id").references(() => agendaItems.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    sourceRefs: jsonb("source_refs").$type<Record<string, unknown>[]>(),
    ...timestamps,
  },
  (table) => [
    index("summaries_meeting_idx").on(table.meetingId),
    index("summaries_agenda_item_idx").on(table.agendaItemId),
  ],
);
