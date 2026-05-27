import { Upload, ScanLine, ListChecks, GitCompare, Scale, BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const nodes = [
  { icon: Upload, label: "Upload", status: "done" as const },
  { icon: ScanLine, label: "OCR", status: "done" as const },
  { icon: ListChecks, label: "Completeness", status: "done" as const },
  { icon: GitCompare, label: "Consistency", status: "active" as const },
  { icon: Scale, label: "Rule engine", status: "pending" as const },
  { icon: BadgeCheck, label: "Decision", status: "pending" as const },
];

const statusBadge: Record<
  (typeof nodes)[number]["status"],
  { label: string; variant: "approved" | "processing" | "outline" }
> = {
  done: { label: "Complete", variant: "approved" },
  active: { label: "Running", variant: "processing" },
  pending: { label: "Queued", variant: "outline" },
};

type PipelineFlowProps = {
  variant?: "default" | "minimal";
};

export function PipelineFlow({ variant = "default" }: PipelineFlowProps) {
  const minimal = variant === "minimal";

  return (
    <div className="relative">
      <div className="relative grid grid-cols-2 gap-6 md:grid-cols-6 md:gap-3">
        {nodes.map((n, i) => {
          const Icon = n.icon;
          const isActive = n.status === "active";
          const isDone = n.status === "done";
          const badge = statusBadge[n.status];

          return (
            <div
              key={n.label}
              className={cn(
                "relative flex flex-col items-center transition-all duration-500",
                minimal && "landing-rise",
                minimal && `landing-d${Math.min(i + 1, 6)}`,
              )}
              style={minimal ? undefined : { animationDelay: `${i * 0.05}s` }}
            >
              {i < nodes.length - 1 && (
                <div className="absolute top-7 left-[58%] right-[-42%] hidden h-px md:block">
                  <div
                    className={cn(
                      "h-px w-full transition-colors duration-500",
                      minimal
                        ? isDone
                          ? "bg-[var(--landing-accent)]/30"
                          : "bg-[var(--landing-border)]"
                        : isDone
                          ? "bg-gradient-to-r from-primary to-violet"
                          : "bg-border",
                    )}
                  />
                </div>
              )}
              <div
                className={cn(
                  "relative grid size-14 place-items-center rounded-2xl transition-all duration-500",
                  minimal
                    ? cn(
                        "border bg-[var(--landing-surface)]",
                        isDone && "border-[var(--landing-accent)]/40 bg-[var(--landing-accent)]/[0.04]",
                        isActive && "border-[var(--landing-accent)] shadow-sm",
                        !isDone && !isActive && "border-[var(--landing-border)]",
                      )
                    : cn(
                        isDone && "bg-gradient-primary shadow-glow",
                        isActive && "glass-strong animate-pulse-glow",
                        !isDone && !isActive && "glass",
                      ),
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-colors duration-300",
                    minimal
                      ? isDone || isActive
                        ? "text-[var(--landing-accent)]"
                        : "text-[var(--landing-muted)]"
                      : isDone || isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                  )}
                />
                {!minimal && isActive && (
                  <span className="absolute -right-1 -top-1 size-3 rounded-full bg-warning animate-pulse" />
                )}
                {!minimal && isDone && (
                  <span className="absolute -right-1 -top-1 size-3 rounded-full bg-success" />
                )}
                {minimal && isActive && (
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[var(--landing-accent)] animate-pulse" />
                )}
              </div>
              <div
                className={cn(
                  "mt-3 text-xs font-medium transition-colors duration-300",
                  minimal && "text-[var(--landing-fg)]",
                )}
              >
                {n.label}
              </div>
              {minimal ? (
                <span
                  className={cn(
                    "mt-1.5 text-[10px] transition-opacity duration-300",
                    isActive ? "text-[var(--landing-accent)]" : "text-[var(--landing-muted)]",
                  )}
                >
                  {badge.label}
                </span>
              ) : (
                <Badge variant={badge.variant} className="mt-1.5 rounded-full px-2 py-0 text-[10px] font-normal">
                  {badge.label}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
