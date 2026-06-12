import type { ReactNode } from "react";

import { ShaderBackground } from "@/components/ui/shaders-hero-section";
import { DistortedImage } from "@/components/landing/DistortedImage";
import { MeshGradient } from "@paper-design/shaders-react";
import { cn } from "@/lib/utils";

const OCEAN_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80";

type LandingLayoutProps = {
  children: ReactNode;
  className?: string;
  /** WebGL shader — only on marketing landing (avoids too many WebGL contexts in app shells) */
  shader?: boolean;
  /** Ocean background image (distorted) */
  ocean?: boolean;
  /** Galaxy background animation */
  galaxy?: boolean;
};

/** Shared dark hero shell — matches the marketing landing page */
export function LandingLayout({ children, className, shader = true, ocean = false, galaxy = false }: LandingLayoutProps) {
  const inner = (
    <div
      className={cn(
        "landing-page landing-page-hero relative min-h-screen overflow-x-hidden",
        className,
      )}
      style={shader ? { backgroundColor: "transparent" } : undefined}
    >
      {galaxy && (
        <div className="absolute inset-0 z-0 w-full h-full bg-black">
          <MeshGradient
            className="w-full h-full absolute inset-0 opacity-80"
            colors={["#000000", "#1a1a1a", "#333333", "#ffffff"]}
            speed={1.0}
            backgroundColor="#000000"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-[var(--landing-bg)]/80" />
        </div>
      )}
      {ocean && !galaxy && (
        <div className="absolute inset-0 z-0">
          <DistortedImage
            src={OCEAN_IMAGE}
            alt=""
            className="h-full w-full"
            distortStrength={0.1}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[var(--landing-bg)]" />
        </div>
      )}
      {!shader && !ocean && !galaxy && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.25 0.04 260 / 0.5), transparent), linear-gradient(180deg, oklch(0.07 0.01 260) 0%, oklch(0.05 0.01 260) 100%)",
          }}
          aria-hidden
        />
      )}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );

  if (shader) {
    return <ShaderBackground>{inner}</ShaderBackground>;
  }

  return inner;
}
