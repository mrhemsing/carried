# Carried Product Brief

## One-Line Pitch

Carried monitors Greater Vancouver civic meetings and alerts users when an address, project, company, topic, or policy they care about appears in agendas, minutes, transcripts, votes, or development records.

## Primary Wedge

Start with Metro Vancouver real estate and civic-affairs users who currently check fragmented municipal websites manually. The first paid value is saving them from missing agenda movement, public hearing activity, staff reports, votes, and cross-jurisdiction signals.

## Initial Personas

### Real Estate Developer / Planning Consultant

- Tracks rezonings, development permit movement, staff reports, hearings, and votes.
- Cares about addresses, project names, parcel IDs, neighbourhood plans, and competitor activity.
- Pays for fast alerts, cross-city coverage, source links, and project history.

### Lobbyist / Government Affairs Lead

- Tracks policy language, council sentiment, committee movement, and stakeholder mentions.
- Cares about reliable monitoring across municipalities and regional bodies.
- Pays for saved searches, digests, team workflows, and evidence trails.

### Advocacy Organization

- Tracks issues like housing, transit, climate, SROs, policing, public space, parks, and school-board decisions.
- Cares about upcoming agendas early enough to mobilize.
- Pays less than commercial teams, but provides credibility and public-interest reach.

### Journalist

- Searches meeting records quickly and needs concise source-linked summaries.
- Cares about public-interest leads, exact timestamps, and agenda previews.
- Likely starts free/low-cost as a distribution and SEO channel.

### Resident

- Wants to know what is happening near an address or neighbourhood.
- Cares about simple onboarding, plain-language summaries, and non-technical alerts.
- Useful for brand trust, but not the first revenue engine.

## Jobs To Be Done

- Find whether a topic, project, address, person, or company appeared in civic records.
- Subscribe to a project/topic/address and get notified before or after relevant meetings.
- Understand what changed in a meeting without watching hours of video.
- Track a development or policy across multiple municipalities.
- Verify every alert with links to the original agenda, minutes, transcript segment, vote, or report.

## V1 Workflows

### Search First

1. User searches a topic like "Broadway Plan rezoning".
2. Carried returns agenda/minute/transcript results grouped by municipality and date.
3. User opens a result and sees source metadata, matching terms, and a short summary.
4. User saves the query as an alert.

### Alert First

1. User creates an alert for a topic, address, project, or keyword group.
2. Carried previews recent matching civic records.
3. User chooses cadence: immediate, agenda-only, post-meeting, or digest.
4. Carried sends future matches with evidence links.

### Project First

1. User enters a project name, address, PID, or rezoning identifier.
2. Carried creates a tracked project record.
3. Carried links agenda items, votes, documents, and transcript mentions to the project timeline.
4. User sees upcoming and recent activity in one place.

## Non-Goals For V1

- Do not cover all Canadian municipalities.
- Do not build real-time livestream monitoring before reliable agenda/minute ingestion.
- Do not make resident social features, comments, or forums.
- Do not build city-facing accessibility/newsletter workflows until the commercial wedge is validated.
- Do not backfill every historical meeting before proving forward-looking alerts.

## Demo Requirements

- Homepage that makes the Metro Vancouver civic-monitoring wedge obvious.
- Dashboard with search, alerts, projects, jurisdictions, and settings.
- Mock data for Vancouver, Surrey, Burnaby, and Richmond.
- Clear V1 coverage story: eScribe + Vancouver + Surrey.
- A sample alert that shows why the user was notified.
- A project tracking view that shows status, jurisdiction, next action, and signal.

## Success Criteria For First Usable MVP

- One live connector ingests real agenda records into the database.
- Search works across seeded and ingested records.
- Saved alerts can be created and previewed.
- Alert evidence links back to source documents.
- At least one customer-discovery prospect can understand the demo without a walkthrough.
