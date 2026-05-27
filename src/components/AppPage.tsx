import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppPageProps = {
  children: ReactNode;
  className?: string;
};

/** Consistent page wrapper: spacing, fade-in, glass-friendly layout */
export function AppPage({ children, className }: AppPageProps) {
  return (
    <div className={cn("space-y-6 animate-[fade-up_0.6s_ease-out] md:space-y-8", className)}>
      {children}
    </div>
  );
}
