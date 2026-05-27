import { Briefcase, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PortalKind } from "@/lib/auth";

const config = {
  attorney: {
    label: "Attorney portal",
    icon: Briefcase,
    className: "border-violet/30 bg-violet/10 text-violet",
  },
  applicant: {
    label: "Applicant portal",
    icon: User,
    className: "border-teal/30 bg-teal/10 text-teal",
  },
} as const;

export function PortalBadge({ portal, className }: { portal: PortalKind; className?: string }) {
  const { label, icon: Icon, className: variant } = config[portal];
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-0.5 font-medium", variant, className)}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
