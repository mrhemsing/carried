import { getMunicipalities } from "@/lib/data";

export default async function JurisdictionsPage() {
  const municipalities = await getMunicipalities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Jurisdictions
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          V1 coverage starts with eScribe municipalities plus custom Vancouver
          and Surrey ingestion.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {municipalities.map((municipality) => (
          <article
            className="rounded-lg border bg-card p-5"
            key={municipality.name}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  {municipality.name}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {municipality.population} residents
                </p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                {municipality.priority}
              </span>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Platform</dt>
                <dd className="mt-1 font-medium">{municipality.platform}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1 font-medium">{municipality.status}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
