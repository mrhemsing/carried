import Link from "next/link";
import { notFound } from "next/navigation";

import { getProject, getSearchResults } from "@/lib/data";

export default async function ProjectPage(props: PageProps<"/dashboard/projects/[slug]">) {
  const { slug } = await props.params;
  const [project, results] = await Promise.all([
    getProject(slug),
    getSearchResults(),
  ]);

  if (!project) {
    notFound();
  }

  const relatedResults = results.filter(
    (result) =>
      result.city === project.jurisdiction ||
      result.matches.some((match) =>
        project.summary.toLowerCase().includes(match.toLowerCase()),
      ),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href="/dashboard/projects"
        >
          Back to projects
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase text-muted-foreground">
              {project.jurisdiction} · {project.address}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {project.summary}
            </p>
          </div>
          <span className="rounded-md bg-secondary px-2 py-1 text-sm">
            {project.signal} signal
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Stage", project.stage],
          ["Next action", project.nextAction],
          ["Jurisdiction", project.jurisdiction],
        ].map(([label, value]) => (
          <div className="rounded-lg border bg-card p-4" key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-sm font-medium">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">Timeline</h2>
          <div className="mt-4 space-y-3">
            {project.timeline.map((item, index) => (
              <div className="flex gap-3" key={item}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-6 text-muted-foreground">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">Related evidence</h2>
          <div className="mt-4 space-y-3">
            {relatedResults.map((result) => (
              <article className="rounded-lg border p-3" key={result.title}>
                <p className="text-sm font-medium">{result.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.city} · {result.date}
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
