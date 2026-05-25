import { createFileRoute } from "@tanstack/react-router";
import { PipelineFlow } from "@/components/PipelineFlow";
import { CheckCircle2, AlertTriangle, Play, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/app/pipeline")({
  head: () => ({ meta: [{ title: "AI Pipeline — VisaIQ" }] }),
  component: Pipeline,
});

const reasoning = [
  { icon: CheckCircle2, color: "text-success", title: "Passport identity verified", body: "Name, DOB, and document number match across I-20, bank statement, and SEVIS receipt." },
  { icon: CheckCircle2, color: "text-success", title: "Financial threshold satisfied", body: "Liquid funds of $54,820 exceed required $48,500 for declared institution." },
  { icon: AlertTriangle, color: "text-warning", title: "Address inconsistency", body: "Visa form lists Mumbai address; bank statement shows Pune. Auto-flag for clarification." },
];

function Pipeline() {
  return (
    <div className="space-y-8 animate-[fade-up_0.6s_ease-out]">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Live observability</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">AI Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Case #VIQ-2847 · Rohan Patel · O-1 Extraordinary Ability</p>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-lg glass hover:bg-white/[0.06] text-sm flex items-center gap-1.5">
            <RefreshCw className="size-3.5" /> Re-run
          </button>
          <button className="h-9 px-3 rounded-lg bg-gradient-primary text-primary-foreground text-sm flex items-center gap-1.5 shadow-glow">
            <Play className="size-3.5" /> Continue
          </button>
        </div>
      </div>

      <div className="rounded-3xl glass-strong p-8 md:p-12">
        <PipelineFlow />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl glass p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-4">Reasoning trace</div>
          <div className="space-y-4">
            {reasoning.map((r) => (
              <div key={r.title} className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
                <r.icon className={`size-5 shrink-0 mt-0.5 ${r.color}`} />
                <div>
                  <div className="font-medium text-sm">{r.title}</div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-4">Confidence breakdown</div>
          <div className="space-y-3">
            {[
              { l: "Identity", v: 98 },
              { l: "Financial", v: 92 },
              { l: "Academic", v: 89 },
              { l: "Intent", v: 74 },
              { l: "History", v: 95 },
            ].map((c) => (
              <div key={c.l}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{c.l}</span>
                  <span className="text-muted-foreground tabular-nums">{c.v}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-aurora" style={{ width: `${c.v}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-border/40">
            <div className="text-xs text-muted-foreground">Composite</div>
            <div className="text-3xl font-semibold tracking-tight text-gradient mt-1">89.6%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
