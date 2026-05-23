import Link from "next/link";

const municipalities = ["Vancouver", "Surrey", "Burnaby", "Richmond"];
const cadences = ["Immediate", "Agenda only", "Post-meeting", "Daily digest"];
const audiences = [
  "Developer",
  "Planning consultant",
  "Government affairs",
  "Advocacy",
  "Journalist",
  "Resident",
];

export default function NewAlertPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase text-muted-foreground">
          Saved alert
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create monitoring rule
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Static workflow for defining what Carried should watch across agendas,
          minutes, transcripts, and development records.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <form className="space-y-5 rounded-lg border bg-card p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Alert name
              <input
                className="h-10 rounded-lg border bg-background px-3 text-sm font-normal outline-none focus:ring-3 focus:ring-ring/30"
                defaultValue="Broadway Plan + CD-1"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Audience
              <select
                className="h-10 rounded-lg border bg-background px-3 text-sm font-normal outline-none focus:ring-3 focus:ring-ring/30"
                defaultValue="Planning consultant"
              >
                {audiences.map((audience) => (
                  <option key={audience}>{audience}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Search query
            <textarea
              className="min-h-28 rounded-lg border bg-background px-3 py-2 text-sm font-normal leading-6 outline-none focus:ring-3 focus:ring-ring/30"
              defaultValue="Broadway Plan OR CD-1 OR rental replacement"
            />
          </label>

          <div>
            <p className="text-sm font-medium">Municipalities</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {municipalities.map((municipality) => (
                <label
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                  key={municipality}
                >
                  <input
                    defaultChecked={municipality === "Vancouver"}
                    type="checkbox"
                  />
                  {municipality}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Cadence</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {cadences.map((cadence) => (
                <label
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                  key={cadence}
                >
                  <input
                    defaultChecked={cadence === "Agenda only"}
                    name="cadence"
                    type="radio"
                  />
                  {cadence}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t pt-5">
            <button
              className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground opacity-70"
              type="button"
            >
              Preview matches
            </button>
            <Link
              className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
              href="/dashboard/alerts"
            >
              Back to alerts
            </Link>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-base font-semibold">Evidence preview</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Carried should show source-linked matches before a user saves an
              alert. This prevents noisy rules and makes the notification logic
              auditable.
            </p>
          </section>
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-base font-semibold">Next implementation</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Persist saved searches.</li>
              <li>Generate alert previews from indexed records.</li>
              <li>Store evidence links with each notification.</li>
              <li>Add email delivery after preview quality is acceptable.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
