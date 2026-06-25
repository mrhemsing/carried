import { getSearchResults } from "@/lib/data";
import Link from "next/link";

export default async function SearchPage(props: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q ?? "";
  const sampleResults = await getSearchResults(query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Search transcript moments, agendas, minutes, reports, and civic
          records with direct source evidence.
        </p>
      </div>

      <form action="/dashboard/search" className="rounded-lg border bg-card p-4">
        <label className="text-sm font-medium" htmlFor="query">
          Query
        </label>
        <div className="mt-2 flex gap-2">
          <input
            className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-ring/30"
            defaultValue={query}
            id="query"
            name="q"
            placeholder="Search address, topic, project, company, or policy"
          />
          <button
            className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            type="submit"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <p className="text-sm text-muted-foreground">
          {sampleResults.length} searchable record
          {sampleResults.length === 1 ? "" : "s"} found
        </p>
        {query && (
          <p className="text-xs text-muted-foreground">
            Query: <span className="font-medium text-foreground">{query}</span>
          </p>
        )}
      </div>

      <div className="space-y-3">
        {sampleResults.length === 0 && (
          <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            No transcript or source records matched that query.
          </div>
        )}
        {sampleResults.map((result, resultIndex) => (
          <article
            className="rounded-lg border bg-card p-5"
            key={`${result.title}-${resultIndex}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold leading-6">
                  {result.title}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.city} · {result.date} · {result.type}
                  {result.timestamp ? ` · ${result.timestamp}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.href && (
                  <Link
                    className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                    href={result.href}
                  >
                    View meeting
                  </Link>
                )}
                {result.sourceUrl ? (
                  <a
                    className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-secondary"
                    href={result.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {result.type === "Transcript moment"
                      ? "Open video"
                      : "Open source"}
                  </a>
                ) : (
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                    Source linked
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 max-w-4xl space-y-3 text-sm leading-7 text-muted-foreground">
              {(result.bodySections?.length
                ? result.bodySections
                : [result.body]
              ).map((section, index) => (
                <p key={`${result.title}-section-${index}`}>{section}</p>
              ))}
            </div>
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
