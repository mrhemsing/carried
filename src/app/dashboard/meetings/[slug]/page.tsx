import Link from "next/link";
import { notFound } from "next/navigation";

import { getMeeting, getSearchResults } from "@/lib/data";

export default async function MeetingPage(props: PageProps<"/dashboard/meetings/[slug]">) {
  const { slug } = await props.params;
  const [meeting, results] = await Promise.all([
    getMeeting(slug),
    getSearchResults(),
  ]);

  if (!meeting) {
    notFound();
  }

  const relatedResults = results.filter(
    (result) => result.city === meeting.jurisdiction,
  );
  const agendaItemDetails =
    meeting.agendaItemDetails ??
    meeting.agendaItems.map((title) => ({ body: null, bodySections: [], title }));
  const readableItemCount =
    meeting.readableItemCount ??
    agendaItemDetails.filter((item) => item.bodySections.length > 0).length;
  const searchQuery = encodeURIComponent(
    `${meeting.jurisdiction} ${meeting.title}`,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href="/dashboard/meetings"
        >
          Back to meetings
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase text-muted-foreground">
              {meeting.jurisdiction} · {meeting.body}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {meeting.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {meeting.date} · {meeting.source}
            </p>
          </div>
          <span className="rounded-md bg-secondary px-2 py-1 text-sm">
            {meeting.status}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <Link
            className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground"
            href={`/dashboard/search?q=${searchQuery}`}
          >
            Search this meeting
          </Link>
          {meeting.sourceUrl && (
            <a
              className="rounded-md border px-3 py-2 font-medium hover:bg-secondary"
              href={meeting.sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open source
            </a>
          )}
          <span className="rounded-md border px-3 py-2 text-muted-foreground">
            {readableItemCount} readable items
          </span>
          <span className="rounded-md border px-3 py-2 text-muted-foreground">
            {meeting.sourceDocumentCount ?? meeting.sourceDocuments?.length ?? 0} source docs
          </span>
          <span className="rounded-md border px-3 py-2 text-muted-foreground">
            {meeting.mediaAssetCount ?? (meeting.videoUrl ? 1 : 0)} media assets
          </span>
          <span className="rounded-md border px-3 py-2 text-muted-foreground">
            {meeting.transcriptSegmentCount ?? 0} transcript moments
          </span>
        </div>
      </div>

      <section className="border-y py-5">
        <h2 className="text-base font-semibold">Summary</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {meeting.summary}
        </p>
      </section>

      {(meeting.sourceDocuments?.length || meeting.videoUrl || meeting.sourceUrl) && (
        <section className="py-2">
          <h2 className="text-base font-semibold">Source material</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {meeting.sourceUrl && (
              <a
                className="rounded-md border px-3 py-2 text-sm hover:bg-secondary"
                href={meeting.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Source meeting
              </a>
            )}
            {meeting.videoUrl && (
              <a
                className="rounded-md border px-3 py-2 text-sm hover:bg-secondary"
                href={meeting.videoUrl}
                rel="noreferrer"
                target="_blank"
              >
                Video
              </a>
            )}
            {meeting.sourceDocuments?.map((document) => (
              <a
                className="rounded-md border px-3 py-2 text-sm hover:bg-secondary"
                href={document.sourceUrl}
                key={`${document.type}-${document.sourceUrl}`}
                rel="noreferrer"
                target="_blank"
              >
                {document.title}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="border-y py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Transcript moments</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Searchable video transcript segments will appear here with
              timestamps once this meeting has been captured and transcribed.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {meeting.transcriptSegmentCount ?? 0} moments indexed
          </span>
        </div>
        {meeting.videoUrl ? (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <a
              className="rounded-md border px-3 py-2 font-medium hover:bg-secondary"
              href={meeting.videoUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open meeting video
            </a>
            <span className="rounded-md bg-secondary px-3 py-2 text-muted-foreground">
              Awaiting transcription
            </span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No meeting video has been discovered for this record yet.
          </p>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Meeting notes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Agenda items with substantive extracted text are separated into
              readable notes and tied back to source material.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {readableItemCount} of {agendaItemDetails.length} items readable
          </span>
        </div>
        <div className="mt-4 space-y-4">
          {agendaItemDetails.map((item, index) => (
            <article
              className="rounded-lg border bg-card p-5"
              key={`${item.title}-${index}`}
            >
              <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Item {index + 1}
                </p>
                <h3 className="min-w-0 flex-1 text-base font-semibold leading-6">
                  {item.title}
                </h3>
              </div>
              {item.bodySections.length > 0 ? (
                <div className="mt-4 max-w-4xl space-y-3 text-sm leading-7 text-muted-foreground">
                  {item.bodySections.map((section, sectionIndex) => (
                    <p key={`${item.title}-section-${sectionIndex}`}>
                      {section}
                    </p>
                  ))}
                </div>
              ) : item.body ? (
                <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground">
                  {item.body}
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No substantive extracted text stored for this item yet.
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      {relatedResults.length > 0 && (
        <section className="border-t pt-5">
          <h2 className="text-base font-semibold">Related search evidence</h2>
          <div className="mt-4 space-y-3">
            {relatedResults.slice(0, 8).map((result) => (
              <article className="rounded-lg border bg-card p-4" key={result.title}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium leading-6">
                      {result.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.type}
                    </p>
                  </div>
                  {result.sourceUrl && (
                    <a
                      className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-secondary"
                      href={result.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open source
                    </a>
                  )}
                </div>
                <div className="mt-3 max-w-4xl space-y-2 text-sm leading-7 text-muted-foreground">
                  {(result.bodySections?.length
                    ? result.bodySections.slice(0, 2)
                    : [result.body]
                  ).map((section, sectionIndex) => (
                    <p key={`${result.title}-related-${sectionIndex}`}>
                      {section}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
