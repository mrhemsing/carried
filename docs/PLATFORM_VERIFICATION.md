# Carried Platform Verification

Last verified: 2026-05-23

This file records the source URLs Carried should target for the first ingestion work. It narrows the business-plan assumptions into connector work orders.

## Connector Priority

1. **eScribe connector:** highest leverage. One parser should cover Burnaby, Delta, Maple Ridge, New Westminster, Port Coquitlam, Port Moody, Langley City, White Rock, and Pitt Meadows.
2. **Vancouver connector:** high-value custom source with council pages, PDFs, videos, and open-data voting records.
3. **Surrey connector:** high-value custom source with live/past recordings plus agenda and minutes paths.
4. **Defer/non-v1:** Township of Langley is verified as public calendar + YouTube, not a visible `pub-tol.escribemeetings.com` eScribe tenant. Coquitlam/Richmond are useful next connectors but outside the first eScribe/Vancouver/Surrey build slice.

## V1 Source Map

| Jurisdiction | Connector | Verified URL | Status | Notes |
| --- | --- | --- | --- | --- |
| Vancouver | Custom | https://council.vancouver.ca | Verified via indexed agenda pages | Root blocks basic script fetches with 403, but meeting pages are indexed and structured by date, for example `/20260120/regu20260120ag.htm`. Needs browser-like fetch or direct date URL discovery. |
| Vancouver Open Data | Socrata/API | https://opendata.vancouver.ca | To wire after council pages | Use for voting records and related development datasets. |
| Surrey | Custom | https://www.surrey.ca/city-government/council-meetings/council-meeting-livestream | Verified HTTP 200 | Page links live stream, past recordings, agendas, and meeting archive paths. |
| Burnaby | eScribe | https://pub-burnaby.escribemeetings.com/MeetingsCalendarView.aspx | Verified HTTP 200 | First eScribe spike candidate. |
| Delta | eScribe | https://pub-delta.escribemeetings.com/MeetingsCalendarView.aspx | Verified HTTP 200 | Shared eScribe parser target. |
| Maple Ridge | eScribe | https://pub-mapleridge.escribemeetings.com/MeetingsCalendarView.aspx | Verified HTTP 200 | Business plan marked partial; now confirmed eScribe. |
| New Westminster | eScribe | https://pub-newwestcity.escribemeetings.com/MeetingsCalendarView.aspx | Verified HTTP 200 | Shared eScribe parser target. |
| Port Coquitlam | eScribe | https://pub-portcoquitlam.escribemeetings.com/MeetingsCalendarView.aspx | Verified HTTP 200 | Shared eScribe parser target. |
| Port Moody | eScribe | https://pub-portmoody.escribemeetings.com/MeetingsCalendarView.aspx | Verified HTTP 200 | Shared eScribe parser target. |
| Langley City | eScribe | https://pub-langleycity.escribemeetings.com/MeetingsCalendarView.aspx | Verified HTTP 200 | Shared eScribe parser target. |
| White Rock | eScribe | https://pub-whiterockcity.escribemeetings.com/MeetingsCalendarView.aspx | Verified HTTP 200 | Shared eScribe parser target. |
| Pitt Meadows | eScribe | https://pub-pittmeadows.escribemeetings.com/MeetingsCalendarView.aspx | Verified HTTP 200 | Shared eScribe parser target. |

## Phase 2 / Custom Source Map

| Jurisdiction | Connector | Verified URL | Status | Notes |
| --- | --- | --- | --- | --- |
| Township of Langley | Custom calendar + YouTube | https://www.tol.ca/en/the-township/council-meetings.aspx | Verified official page | Official page links `calendar.tol.ca` for council agenda/minutes and YouTube for live/past video. `pub-tol.escribemeetings.com` does not resolve. |
| Richmond | Custom/Granicus + city pages | https://www.richmond.ca/city-hall/city-council/councilprocess/process.htm | Verified HTTP 200 | Process page plus separate video page at https://citycouncil.richmond.ca/meetings/watch-video.htm. |
| Coquitlam | CivicEngage + Granicus | https://www.coquitlam.ca/AgendaCenter | Verified HTTP 200 | Agenda Center is public; Granicus publisher verified at https://coquitlam.ca.granicus.com/ViewPublisher.php?view_id=2. |

## eScribe Spike Work Order

Start with Burnaby and design the connector so the tenant slug is configuration:

```ts
type EscribeTenant = {
  jurisdictionSlug: string;
  baseUrl: string;
};
```

Minimum successful spike:

- Fetch the tenant calendar page.
- Discover at least one meeting URL from the calendar HTML or the page's backing request.
- Fetch a meeting page.
- Extract meeting title, date/time, body/committee label, agenda URL, minutes URL if present, and attachments.
- Normalize into the existing `jurisdictions`, `governing_bodies`, `meetings`, `documents`, and `agenda_items` model.
- Save a fixture for the source page so parser changes are testable without hitting the city site every run.

## Immediate Decision

Treat **Maple Ridge as included in the first eScribe connector batch** and **Township of Langley as deferred custom work**. This keeps the first ingestion milestone focused on one repeatable platform instead of mixing in a custom calendar before the shared connector is proven.
