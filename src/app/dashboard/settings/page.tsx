export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Placeholder for auth, notification channels, organization settings,
          and billing decisions.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Auth", "Choose Clerk, Auth.js, or Supabase Auth."],
          ["Delivery", "Start with email, add Slack after alert evidence works."],
          ["Billing", "Model individual, team, and enterprise tiers."],
        ].map(([title, body]) => (
          <div className="rounded-lg border bg-card p-5" key={title}>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
