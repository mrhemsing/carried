import { alerts } from "@/lib/mock-data";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Alerts</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Saved monitoring rules for topics, projects, addresses, and agenda
          language. Email delivery comes after persistence is wired.
        </p>
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
