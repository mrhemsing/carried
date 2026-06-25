# Carried TODO

Status key: `[todo]`, `[doing]`, `[done]`, `[blocked]`.

## Now

- [doing] Step the product up to paid-quality Canadian civic intelligence:
  - count only records that are readable, searchable, source-backed, and useful
  - stop treating ingestion counts as progress unless they improve product quality
  - expand Canadian coverage while preserving content quality
  - prioritize professional workflows: development, land use, policy, procurement, advocacy, journalism
- [done] Build the first clickable product surface:
  - public homepage for Metro Vancouver civic monitoring
  - dashboard shell
  - mock search, alerts, projects, jurisdictions, and settings views
- [done] Convert the business plan into a tighter product brief:
  - personas
  - jobs-to-be-done
  - non-goals
  - first demo workflow
- [done] Choose initial auth/database/deployment stack.

## Product

- [doing] Position Carried as the Canadian equivalent of Hamlet-level local government intelligence:
  - Canada-first coverage, not competing for US jurisdictions
  - source-backed meeting notes people can read quickly
  - searchable agendas, packets, reports, attachments, minutes, votes, and transcripts
  - direct provenance links for every useful claim
  - alerts and project/entity tracking for development, land use, policy, procurement, and advocacy workflows
  - content quality must be good enough for paid professional use, not just public transparency browsing
- [todo] Define buyer personas:
  - real estate developer / planning consultant
  - lobbyist / government affairs lead
  - advocacy organization
  - journalist
  - resident tracking a neighbourhood/address
- [todo] Draft homepage positioning:
  - one-line pitch
  - three use cases
  - sample alert
  - v1 municipality coverage
- [todo] Draft pricing hypothesis:
  - free journalist/resident tier
  - individual/pro tier
  - team/business tier
  - enterprise/city tier
- [todo] Create customer discovery list:
  - first 10 developers
  - first 10 planning/law/government-affairs firms
  - first 10 advocacy/news contacts

## Data And Ingestion

- [doing] Quality gates for a meeting record:
  - meeting has source URL and source platform provenance
  - agenda items are stored with item numbers, titles, and source URLs
  - item-level reports/attachments/minutes are discovered and linked where present
  - source documents have extracted text or an explicit extraction error
  - agenda item notes prefer the richest linked document over agenda-only text
  - notes are readable in sections, not raw PDF dumps
  - search can find the item/document and link back to the meeting/source
  - coverage/readability counts are visible in the app
- [doing] Make ingestion product-grade, not title-grade:
  - fetch every source object linked from a meeting
  - store raw/source provenance and extracted text
  - attach extracted text to agenda items/documents
  - make it searchable in the app
  - render evidence with source links
  - prefer item-level reports/attachments/minutes over agenda-only text whenever available
  - treat Hamlet-level content quality as the benchmark: readable, searchable, source-backed, alertable
  - next gaps: video transcription, speaker segments, votes, summaries, entities, project timelines
- [doing] Build Hamlet-style meeting video transcript search:
  - every meeting with a video URL must have a media asset queued for capture/transcription
  - transcript segments must be timestamped and searchable as exact meeting moments
  - search results must show matching transcript snippets with timestamps and meeting/source links
  - meeting pages must expose video, transcript coverage, and searchable moments
  - current baseline: 37 video media assets queued, 4 transcribed, 33 still need audio extraction
  - run `npm run ingest:transcripts:coverage` before each heartbeat and paste the city-by-city counts
- [doing] Transcript coverage by city:
  - Current DB coverage window: February 2026 eScribe sample, not full-year or 12-month coverage
  - Total: 4/37 video assets transcribed, 5.45 transcript hours, 5,125 segments, 33 need audio extraction
  - Burnaby: 4/7 transcribed, 5.45 hours, 5,125 segments, 3 need audio extraction
  - Delta: 0/2 transcribed, 2 need audio extraction
  - Langley City: 0/5 transcribed, 5 need audio extraction
  - Maple Ridge: 0/3 transcribed, 3 need audio extraction
  - New Westminster: 0/3 transcribed, 3 need audio extraction
  - Pitt Meadows: 0/3 transcribed, 3 need audio extraction
  - Port Coquitlam: 0/5 transcribed, 5 need audio extraction
  - Port Moody: 0/4 transcribed, 4 need audio extraction
  - White Rock: 0/5 transcribed, 5 need audio extraction
  - Vancouver, Surrey, Richmond: connectors not yet contributing video assets in the current DB
- [done] Verify exact platform URLs for v1 municipalities.
- [done] Implement eScribe connector spike.
- [done] Persist eScribe normalized meetings/documents/items into Postgres.
- [done] Extract text from current Burnaby/Delta source documents and expose it in meetings/search.
- [todo] Implement Vancouver connector:
  - council meetings
  - agenda/minutes documents
  - [done] voting records API sample
  - [done] first council/public-hearing/standing-committee URL-pattern connector and persistence path
  - [blocked] live `council.vancouver.ca` fetch from current runner is Cloudflare-blocked; fixture parser/build pass, but production capture needs a fetch path that the city site accepts
  - development-related open data
- [todo] Implement Surrey connector:
  - agendas
  - minutes
  - video archive metadata
- [todo] Add document storage plan for PDFs, extracted text, audio, and video artifacts.
- [done] Decide forward-only capture versus historical backfill:
  - forward capture first
  - 12-month high-value backfill second
  - targeted 5-year archive only after demand is validated
- [doing] Implement forward video/audio capture plan.
- [doing] Implement 12-month high-value transcription backfill.

## App

- [done] Create static mock dashboard and product routes.
- [done] Add database schema:
  - jurisdictions
  - governing bodies
  - meetings
  - documents
  - agenda items
  - media assets
  - transcript segments
  - entities
  - mentions
  - saved searches
  - alerts
  - summaries
- [done] Add seed data for Vancouver, Surrey, Burnaby, and Richmond.
- [done] Add search UI connected to seed-style data access layer.
- [done] Add saved alert creation flow.
- [done] Add project tracking flow.
- [done] Add meeting summary/detail view.

## Infrastructure

- [done] Pick persistence stack: Postgres + pgvector with Drizzle.
- [todo] Pick auth provider: Clerk, Auth.js, or Supabase Auth.
- [todo] Pick object storage: likely Cloudflare R2.
- [todo] Pick job runner/queue for ingestion and alert delivery.
- [done] Add environment variable documentation.
- [todo] Add deployment plan.

## Brand And Legal

- [todo] Check domain options:
  - carried.com
  - carried.ca
  - carriedhq.com
  - getcarried.com
  - trycarried.com
- [todo] Check CIPO and USPTO conflicts for "Carried" in software/SaaS classes.
- [todo] Draft terms/privacy requirements for public-data monitoring and alerting.

## Heartbeat

- [done] Send progress heartbeat every 60 minutes while this build track is active.
- [todo] Each heartbeat should include:
  - current task
  - completed since last heartbeat
  - transcript coverage by city from `npm run ingest:transcripts:coverage`
  - next task
  - blockers, if any
