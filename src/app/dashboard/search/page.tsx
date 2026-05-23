import { getSearchResults } from "@/lib/data";

export default async function SearchPage() {
  const sampleResults = await getSearchResults();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Mock full-text search across agendas, minutes, transcripts, and
          development-related civic records.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <label className="text-sm font-medium" htmlFor="query">
          Query
        </label>
        <input
          className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-ring/30"
          defaultValue="Broadway Plan rezoning"
          id="query"
        />
      </div>

      <div className="space-y-3">
        {sampleResults.map((result) => (
          <article className="rounded-lg border bg-card p-5" key={result.title}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{result.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.city} · {result.date} · {result.type}
                </p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                Source linked
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {result.body}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.matches.map((match) => (
                <span
                  className="rounded-md border px-2 py-1 text-xs text-muted-foreground"
                  key={match}
                >
                  {match}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
