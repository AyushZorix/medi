import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PulsingCircle } from "@/components/ui/shaders-hero-section";

export function LandingHeroSpline() {
  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-[var(--landing-border)] bg-[var(--landing-surface)] backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-500">
      <div className="flex h-full flex-col md:flex-row min-h-[480px] lg:min-h-[520px]">
        {/* Hero text content overlay */}
        <div className="relative z-10 flex flex-1 flex-col justify-center p-8 text-left md:p-10 lg:p-12 text-[var(--landing-fg)]">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3 py-1 text-xs text-[var(--landing-muted)]">
            <span className="size-1.5 rounded-full bg-[var(--landing-accent)] animate-pulse" />
            Explainable AI for visa workflows
          </p>
          <h1 className="text-3xl font-medium leading-[1.12] tracking-tight md:text-4xl lg:text-5xl text-[var(--landing-fg)]">
            Smarter visa decisions,
            <span className="mt-1 block text-[var(--landing-muted)]">with clarity you can trust</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--landing-muted)] md:text-base">
            Document review, consistency checks, and eligibility analysis — every step
            transparent and auditable for O-1, F-1, B-1, and B-2.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-11 rounded-full bg-[var(--landing-fg)] text-[var(--landing-solid-bg)] hover:bg-[var(--landing-fg)]/90 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              asChild
            >
              <Link to="/app" className="group">
                Start application
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-11 rounded-full border border-[var(--landing-border)] bg-transparent text-[var(--landing-fg)] hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer"
              asChild
            >
              <Link to="/app/pipeline">View demo</Link>
            </Button>
          </div>
        </div>

        {/* Right side: Pulsing Shader Circle */}
        <div className="relative min-h-[260px] flex-1 md:min-h-0 flex items-center justify-center">
          <PulsingCircle />
        </div>
      </div>
    </div>
  );
}
