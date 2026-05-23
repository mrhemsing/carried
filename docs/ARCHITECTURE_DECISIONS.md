# Architecture Decisions

## Current Decisions

- **Framework:** Next.js App Router with TypeScript.
- **UI:** Tailwind CSS and shadcn components.
- **Database:** Postgres.
- **Vector search:** pgvector, colocated in Postgres for the MVP.
- **Schema/query layer:** Drizzle.
- **Object storage:** S3-compatible storage, likely Cloudflare R2.
- **Notification channel:** email first, Slack after alert evidence is reliable.
- **Initial ingestion mode:** forward-looking capture first; historical backfill is deferred until customer validation.

## Why Postgres + pgvector + Drizzle

Carried needs relational structure for jurisdictions, meetings, documents, agenda items, entities, mentions, saved searches, alerts, and summaries. It also needs semantic search over transcript/document chunks. Keeping relational data and vectors in Postgres simplifies the MVP and avoids running a separate vector database before the ingestion model is proven.

Drizzle keeps the schema close to TypeScript while preserving SQL visibility. That matters for ingestion, indexing, and debugging source-data edge cases.

## Deferred Decisions

- Auth provider: Clerk, Auth.js, or Supabase Auth.
- Hosting target: Vercel plus managed Postgres/R2, or Railway/Fly if workers need tighter control.
- Job runner: Inngest, Trigger.dev, QStash, or a simple worker process.
- Transcription provider: hosted API versus self-hosted Whisper.
