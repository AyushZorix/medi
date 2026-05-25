import { ReactNode } from "react";

type Status = "approved" | "needs_info" | "rejected" | "processing";

const map: Record<Status, { label: string; cls: string; dot: string }> = {
  approved: { label: "Approved", cls: "bg-success/10 text-success border-success/30", dot: "bg-success" },
  needs_info: { label: "Needs info", cls: "bg-warning/10 text-warning border-warning/30", dot: "bg-warning" },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  processing: { label: "Processing", cls: "bg-primary/10 text-primary border-primary/30", dot: "bg-primary animate-pulse" },
};

export function StatusBadge({ status, children }: { status: Status; children?: ReactNode }) {
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {children ?? s.label}
    </span>
  );
}

export function VisaBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    "F-1": "bg-indigo/15 text-indigo border-indigo/30",
    "O-1": "bg-violet/15 text-violet border-violet/30",
    "B-1": "bg-teal/15 text-teal border-teal/30",
    "B-2": "bg-warning/10 text-warning border-warning/30",
  };
  const c = colors[type] ?? "bg-muted text-foreground";
  return (
    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-tight ${c}`}>
      {type}
    </span>
  );
}
