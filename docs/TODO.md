# Carried TODO

Status key: `[todo]`, `[doing]`, `[done]`, `[blocked]`.

## Now

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

- [todo] Verify exact platform URLs for v1 municipalities.
- [todo] Implement eScribe connector spike.
- [todo] Implement Vancouver connector:
  - council meetings
  - agenda/minutes documents
  - voting records API
  - development-related open data
- [todo] Implement Surrey connector:
  - agendas
  - minutes
  - video archive metadata
- [todo] Add document storage plan for PDFs, extracted text, audio, and video artifacts.
- [todo] Decide forward-only capture versus historical backfill.

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
- [todo] Add search UI connected to seed data.
- [todo] Add saved alert creation flow.
- [todo] Add project tracking flow.
- [todo] Add meeting summary/detail view.

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
  - next task
  - blockers, if any
