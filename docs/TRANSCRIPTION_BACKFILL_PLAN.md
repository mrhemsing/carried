# Transcription And Backfill Plan

Decision date: 2026-05-23

## Decision

Carried will **not** start with a full historical transcription archive. The first production path is:

1. Forward capture for new meetings.
2. A 12-month high-value backfill for Vancouver, Surrey, Burnaby, and Richmond.
3. A targeted 5-year archive only for meetings with strong development, housing, transportation, OCP, CD-1, rezoning, public-hearing, or major-infrastructure signals.
4. Full 5-year/full-region transcription only after customer demand justifies the spend.

## Why

The live eScribe check for 2021-05-23 through 2026-05-23 returned:

| Source group | Meeting records | Meeting records with video |
| --- | ---: | ---: |
| 9 verified eScribe municipalities | 4,629 | 2,126 |

Those 2,126 eScribe video meetings alone likely represent:

| Assumption | Estimated hours |
| --- | ---: |
| Conservative, 1.5h average | ~3,200 |
| Realistic, 2h average | ~4,250 |
| Heavy, 2.5h average | ~5,300 |

Adding Vancouver and Surrey likely puts a 5-year V1 archive around **4,500-8,000 transcription hours**. Expanding to regional bodies, school boards, police boards, and additional custom municipalities could push the broader archive into **10,000-20,000+ hours**.

That is technically feasible, but it is too much upfront spend before proving which transcript surface actually sells.

## Cost Envelope

10,000 hours is 600,000 minutes.

| Pipeline | Rough cost |
| --- | ---: |
| Low hosted transcription estimate at ~$0.006/min | ~$3,600 |
| Realtime Whisper-style pricing at ~$0.017/min | ~$10,200 |
| Lean hosted all-in pipeline | ~$5K-$12K |
| Higher-quality hosted all-in pipeline | ~$12K-$25K |
| Self-hosted Whisper/faster-whisper GPU compute | ~$1K-$6K plus more ops work |

All-in pipeline costs include transcription plus audio extraction, chunking, retries, storage, embeddings, summaries, and entity extraction.

## Recommended First Backfill

Start with **12 months** of high-value meetings:

- Vancouver Council, Standing Committee, Public Hearing, and development-heavy meetings.
- Surrey Council, Public Hearing, and development-heavy meetings.
- Burnaby Council, Planning and Development Committee, Transportation Committee, and public hearing style meetings.
- Richmond Council and planning/development-heavy meetings.

Expected size: **~800-1,800 hours**.

Estimated spend:

| Cost layer | Estimated spend |
| --- | ---: |
| Low transcription-only | ~$288-$648 |
| Realtime Whisper-style transcription-only | ~$816-$1,836 |
| Practical all-in first backfill | ~$1K-$4K |

## Pipeline Steps

1. Discover meeting videos from each source connector.
2. Download or capture the video/audio.
3. Store source media or extracted audio in object storage.
4. Extract compressed audio with `ffmpeg`.
5. Split audio into transcription-safe chunks.
6. Transcribe chunks.
7. Reassemble transcript segments with timestamps.
8. Store transcript segments in Postgres.
9. Extract addresses, parcel IDs, projects, organizations, people, and topics.
10. Embed transcript chunks for semantic search.
11. Generate item-level and meeting-level summaries.
12. Generate alert evidence and preserve source references.

## Product Gate

Do not run full historical backfill until at least one of these is true:

- Paying customer asks for historical transcript search.
- Demo users repeatedly search for older meetings that are missing.
- A city/customer contract requires historical meeting accessibility.
- The forward-capture + 12-month backfill data proves transcript search is a sales driver.
