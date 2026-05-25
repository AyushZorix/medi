import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Clock, ShieldCheck, Brain, ArrowUpRight, Activity } from "lucide-react";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — VisaIQ" }] }),
  component: Dashboard,
});

const metrics = [
  { label: "Total applications", value: "2,847", delta: "+12.4%", icon: TrendingUp, accent: "text-indigo" },
  { label: "Approval rate", value: "87.3%", delta: "+2.1%", icon: ShieldCheck, accent: "text-success" },
  { label: "Avg processing", value: "11.6s", delta: "-3.2s", icon: Clock, accent: "text-teal" },
  { label: "AI confidence", value: "94.2", delta: "+0.8", icon: Brain, accent: "text-violet" },
];

const feed = [
  { name: "Amelia Chen", visa: "F-1", status: "approved" as const, time: "2m ago", score: 96 },
  { name: "Rohan Patel", visa: "O-1", status: "processing" as const, time: "3m ago", score: 88 },
  { name: "Sofia Marquez", visa: "B-2", status: "needs_info" as const, time: "8m ago", score: 71 },
  { name: "Daniel Okafor", visa: "F-1", status: "approved" as const, time: "12m ago", score: 92 },
  { name: "Yuki Tanaka", visa: "O-1", status: "rejected" as const, time: "18m ago", score: 42 },
  { name: "Liam O'Connor", visa: "B-1", status: "approved" as const, time: "24m ago", score: 89 },
];

function Dashboard() {
  return (
    <div className="space-y-8 animate-[fade-up_0.6s_ease-out]">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Command center</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Good morning, Jordan</h1>
          <p className="text-muted-foreground mt-1 text-sm">4 applications need your review today.</p>
        </div>
        <Link to="/app/applications" className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm text-primary-foreground shadow-glow">
          New application <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl glass p-5 hover:bg-white/[0.05] transition group">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <m.icon className={`size-4 ${m.accent}`} />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{m.value}</div>
            <div className={`mt-2 text-xs ${m.delta.startsWith("+") || m.delta.startsWith("-3") ? "text-success" : "text-muted-foreground"}`}>
              {m.delta} this week
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Activity feed */}
        <div className="lg:col-span-2 rounded-2xl glass p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-medium">Live activity</div>
              <div className="text-xs text-muted-foreground">Real-time application stream</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Live
            </div>
          </div>
          <div className="divide-y divide-border/40">
            {feed.map((f) => (
              <Link
                key={f.name}
                to="/app/applications/$id"
                params={{ id: f.name.toLowerCase().replace(/\s|'/g, "-") }}
                className="flex items-center gap-4 py-3 hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition"
              >
                <div className="size-9 rounded-full bg-gradient-primary grid place-items-center text-xs font-medium">
                  {f.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground">Updated {f.time}</div>
                </div>
                <VisaBadge type={f.visa} />
                <div className="hidden sm:block w-24">
                  <div className="text-[10px] text-muted-foreground mb-1">AI {f.score}%</div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-aurora" style={{ width: `${f.score}%` }} />
                  </div>
                </div>
                <StatusBadge status={f.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* AI Processing status */}
        <div className="rounded-2xl glass p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="font-medium">AI pipeline</div>
            <Activity className="size-4 text-primary" />
          </div>
          <div className="space-y-4">
            {[
              { label: "OCR extraction", val: 100, status: "Complete" },
              { label: "Completeness check", val: 100, status: "Complete" },
              { label: "Consistency analysis", val: 72, status: "Running…" },
              { label: "Rule validation", val: 0, status: "Queued" },
              { label: "Decision synthesis", val: 0, status: "Queued" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-foreground">{s.label}</span>
                  <span className="text-muted-foreground">{s.status}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${s.val === 100 ? "bg-success" : s.val > 0 ? "bg-gradient-aurora" : "bg-muted"}`}
                    style={{ width: `${s.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-border/40">
            <div className="text-xs text-muted-foreground mb-2">Current confidence</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-semibold tracking-tight text-gradient">88.4%</div>
              <div className="text-xs text-muted-foreground">↑ 4.2 vs avg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
