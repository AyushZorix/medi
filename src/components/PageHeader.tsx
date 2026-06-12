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
    <div className={cn("flex flex-wrap items-end justify-between gap-4 pb-2 border-b border-border/40", className)}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {portal && <PortalBadge portal={portal} className="shadow-sm" />}
          {eyebrow && (
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary/95">{eyebrow}</span>
          )}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl font-display text-foreground select-none pb-1">
          {title}
        </h1>
        {description && <p className="max-w-2xl text-base text-muted-foreground/95 leading-relaxed font-medium mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 pb-1">{actions}</div>}
    </div>
  );
}
