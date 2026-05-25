import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/app/applications")({
  head: () => ({ meta: [{ title: "Applications — VisaIQ" }] }),
  component: Applications,
});

const rows = [
  { id: "amelia-chen", name: "Amelia Chen", visa: "F-1", status: "approved", score: 96, updated: "2m ago" },
  { id: "rohan-patel", name: "Rohan Patel", visa: "O-1", status: "processing", score: 88, updated: "3m ago" },
  { id: "sofia-marquez", name: "Sofia Marquez", visa: "B-2", status: "needs_info", score: 71, updated: "8m ago" },
  { id: "daniel-okafor", name: "Daniel Okafor", visa: "F-1", status: "approved", score: 92, updated: "12m ago" },
  { id: "yuki-tanaka", name: "Yuki Tanaka", visa: "O-1", status: "rejected", score: 42, updated: "18m ago" },
  { id: "liam-oconnor", name: "Liam O'Connor", visa: "B-1", status: "approved", score: 89, updated: "24m ago" },
  { id: "isabela-rocha", name: "Isabela Rocha", visa: "F-1", status: "processing", score: 81, updated: "31m ago" },
  { id: "noor-al-sayed", name: "Noor Al-Sayed", visa: "O-1", status: "needs_info", score: 67, updated: "1h ago" },
  { id: "wei-zhang", name: "Wei Zhang", visa: "B-2", status: "approved", score: 94, updated: "1h ago" },
] as const;

function Applications() {
  return (
    <div className="space-y-6 animate-[fade-up_0.6s_ease-out]">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Caseload</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Applications</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name, case ID, or country…"
            className="w-full h-10 rounded-lg bg-muted/40 border border-border/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="flex gap-2">
          {["All", "F-1", "O-1", "B-1", "B-2"].map((t, i) => (
            <button
              key={t}
              className={`h-10 px-3 rounded-lg text-sm transition ${
                i === 0 ? "bg-primary/15 text-primary border border-primary/30" : "glass hover:bg-white/[0.06]"
              }`}
            >
              {t}
            </button>
          ))}
          <button className="h-10 px-3 rounded-lg glass hover:bg-white/[0.06] transition flex items-center gap-1.5 text-sm">
            <SlidersHorizontal className="size-3.5" /> Filters
          </button>
        </div>
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
          <div className="col-span-4">Applicant</div>
          <div className="col-span-2">Visa</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">AI score</div>
          <div className="col-span-2 text-right">Updated</div>
        </div>
        {rows.map((r) => (
          <Link
            key={r.id}
            to="/app/applications/$id"
            params={{ id: r.id }}
            className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center text-sm border-b border-border/30 hover:bg-white/[0.03] transition"
          >
            <div className="col-span-4 flex items-center gap-3">
              <div className="size-8 rounded-full bg-gradient-primary grid place-items-center text-[11px] font-medium">
                {r.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="font-medium truncate">{r.name}</div>
            </div>
            <div className="col-span-2"><VisaBadge type={r.visa} /></div>
            <div className="col-span-2"><StatusBadge status={r.status} /></div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-aurora" style={{ width: `${r.score}%` }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{r.score}%</span>
              </div>
            </div>
            <div className="col-span-2 text-right text-xs text-muted-foreground">{r.updated}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
