import { coverageStats, personas, sampleResults } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="border-b">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1fr_420px] lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium uppercase text-muted-foreground">
              Carried
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Civic monitoring for every Metro Vancouver meeting that matters.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Carried tracks agendas, minutes, transcripts, votes, and
              development signals across municipalities so teams know when a
              project, address, or issue moves.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/dashboard"
                className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Open dashboard
              </a>
              <a
                href="/dashboard/search"
                className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
              >
                Preview search
              </a>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium">Sample alert</p>
                <p className="text-xs text-muted-foreground">
                  Broadway Plan + CD-1
                </p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                Agenda match
              </span>
            </div>
            <div className="space-y-4 pt-4">
              {sampleResults.slice(0, 2).map((result) => (
                <div className="rounded-lg border p-3" key={result.title}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.city}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {result.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {coverageStats.map((stat) => (
            <div
              className="rounded-lg border bg-card p-4 text-card-foreground"
              key={stat.label}
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-4 lg:grid-cols-3">
          {personas.map((persona) => (
            <div
              className="rounded-lg border bg-card p-5 text-card-foreground"
              key={persona.title}
            >
              <persona.icon className="size-5 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">{persona.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {persona.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
