import { CheckCircle2, AlertTriangle, XCircle, Brain, Scale, FileSearch } from "lucide-react";

import type { Application } from "@/lib/applications";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";

type PipelineResultsProps = {
  application: Application;
};

export function PipelineResults({ application }: PipelineResultsProps) {
  const { pipeline, humanReview } = application;
  if (pipeline.status === "idle") return null;

  const decider = pipeline.decider;
  const rec = decider?.recommendation;

  return (
    <div className="space-y-4">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-4 text-primary" /> AI agent pipeline
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4 pt-0">
          {pipeline.validator && (
            <AgentBlock
              icon={FileSearch}
              title="Validator agent"
              score={pipeline.validator.score}
              summary={pipeline.validator.summary}
              items={pipeline.validator.findings?.map((f) => f.message) ?? []}
            />
          )}
          {pipeline.consistency && (
            <AgentBlock
              icon={Scale}
              title="Consistency agent"
              score={pipeline.consistency.score}
              summary={pipeline.consistency.summary}
              items={pipeline.consistency.issues?.map((i) => i.message) ?? []}
            />
          )}
          {decider && (
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                {rec === "approve" ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : rec === "deny" ? (
                  <XCircle className="size-4 text-destructive" />
                ) : (
                  <AlertTriangle className="size-4 text-warning" />
                )}
                Decider agent — recommends {rec?.replace("_", " ")}
                {decider.confidence != null && (
                  <span className="text-muted-foreground font-normal">
                    ({decider.confidence}% confidence)
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{decider.summary}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {(decider.reasons ?? []).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="border-primary/30">
        <GlassCardHeader>
          <GlassCardTitle className="text-base">Human approval required</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="pt-0 text-sm text-muted-foreground space-y-2">
          <p>
            An immigration attorney must approve or decline the AI recommendation before a final decision
            is issued. You will receive a phone call after review.
          </p>
          {humanReview.status === "approved" && (
            <p className="text-success font-medium">Attorney approved this application.</p>
          )}
          {humanReview.status === "rejected" && (
            <p className="text-destructive font-medium">Attorney declined this application.</p>
          )}
          {humanReview.status === "pending" && pipeline.status === "awaiting_human" && (
            <p className="text-warning">Waiting for attorney review…</p>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

function AgentBlock({
  icon: Icon,
  title,
  score,
  summary,
  items,
}: {
  icon: typeof FileSearch;
  title: string;
  score?: number;
  summary?: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-border/40 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 text-primary" />
          {title}
        </span>
        {score != null && <span className="text-xs tabular-nums text-muted-foreground">{score}%</span>}
      </div>
      {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
      {items.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
          {items.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
