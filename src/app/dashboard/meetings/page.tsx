import Link from "next/link";

import { getMeetings } from "@/lib/data";

export default async function MeetingsPage() {
  const meetings = await getMeetings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Meetings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Meeting-level view for agendas, minutes, source platforms, summaries,
          and agenda item evidence.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {meetings.map((meeting) => (
          <Link
            className="rounded-lg border bg-card p-5 text-card-foreground hover:bg-muted/40"
            href={`/dashboard/meetings/${meeting.slug}`}
            key={meeting.slug}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase text-muted-foreground">
                  {meeting.jurisdiction}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{meeting.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {meeting.body} · {meeting.date}
                </p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                {meeting.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {meeting.summary}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
