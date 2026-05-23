# Carried — Business Exploration Notes

A working document exploring an AI-powered local government meeting monitoring service for Greater Vancouver. Captured from a research conversation.

---

## 1. Initial Brainstorm: AI App/Business Ideas

The more promising AI app/business directions right now, based on where the market is actually paying:

**Vertical AI agents for boring industries.** The big wins lately aren't general-purpose chatbots — they're agents that do one specific job in industries with messy workflows: dental practice intake, plumbing dispatch, freight brokerage, insurance claims triage, legal e-discovery. Less competition, sticky contracts, and customers who'll pay $500–$5K/month because it replaces real labor.

**"AI-native" replacements for legacy SaaS.** Pick a clunky tool people hate (ATS, CRM, EHR, expense reports) and rebuild it where the AI is the interface, not a feature bolted on. The pitch: "talk to it, it does the work" instead of 40 form fields.

**Tools for solo operators and small teams.** Bookkeeping, contract review, sales follow-up, content repurposing for creators. People running 1–10 person businesses will pay for things that feel like hiring a junior employee.

**Data infrastructure for AI agents.** Less sexy, but: eval tools, observability, browser automation that doesn't break, auth/permissions for agents acting on someone's behalf. Picks-and-shovels stuff.

**Physical world + AI.** Computer vision for construction site safety, restaurant kitchen monitoring, retail shelf checks, agricultural disease detection. Hardware-ish but defensible.

Caveats: pure "wrapper" apps with no distribution or proprietary data are getting crushed. The durable businesses tend to have one of — a wedge into a specific industry, proprietary workflow data, or a real distribution channel.

---

## 2. Specific Concrete Ideas

- **Skate video archivist-as-a-service.** AI that ingests old skate videos (or any subculture archive — BMX, surf, graffiti zines, rave flyers) and auto-tags tricks, skaters, spots, music, sponsors. Sell to brands sitting on decades of footage they can't search, plus collectors and documentarians.
- **Permit and licensing copilot for trades.** Electricians, contractors, food trucks, salons — every jurisdiction has different rules and they waste hours figuring out what to file.
- **AI lease/contract reviewer for tenants and small landlords.** Volume play at $20–50 per review.
- **Inbox-to-CRM for solo salespeople.** Reads sent mail, infers deals, drafts follow-ups, surfaces who's gone cold.
- **Local government meeting monitor.** Auto-watches city council, zoning board, school board meetings in a region and alerts residents/journalists/developers when their topic comes up. ← *The chosen idea.*
- **Veterinary clinic intake and triage agent.**
- **"Estate sale" AI for downsizing seniors.** Photograph a house, get a sortable inventory with rough resale values, donation suggestions, drafted listings.
- **Compliance documentation generator for small manufacturers.** SOC 2, ISO, FDA, OSHA paperwork.

---

## 3. The Chosen Concept: Local Government Meeting Monitor

### Competitive Landscape

The space is crowded in the US but mostly empty in Canada.

- **Cloverleaf AI** — millions of hours of council meetings, geographic-based pricing, mostly US-focused.
- **Curate (FiscalNote)** — scans 12,000+ local government entities via meeting minutes, agendas, planning documents. Sells to associations, real estate, advocacy.
- **Hamlet** — closest match. Takes online video recordings of city council meetings, summarizes them, makes them searchable. Free search tool covering 1,200+ US cities and counties; paid tier tracks projects/agendas for real estate developers, PACs, nonprofits.
- **Aware (awarenow.ai)** — meeting summaries delivered via push, email, or WhatsApp; sells to cities directly.
- **The Common** — AI council meeting summaries with a Pro tier for team workflows.

The US market has multiple funded players. **Vancouver / BC is a different story** — none cover BC municipalities meaningfully.

### The Opening

