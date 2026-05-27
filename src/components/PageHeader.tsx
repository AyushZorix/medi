import { ReactNode } from "react";

import { PortalBadge } from "@/components/PortalBadge";
import type { PortalKind } from "@/lib/auth";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  portal?: PortalKind;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, portal, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {portal && <PortalBadge portal={portal} />}
          {eyebrow && (
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</span>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
