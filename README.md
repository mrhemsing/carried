# Carried

Carried is a local government meeting monitor for Greater Vancouver. It tracks agendas, minutes, transcripts, votes, and development-related civic activity so users can search across municipalities and receive alerts when their topics, projects, or addresses come up.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm run lint
npm run build
```

## Database

Copy `.env.example` to `.env.local`, set `DATABASE_URL`, then run:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

For local development with Docker:

```bash
docker compose up -d
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/carried"
npm run db:migrate
npm run db:seed
npm run ingest:escribe:persist
npm run ingest:escribe:batch
```

The single-tenant eScribe persist script targets Burnaby February 2026 sample data. The batch script runs the same normalized persistence path across the configured eScribe municipalities and writes jurisdictions, governing bodies, meetings, documents, and agenda items.

Connector samples:

```bash
npm run ingest:escribe:sample
npm run ingest:escribe:batch -- --limit 2
npm run ingest:vancouver:votes
```

## Docs

- Business plan: `docs/CARRIED_BUSINESS_PLAN.md`
- Build strategy: `docs/BUILD_STRATEGY.md`
- Product brief: `docs/PRODUCT_BRIEF.md`
- Architecture decisions: `docs/ARCHITECTURE_DECISIONS.md`
- Platform verification: `docs/PLATFORM_VERIFICATION.md`
- Transcription/backfill plan: `docs/TRANSCRIPTION_BACKFILL_PLAN.md`