1. **Canada-first regional play.** Lower Mainland → BC → Canada. Different procurement rules, different planning law (BC's Bill 18 just changed public hearing requirements), different buyers. US incumbents won't bother for a while.
2. **Real estate developer wedge.** Vancouver's development scene is enormous and rezoning-heavy.
3. **Journalism is a loss-leader.** Free tier for journalists/residents to build brand and SEO. Paid tiers for developers, lobbyists, unions, advocacy orgs.

### Risk

Hamlet or Curate decides to expand to Canada in 12-18 months. Defensibility has to be local relationships, BC-specific data (planning applications, OCP amendments, rezoning history), and faster product iteration.

---

## 4. Public Data Availability (Vancouver)

The raw material is wide open:

- **Council voting records** on the Open Data Portal — captured since 2016 via electronic voting, covering Council, Special Council, Standing Committee, and Public Hearing meetings, updated within two business days. Available via API.
- Open Data Portal has API access for issued building permits, zoning districts, election results, dozens of other datasets.
- There's already an R wrapper (VancouvR) maintained by Jens von Bergmann.
- Active rezoning applications mapped on Shape Your City and VanMap.
- Council meetings streamed live and archived; agendas posted ~1 week before meetings.

### Infrastructure Pattern

Most BC municipalities use one of two platforms:

- **eScribe** — Port Coquitlam, Burnaby, and 400+ municipalities across North America. Standardized HTML/PDF agendas.
- **Granicus** — Surrey, Richmond, North Van. Same logic: one integration, many cities.
- **CivicEngage** — Coquitlam and others.

Build 3 connectors and you've got most of BC.

### Known Limitations

1. **Video retention is short and inconsistent.** Surrey only keeps videos for two years; other Metro Vancouver councils similar. Implication: capture and archive video yourself from day one. That's a moat.
2. Minutes lag (Coquitlam only posts after they're adopted at the next meeting).
3. Bill 18 (2024) eliminated public hearings for ODP-consistent residential projects with 50%+ residential floor area. Actually increases demand — developers/advocates have fewer formal touchpoints.
4. There's already an unofficial automated YouTube re-upload channel for Surrey council meetings.

### V1 Stack

**Data sources:** city eScribe / Granicus / CivicEngage feeds for agendas and minutes, livestream URLs, Vancouver's Open Data Portal API, Shape Your City and equivalents for development application status. Phase 2: Metro Vancouver / TransLink / school district boards.

**Pipeline:** daily ingest of new agendas (PDF and HTML), Whisper transcription of meeting video as posted, embedding + topic extraction, named-entity recognition for addresses and parcel IDs, keyword/topic alerts via email or Slack.

---

## 5. How Hamlet Actually Works

Hamlet isn't address-first. It's keyword/topic-first across a huge index.

The core product is full-text search over transcripts of 3,500+ governing bodies — city councils, planning commissions, school boards, zoning boards. Search a topic, project name, address, person, or company, jump to the exact moment in a meeting where it was discussed.

For paid users, three things on top of search:

1. **Agenda alerts** — pings you when keywords/projects you care about show up on an upcoming agenda.
2. **Project tracking** — follow a specific development, ordinance, or initiative across meetings as it evolves.
3. **Post-meeting synthesis** — summarizes what happened so users don't have to watch hours-long videos.

They use a combination of official transcripts, video recordings, and AI-powered transcription plus human verification.

### Who Pays Hamlet

Originally thought it was a media company. Then real estate developers and PACs started reaching out. Now they target government affairs teams, advocacy orgs, renewable energy developers. Also a B2G angle: Saratoga, CA contracted with Hamlet for newsletters/articles linked from the city's own newsletter.

They have $10M and human verification — not pure-AI.

### Vancouver Differentiation

Hamlet is a horizontal search platform — power-user friendly, overwhelming for first-time visitors. A Vancouver-first product could go narrower:

- **Address-first onboarding for residents:** punch in your address, get auto-subscribed to your neighbourhood, ward, school catchment, and any rezoning within X metres.
- **Project-first onboarding for developers:** punch in a PID or rezoning application number.
- **Topic-first onboarding for advocates and journalists:** subscribe to "DTES," "SROs," "bike lanes," "Broadway Plan," "Jericho Lands."

Same underlying engine, three different front doors. Hamlet basically only built #2 and #3.

Defensibility isn't "we built a better search engine" — it's "we're the BC-specific product with local data integrations (BC Assessment, LTSA, Metro Vancouver, TransLink), local schema (CD-1, OCP, Broadway Plan), and a Canadian buyer who doesn't want to be customer #1 of a US vendor's international expansion."

---

## 6. Scope: Greater Vancouver

### Core 21 Municipalities

Vancouver, Surrey, Burnaby, Richmond, Coquitlam, Langley City, Langley Township, Delta, North Vancouver City, North Vancouver District, West Vancouver, Port Coquitlam, Port Moody, Maple Ridge, Pitt Meadows, New Westminster, White Rock, Anmore, Belcarra, Bowen Island, Lions Bay. Plus Tsawwassen First Nation and Electoral Area A (UBC/UEL).

### Regional / Quasi-Governmental Bodies

- Metro Vancouver Board (regional planning, water, sewer, parks)
- TransLink Mayors' Council and Board
- Vancouver Park Board (separately elected)
- Vancouver School Board + every other district board (Surrey, Burnaby, Richmond, Coquitlam, etc.)
- Vancouver Police Board, plus other municipal police boards
- Vancouver Coastal Health and Fraser Health board meetings (public portions)

Roughly 35-45 governing bodies total.

### Why This Scope

1. **Buyers concentrated here.** Almost every BC real estate developer, urban planning consultancy, lobbyist firm, advocacy org, and political shop is headquartered in Metro Van.
2. **Uniform data flow.** All BC munis under the Community Charter (Vancouver under the Vancouver Charter). Same provincial planning framework.
3. **Cross-jurisdiction tracking is a real feature.** A developer with projects in Burnaby, Surrey, and Richmond currently monitors three different city websites. Collapse into one feed.
4. **Defensible footprint.** Only product that does all 21 munis + regional bodies well.

### Phasing

- **v1 (months 1-3):** Vancouver + Burnaby + Surrey + Richmond. Covers ~70% of regional development activity.
- **v2 (months 3-6):** Coquitlam, Port Coquitlam, Port Moody, New West, North Van City + District, West Van, Delta, Langley City + Township. ~95% of population.
- **v3 (months 6-9):** Metro Vancouver Board, TransLink, school districts, Park Board.
- **v4 (year 2):** Either expand geographically (Victoria/CRD, Kelowna, Fraser Valley) or deepen (BC Assessment, LTSA, BC Hansard).

---

## 7. Platform Audit — Greater Vancouver Municipalities

| # | Municipality | Population | Platform | Confidence |
|---|---|---|---|---|
| 1 | Vancouver | 662K | Custom (`council.vancouver.ca`) + Open Data API | ✅ Verified |
| 2 | Surrey | 568K | Custom video archive, own site | ✅ Verified |
| 3 | Burnaby | 249K | **eScribe** (`pub-burnaby`) | ✅ Verified |
| 4 | Richmond | 209K | YouTube + own agendas page | ✅ Verified |
| 5 | Coquitlam | 148K | CivicEngage / Granicus | ✅ Verified |
| 6 | Langley Township | 132K | Likely eScribe | ⚠️ Inferred |
| 7 | Delta | 108K | **eScribe** (`pub-delta`) | ✅ Verified |
| 8 | North Van District | 92K | Own PDFs on dnv.org | ⚠️ Inferred |
| 9 | Maple Ridge | 92K | Own site + eScribe likely | ⚠️ Partial |
| 10 | New Westminster | 89K | **eScribe** (`pub-newwestcity`) | ✅ Verified |
| 11 | Port Coquitlam | 62K | **eScribe** (`pub-portcoquitlam`) | ✅ Verified |
| 12 | North Van City | 60K | Own PDFs on cnv.org | ✅ Verified (custom) |
| 13 | West Vancouver | 44K | Own PDFs on westvancouver.ca | ✅ Verified (custom) |
| 14 | Port Moody | 35K | **eScribe** (`pub-portmoody`) | ✅ Verified |
| 15 | Langley City | 29K | **eScribe** (`pub-langleycity`) | ✅ Verified |
| 16 | White Rock | 22K | **eScribe** (`pub-whiterockcity`) | ✅ Verified |
| 17 | Pitt Meadows | 19K | **eScribe** (`pub-pittmeadows`) | ✅ Verified |
| 18 | Bowen Island | 4K | Unknown — skip for v1 | ⚠️ |
| 19 | Anmore | 2K | Unknown — skip for v1 | ⚠️ |
| 20 | Lions Bay | 1K | Unknown — skip for v1 | ⚠️ |
| 21 | Belcarra | <1K | Unknown — skip for v1 | ⚠️ |

### Build-Effort Implications

- **eScribe connector unlocks ~9 munis covering ~700K people.** Single highest-leverage piece of work — one scraper, nine cities.
- **Four munis require custom scrapers:** Vancouver, Surrey, North Van City, West Vancouver. Vancouver worth it (biggest market + Open Data API). Surrey worth it (second largest). North Shore smaller — could defer.
- **Two need CivicEngage / Granicus connector:** Coquitlam (CivicEngage), Richmond (Granicus + YouTube).
- **Smallest 4 (Bowen, Anmore, Lions Bay, Belcarra) total ~7K people.** Skip for v1.

**Revised v1 scope:** eScribe connector + Vancouver custom + Surrey custom = **17 of 21 munis and ~93% of Metro Van's population.** Defensible v1 in 6-8 weeks solo.

---

## 8. Financial Analysis

### Revenue Potential — Metro Vancouver TAM

| Segment | # of buyers | Annual price | TAM if all captured |
|---|---|---|---|
| Real estate developers (medium/large) | ~40-60 | $6K-$15K | ~$400K |
| Architecture/planning consultancies | ~30-50 | $3K-$6K | ~$180K |
| Lobbyist/government affairs firms | ~15-25 | $8K-$20K | ~$300K |
| Advocacy orgs (housing, transit, env) | ~30-50 | $1K-$3K | ~$80K |
| News outlets (local + regional) | ~10-15 | $2K-$5K | ~$50K |
| Unions / industry associations | ~20-30 | $3K-$8K | ~$130K |
| Law firms (municipal, land use) | ~15-25 | $4K-$10K | ~$140K |
| Individual subscribers | hundreds | $100-$300 | ~$50K |

**Theoretical Metro Van TAM: ~$1.3M ARR if everyone signed up.** Realistic capture in 18 months: **$150K-$400K ARR**.

If expanded to all Canadian munis (~3,700): **~$15-30M ARR ceiling.** Venture-scale, but 5-7 year story.

### Valuation Scenarios

- Solo operator at $300K ARR by year 2 → business worth $1.5M-$3M (5-10x ARR for slow-growth B2B SaaS)
- $300K ARR with credible path to $3M-$5M → seed round at $8M-$15M valuation
- Bootstrapped to $500K-$1M ARR with low churn → acquisition by FiscalNote / Granicus / Canadian gov-data buyer at $3M-$8M

### One-Time Build Cost

| Item | One-time cost |
|---|---|
| Domain, accounts, business reg | ~$500 |
| Initial Whisper transcription of historical archive (~5,000-8,000 hours) | $2K-$5K self-hosted; $15K-$25K hosted |
| Embedding model runs for indexing | $500-$2K |
| LLM costs for historical summarization | $1K-$3K |
| Design/branding (if not DIY) | $0-$3K |
| Legal (ToS, privacy policy) | $500-$2K |
| **Total realistic out-of-pocket build** | **$5K-$15K** |

Skip historical backfill → cut to $2K-$4K.

### Monthly Operating Cost at V1 Scale

| Item | Monthly |
|---|---|
| Hosting (Vercel/Railway/Fly + Postgres) | $50-$150 |
| Vector database (pgvector self-hosted possible) | $0-$100 |
| Object storage for audio/video (S3 or R2) | $20-$80 |
| Whisper transcription for new meetings (~150-250 hrs/month) | $30-$200 |
| LLM inference (Claude/GPT API) | $50-$300 |
| Email sending (Postmark/Resend) | $20-$50 |
| Search/analytics | $0-$100 |
| Monitoring, error tracking | $25-$50 |
| Background jobs / cron | $20-$50 |
| Misc SaaS (Stripe fees, etc.) | 3% of revenue |
| **Total monthly opex (pre-revenue)** | **$215-$1,080** |

Roughly **~$500/month** at v1, scaling to **~$1,500/month** with growth.

At $300K ARR with 50-80 customers: monthly costs $2K-$4K. Gross margins 85-90%.

### Year-by-Year Picture

**Year 1, solo, aggressive but realistic:**
- Revenue: $30K-$80K (5-15 paying customers)
- Out-of-pocket: $10K-$20K build + $6K-$12K opex
- Time: full-time-ish, 1,500-2,000 hours
- Cash position: roughly break-even, no salary

**Year 2 if working:**
- Revenue: $150K-$300K
- Opex: $25K-$40K
- Founder salary: $80K-$150K possible
- Decision: keep bootstrapping, hire, or raise

**Year 2 if not working:**
- Revenue: stuck at $40K-$80K
- Kill it or pivot at 18-month mark

### What Changes the Answer 3-5x

1. **Land a city as a customer** (Saratoga/Hamlet model — Vancouver or Burnaby pays you to make their meetings accessible). $30K-$100K/year per city, zero churn.
2. **Sell to BC government** (Ministry of Municipal Affairs, BC Assessment, LTSA) as infrastructure.
3. **Crack one big developer** (Wesgroup, Onni, Concord, Polygon, Westbank, Bosa) at $20K-$50K/year. Logo helps next 10 sales.

### Risks That Tank Value

1. **Hamlet expands to Canada** before signed multi-year contracts.
2. **Cities crack down on automated scraping** (unlikely — public data — but municipal ToS varies).

---

## 9. Naming

Initial brainstorm shortlist:

- **Borough** — local + civic, scales nationally, professional
- **Quorum** — moment a meeting becomes official, smart, insider name
- **Gavel** — punchy, memorable, easy icon
- **Civica** — civic + soft, sounds like a real company
- **Cedar / Inlet / Salish** — Pacific Northwest flavour
- **Lumen / Plainspoke / Throughline** — clarity angle
- **Tally / Sift / Brief** — verb-y action names
- **Minute** — meeting minutes + "give me a minute"

### Quorum Conflict

**Quorum (`quorum.us`)** is a major US public-affairs software company. Market leader in legislative tracking and government affairs, AI-powered, used by federal/state agencies, Uber, Walmart, Expedia. They just launched AI agents for government affairs (Quorum Copilot). **Direct adjacent space.** Trademark conflict almost guaranteed. **Cannot use.**

### Substitute Shortlist with Same Vibe

- **Carried** — "the motion is carried." Distinctly Canadian-parliamentary in flavour. **Top pick.**
- **Aye** — punchy one syllable; bare domain almost certainly expensive
- **Motion** — clean, but heavy collision risk (Motion calendar app, Motion Recruitment)
- **Second / Reading / Tabled / Convene / Bench / Chambers** — alternative civic vocabulary

### Working Name: Carried

Tagline draft: *"Carried tracks every motion passed in Metro Vancouver."*

If exact dot-com is taken, use modifier: **GetCarried, CarriedHQ, Carried.app, Carried.co, TryCarried, UseCarried**. (Modern B2B SaaS playbook — Notion was `notion.so`, Linear is `linear.app`, Vercel was `zeit.co`.)

### Pre-Commit Checks

1. WHOIS — `carried.com`, `carried.ca`, `carriedhq.com`, `getcarried.com`, `trycarried.com`
2. Canadian Intellectual Property Office (CIPO) — search "Carried" in classes 9 (software) and 42 (SaaS)
3. USPTO TESS — same search
4. Google `"Carried" software` and `"Carried" civic` for unknown competitors
5. Say it out loud to a developer or planner friend — does it land?

---

## 10. Open Questions / Next Steps

1. **Customer discovery** — actual list of Metro Van developers, lobbyists, advocacy orgs, news outlets to call. Validate willingness to pay *before* writing code.
2. **Verify remaining muni platforms** — direct check of dnv.org, tol.ca, mapleridge.ca, and the four smallest munis (Bowen, Anmore, Lions Bay, Belcarra).
3. **Domain + trademark verification** for Carried.
4. **Positioning copy** — elevator pitch, homepage hero, sample alert email.
5. **First three target customers** — who specifically gets the demo call.
6. **Pricing experiment** — single tier vs. tiered, individual vs. team seats, with/without API access.

---

*Document compiled from research conversation. All figures and estimates are rough planning numbers, not commitments. Pricing comparables drawn from public industry reporting on Cloverleaf AI, Curate, Hamlet, and Aware.*
