import type { ReactNode } from "react";

import { ShaderBackground } from "@/components/ui/shaders-hero-section";
import { cn } from "@/lib/utils";

type LandingLayoutProps = {
  children: ReactNode;
  className?: string;
  /** WebGL shader — only on marketing landing (avoids too many WebGL contexts in app shells) */
  shader?: boolean;
};

/** Shared dark hero shell — matches the marketing landing page */
export function LandingLayout({ children, className, shader = true }: LandingLayoutProps) {
  const inner = (
    <div
      className={cn(
        "landing-page landing-page-hero relative min-h-screen overflow-x-hidden",
        className,
      )}
      style={shader ? { backgroundColor: "transparent" } : undefined}
    >
      {!shader && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.25 0.04 260 / 0.5), transparent), linear-gradient(180deg, oklch(0.07 0.01 260) 0%, oklch(0.05 0.01 260) 100%)",
          }}
          aria-hidden
        />
      )}
      {children}
    </div>
  );

  if (shader) {
    return <ShaderBackground>{inner}</ShaderBackground>;
  }

  return inner;
}
