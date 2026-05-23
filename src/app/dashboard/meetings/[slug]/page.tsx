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
      </div>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-base font-semibold">Summary</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {meeting.summary}
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">Agenda items</h2>
          <div className="mt-4 space-y-3">
            {meeting.agendaItems.map((item, index) => (
              <div className="rounded-lg border p-3" key={item}>
                <p className="text-xs text-muted-foreground">Item {index + 1}</p>
                <p className="mt-1 text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">Related search evidence</h2>
          <div className="mt-4 space-y-3">
            {relatedResults.map((result) => (
              <article className="rounded-lg border p-3" key={result.title}>
                <p className="text-sm font-medium">{result.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.type}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {result.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
