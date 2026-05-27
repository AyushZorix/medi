import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, Play, RefreshCw } from "lucide-react";

import { AppPage } from "@/components/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { PipelineFlow } from "@/components/PipelineFlow";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/ScoreBar";
import { Separator } from "@/components/ui/separator";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";

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
    <AppPage className="space-y-8">
      <PageHeader
        portal="attorney"
        eyebrow="Processing case"
        title="Review in progress"
        description="Rohan Patel · O-1 Visa · Case #VIQ-2847"
        actions={
          <>
            <Button variant="glass" size="sm">
              <RefreshCw className="size-3.5" /> Restart
            </Button>
            <Button variant="gradient" size="sm">
              <Play className="size-3.5" /> Resume
            </Button>
          </>
        }
      />

      <GlassCard intensity="strong" className="p-8 md:p-12">
        <PipelineFlow />
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-normal">
              What we found
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4 pt-0">
            {reasoning.map((r) => (
              <div key={r.title} className="flex gap-3 rounded-xl border border-border/40 bg-muted/30 p-4">
                <r.icon className={`size-5 shrink-0 mt-0.5 ${r.color}`} />
                <div>
                  <div className="text-sm font-medium">{r.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-normal">
              Confidence score
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3 pt-0">
            {[
              { l: "Identity", v: 98 },
              { l: "Financial", v: 92 },
              { l: "Academic", v: 89 },
              { l: "Intent", v: 74 },
              { l: "History", v: 95 },
            ].map((c) => (
              <div key={c.l}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{c.l}</span>
                  <span className="tabular-nums text-muted-foreground">{c.v}%</span>
                </div>
                <ScoreBar value={c.v} />
              </div>
            ))}
            <Separator className="my-2" />
            <div className="text-xs text-muted-foreground">Overall score</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-gradient">89.6%</div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </AppPage>
  );
}
