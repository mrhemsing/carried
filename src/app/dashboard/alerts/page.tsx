import Link from "next/link";

import { getAlerts } from "@/lib/data";

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Alerts</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Saved monitoring rules for topics, projects, addresses, and agenda
              language. Email delivery comes after persistence is wired.
            </p>
          </div>
          <Link
            className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            href="/dashboard/alerts/new"
          >
            New alert
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {alerts.map((alert) => (
          <article className="rounded-lg border bg-card p-5" key={alert.name}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{alert.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {alert.audience}
                </p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                {alert.cadence}
              </span>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Last match</dt>
                <dd className="mt-1 font-medium">{alert.lastMatch}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1 font-medium">{alert.status}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
