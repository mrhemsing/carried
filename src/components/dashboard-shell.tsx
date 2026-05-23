import Link from "next/link";
import { Settings } from "lucide-react";

import { navItems } from "@/lib/mock-data";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              C
            </span>
            <span className="text-sm font-semibold">Carried</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex size-8 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
