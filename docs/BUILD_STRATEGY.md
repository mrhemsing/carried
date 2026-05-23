# Carried Build Strategy

## Product Thesis

Carried is a Canada-first local government meeting monitor for Greater Vancouver. It ingests agendas, minutes, meeting videos, transcripts, voting records, and development application signals, then turns them into searchable records and alerts for people who need to know when civic decisions touch their projects, neighbourhoods, or issues.

The wedge is narrow and local: Metro Vancouver developers, planners, lobbyists, lawyers, advocacy organizations, journalists, and engaged residents. The broader moat is BC-specific meeting data, local planning vocabulary, historical archive capture, and cross-jurisdiction tracking across municipalities that currently publish information through fragmented systems.

Source planning: `docs/CARRIED_BUSINESS_PLAN.md`.

## V1 Product Shape

- **Search:** full-text search over meeting agendas, minutes, and transcripts by topic, address, project, person, company, municipality, or governing body.
- **Alerts:** saved keyword/topic/project alerts for upcoming agendas and post-meeting outcomes.
- **Project tracking:** follow a rezoning, development application, address, PID, or named initiative across meetings.
- **Meeting summaries:** concise post-meeting synthesis with links back to source documents and transcript timestamps where available.
- **Three onboarding paths:** address-first for residents, project-first for developers, topic-first for advocates and journalists.

## V1 Data Scope

Start with the highest-leverage Metro Vancouver coverage:

1. eScribe connector for Burnaby, Delta, Maple Ridge, New Westminster, Port Coquitlam, Port Moody, Langley City, White Rock, and Pitt Meadows.
2. Vancouver custom connector for `council.vancouver.ca`, Vancouver Open Data voting records, and related development datasets.
3. Surrey custom connector for agendas, minutes, and video archive.
4. Township of Langley as deferred custom calendar + YouTube work, not part of the initial eScribe batch.

This targets the plan's revised v1: eScribe + Vancouver + Surrey, aiming at broad population coverage without needing every custom municipal site on day one.

## Technical Architecture

- **App:** Next.js App Router, TypeScript, Tailwind CSS, shadcn, Server Components by default.
- **Database:** Postgres with pgvector as the default persistence/search foundation unless deployment constraints force a managed vector store.
- **ORM/query layer:** choose Drizzle or Prisma after the first schema spike; prefer simple SQL visibility because ingestion/search workflows will need careful indexing.
- **Storage:** S3-compatible object storage for source PDFs, extracted text, audio, and video artifacts. Cloudflare R2 is a likely fit.
- **Jobs:** background queue for scheduled ingestion, document parsing, transcription, embedding, summarization, and alert delivery.
- **AI pipeline:** Whisper or equivalent for transcription, embeddings for semantic search, LLM extraction for summaries/entities/topics.
- **Delivery:** email first, Slack later. Keep alert records auditable so users can see why they were notified.

## Domain Model Draft

- `jurisdictions`: municipalities and regional bodies.
- `governing_bodies`: council, committees, boards, school boards, police boards.
- `meetings`: scheduled/held meetings, agenda URLs, video URLs, status.
- `documents`: agendas, minutes, reports, attachments, source metadata.
- `agenda_items`: structured items from agendas/minutes.
- `media_assets`: captured audio/video and transcript links.
- `transcripts`: segments with timestamps and speaker/source confidence.
- `entities`: addresses, parcels, projects, organizations, people, topics.
- `mentions`: entity-to-document/transcript/agenda item links.
- `saved_searches`: user-defined keywords, topics, projects, geographies.
- `alerts`: generated notifications with matched evidence.
- `summaries`: meeting/item/project summaries with source references.

## Build Milestones

1. **Product brief and app map**
   - Convert the business plan into personas, jobs-to-be-done, route map, and first demo workflow.
   - Build the public landing page and static dashboard shell.

2. **Data model and seed UI**
   - Add database tooling and schema.
   - Seed sample jurisdictions, meetings, agenda items, entities, and alerts.
   - Build searchable/mock dashboard views before live ingestion.

3. **eScribe ingestion spike**
   - Implement one eScribe municipality end to end.
   - Persist meetings, agenda documents, agenda items, and source links.
   - Add source-page fixtures/tests so scraper changes are visible.

4. **Search and alerts MVP**
   - Add keyword search over seeded + ingested records.
   - Add saved searches and generated alert previews.
   - Ship email alert skeleton with evidence links.

5. **Vancouver connector**
   - Ingest Vancouver council agendas/meetings and voting records.
   - Add Vancouver-specific entities: addresses, rezonings, CD-1/OCP/Broadway Plan terms.

6. **Transcription and summaries**
   - Capture or link meeting video/audio.
   - Generate transcript segments for a small sample.
   - Produce item-level and meeting-level summaries with timestamps.

7. **Customer demo package**
   - Prepare demo accounts for developer, journalist, and resident personas.
   - Add sample alert email, pricing page draft, and discovery-call feedback loop.

## Immediate Implementation Slice

Build the first clickable product surface before live scraping:

- Public homepage that explains Carried for Metro Vancouver civic monitoring.
- App shell with dashboard, search, alerts, projects, jurisdictions, and settings routes.
- Mock data for Vancouver, Surrey, Burnaby, and Richmond.
- Search/results UI that demonstrates agenda alerts, project tracking, and meeting summaries.

This gives Matt something demoable while ingestion work proceeds behind it.

## Open Decisions

- Pick database/ORM after a one-file schema spike.
- Confirm deployment target: Vercel + managed Postgres/R2, or Railway/Fly for integrated workers.
- Confirm auth provider: Clerk, Auth.js, or Supabase Auth.
- Verify Carried domain/trademark availability.
- Decide whether to backfill historical meetings immediately or start forward-only to control costs.
