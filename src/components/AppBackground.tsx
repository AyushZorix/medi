import type { ReactNode } from "react";

import { LandingLayout } from "@/components/LandingLayout";
import { cn } from "@/lib/utils";

type AppBackgroundProps = {
  className?: string;
  children?: ReactNode;
  /** When true, parent already provides landing-page-hero (e.g. app shell with sidebar). */
  nested?: boolean;
};

/** App shell backdrop — same ShaderBackground + landing hero theme as the home page */
export function AppBackground({ className, children, nested }: AppBackgroundProps) {
  if (nested) {
    return (
      <div className={cn("relative z-[1] flex min-h-svh flex-1 flex-col", className)}>
        {children}
      </div>
    );
  }

  return (
    <LandingLayout className={cn("flex min-h-screen flex-col", className)}>
      {children && <div className="relative z-[1] flex min-h-0 flex-1 flex-col">{children}</div>}
    </LandingLayout>
  );
}
