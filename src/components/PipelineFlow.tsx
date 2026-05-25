import { Upload, ScanLine, ListChecks, GitCompare, Scale, BadgeCheck } from "lucide-react";

const nodes = [
  { icon: Upload, label: "Upload", status: "done" },
  { icon: ScanLine, label: "OCR", status: "done" },
  { icon: ListChecks, label: "Completeness", status: "done" },
  { icon: GitCompare, label: "Consistency", status: "active" },
  { icon: Scale, label: "Rule engine", status: "pending" },
  { icon: BadgeCheck, label: "Decision", status: "pending" },
] as const;

export function PipelineFlow() {
  return (
    <div className="relative">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-2 relative">
        {nodes.map((n, i) => {
          const Icon = n.icon;
          const isActive = n.status === "active";
          const isDone = n.status === "done";
          return (
            <div key={n.label} className="relative flex flex-col items-center">
              {/* connector */}
              {i < nodes.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[60%] right-[-40%] h-px">
                  <div className={`h-px w-full ${isDone ? "bg-gradient-to-r from-primary to-violet" : "bg-border"}`} />
                </div>
              )}
              <div
                className={`relative size-14 rounded-2xl grid place-items-center transition-all ${
                  isDone
                    ? "bg-gradient-primary shadow-glow"
                    : isActive
                    ? "glass-strong animate-pulse-glow"
                    : "glass"
                }`}
              >
                <Icon className={`size-5 ${isDone || isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 size-3 rounded-full bg-warning animate-pulse" />
                )}
                {isDone && (
                  <span className="absolute -top-1 -right-1 size-3 rounded-full bg-success" />
                )}
              </div>
              <div className="mt-3 text-xs font-medium">{n.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {isDone ? "Complete" : isActive ? "Running…" : "Queued"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
