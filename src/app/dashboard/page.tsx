import Link from "next/link";

import { MetricCard } from "@/components/metric-card";
import {
  getAlerts,
  getCoverageStats,
  getDashboardCards,
  getProjects,
} from "@/lib/data";

export default async function DashboardPage() {
  const [alerts, coverageStats, dashboardCards, projects] = await Promise.all([
    getAlerts(),
    getCoverageStats(),
    getDashboardCards(),
    getProjects(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase text-muted-foreground">
          Operator view
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Metro Vancouver monitoring dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Static demo surface for the first Carried workflow: search civic
          records, preview alerts, track projects, and review v1 coverage.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {coverageStats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <Link
            className="rounded-lg border bg-card p-5 text-card-foreground hover:bg-muted/40"
            href={card.href}
            key={card.href}
          >
            <card.icon className="size-5 text-muted-foreground" />
            <h2 className="mt-4 text-base font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">Priority alerts</h2>
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <div className="rounded-lg border p-3" key={alert.name}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{alert.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {alert.audience} · {alert.cadence}
                    </p>
                  </div>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">Tracked projects</h2>
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <div className="rounded-lg border p-3" key={project.name}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.jurisdiction} · {project.stage}
                    </p>
                  </div>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                    {project.signal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
