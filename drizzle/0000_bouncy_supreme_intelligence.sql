CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('preview', 'queued', 'sent', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('agenda', 'minutes', 'report', 'attachment', 'transcript', 'vote_record');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('address', 'parcel', 'project', 'organization', 'person', 'topic', 'policy');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'held', 'cancelled', 'archived');--> statement-breakpoint
CREATE TABLE "agenda_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"document_id" uuid,
	"item_number" text,
	"title" text NOT NULL,
	"body" text,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saved_search_id" uuid NOT NULL,
	"status" "alert_status" DEFAULT 'preview' NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"evidence" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid,
	"type" "document_type" NOT NULL,
	"title" text NOT NULL,
	"source_url" text NOT NULL,
	"storage_key" text,
	"extracted_text" text,
	"source_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "entity_type" NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governing_bodies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"body_type" text NOT NULL,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jurisdictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"region" text DEFAULT 'Metro Vancouver' NOT NULL,
	"platform" text NOT NULL,
	"website_url" text,
	"population" text,
	"priority" text DEFAULT 'P1' NOT NULL,
	"connector_status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jurisdictions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"media_type" text NOT NULL,
	"source_url" text,
	"storage_key" text,
	"duration_seconds" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"governing_body_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"starts_at" timestamp with time zone,
	"source_url" text NOT NULL,
	"agenda_url" text,
	"video_url" text,
	"source_external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"document_id" uuid,
	"agenda_item_id" uuid,
	"transcript_segment_id" uuid,
	"confidence" text,
	"matched_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"audience" text NOT NULL,
	"query" text NOT NULL,
	"cadence" text DEFAULT 'daily' NOT NULL,
	"filters" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid,
	"agenda_item_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"source_refs" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"speaker" text,
	"start_seconds" text NOT NULL,
	"end_seconds" text NOT NULL,
	"text" text NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governing_bodies" ADD CONSTRAINT "governing_bodies_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_governing_body_id_governing_bodies_id_fk" FOREIGN KEY ("governing_body_id") REFERENCES "public"."governing_bodies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_transcript_segment_id_transcript_segments_id_fk" FOREIGN KEY ("transcript_segment_id") REFERENCES "public"."transcript_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agenda_items_meeting_idx" ON "agenda_items" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "agenda_items_document_idx" ON "agenda_items" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "alerts_saved_search_idx" ON "alerts" USING btree ("saved_search_id");--> statement-breakpoint
CREATE INDEX "alerts_status_idx" ON "alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_meeting_idx" ON "documents" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "entities_type_idx" ON "entities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "entities_normalized_name_idx" ON "entities" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "governing_bodies_jurisdiction_idx" ON "governing_bodies" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "governing_bodies_slug_idx" ON "governing_bodies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "jurisdictions_slug_idx" ON "jurisdictions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "media_assets_meeting_idx" ON "media_assets" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meetings_governing_body_idx" ON "meetings" USING btree ("governing_body_id");--> statement-breakpoint
CREATE INDEX "meetings_starts_at_idx" ON "meetings" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "mentions_entity_idx" ON "mentions" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "mentions_document_idx" ON "mentions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "mentions_agenda_item_idx" ON "mentions" USING btree ("agenda_item_id");--> statement-breakpoint
CREATE INDEX "saved_searches_query_idx" ON "saved_searches" USING btree ("query");--> statement-breakpoint
CREATE INDEX "summaries_meeting_idx" ON "summaries" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "summaries_agenda_item_idx" ON "summaries" USING btree ("agenda_item_id");--> statement-breakpoint
CREATE INDEX "transcript_segments_media_idx" ON "transcript_segments" USING btree ("media_asset_id");
