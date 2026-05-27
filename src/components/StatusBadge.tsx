import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "approved" | "needs_info" | "rejected" | "processing";

const statusLabels: Record<Status, string> = {
  approved: "Approved",
  needs_info: "Needs info",
  rejected: "Rejected",
  processing: "Processing",
};

const statusDots: Record<Status, string> = {
  approved: "bg-success",
  needs_info: "bg-warning",
  rejected: "bg-destructive",
  processing: "bg-primary animate-pulse",
};

export function StatusBadge({ status, children }: { status: Status; children?: ReactNode }) {
  return (
    <Badge variant={status} className="gap-1.5 rounded-full px-2 py-0.5 font-medium">
      <span className={cn("size-1.5 rounded-full shrink-0", statusDots[status])} />
      {children ?? statusLabels[status]}
    </Badge>
  );
}

const visaVariants: Record<string, "visa_f1" | "visa_o1" | "visa_b1" | "visa_b2"> = {
  "F-1": "visa_f1",
  "O-1": "visa_o1",
  "B-1": "visa_b1",
  "B-2": "visa_b2",
  "B-1/B-2": "visa_b1",
};

export function VisaBadge({ type }: { type: string }) {
  const variant = visaVariants[type] ?? "outline";
  return (
    <Badge variant={variant} className="rounded-md px-1.5 py-0.5">
      {type}
    </Badge>
  );
}
