import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Workflow,
  FileText,
  Gavel,
  Bell,
  ShieldCheck,
  Sparkles,
  Search,
  Settings,
  User,
} from "lucide-react";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/applications", label: "Applications", icon: FolderKanban },
  { to: "/app/pipeline", label: "AI Pipeline", icon: Workflow },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/decisions", label: "Decisions", icon: Gavel },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/admin", label: "Attorney Panel", icon: ShieldCheck },
];

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-5 h-16 flex items-center gap-2.5 border-b border-sidebar-border">
          <div className="size-7 rounded-lg bg-gradient-aurora grid place-items-center">
            <Sparkles className="size-3.5 text-primary-foreground" />
          </div>
          <Link to="/" className="font-semibold tracking-tight">VisaIQ</Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inset"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="rounded-xl glass p-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-gradient-primary grid place-items-center text-xs font-medium">JA</div>
              <div className="text-xs leading-tight">
                <div className="font-medium text-foreground">Jordan Avery</div>
                <div className="text-muted-foreground">Reviewer</div>
              </div>
              <Settings className="size-3.5 text-muted-foreground ml-auto" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border/60 flex items-center gap-4 px-6 sticky top-0 z-20 backdrop-blur-xl bg-background/70">
          <div className="flex-1 max-w-md relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search applicants, cases, rules…"
              className="w-full h-9 rounded-lg bg-muted/40 border border-border/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="size-9 rounded-lg glass grid place-items-center hover:bg-white/[0.06] transition relative">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-warning" />
            </button>
            <button className="size-9 rounded-lg glass grid place-items-center hover:bg-white/[0.06] transition">
              <User className="size-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
