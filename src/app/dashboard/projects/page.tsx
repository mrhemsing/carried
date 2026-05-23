import { getProjects } from "@/lib/data";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Project-first tracking for rezonings, development applications, and
          named civic initiatives across multiple municipalities.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Jurisdiction</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Next action</th>
              <th className="px-4 py-3 font-medium">Signal</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr className="border-b last:border-0" key={project.name}>
                <td className="px-4 py-3 font-medium">{project.name}</td>
                <td className="px-4 py-3">{project.jurisdiction}</td>
                <td className="px-4 py-3">{project.stage}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {project.nextAction}
                </td>
                <td className="px-4 py-3">{project.signal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
