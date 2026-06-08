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
    <div className={cn("flex flex-wrap items-end justify-between gap-4 pb-2 border-b border-white/[0.05]", className)}>
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {portal && <PortalBadge portal={portal} className="shadow-sm" />}
          {eyebrow && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">{eyebrow}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl font-display bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent select-none">
          {title}
        </h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground/90 leading-relaxed font-light">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 pb-1">{actions}</div>}
    </div>
  );
}
