import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

import { TransitionLink } from "@/components/TransitionLink";
import { Button } from "@/components/ui/button";
import { DistortedImage } from "./DistortedImage";
import { ScrambleText } from "./ScrambleText";
import { VisaInteractiveCard } from "./VisaInteractiveCard";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80";

export function LandingHero() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-hero-reveal]"), {
        y: 48,
        opacity: 0,
        duration: 1.2,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.2,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen lg:h-[100dvh] w-full overflow-hidden flex items-center justify-center py-20 lg:py-0">
      {/* Background Distorted Image */}
      <div className="absolute inset-0 z-0">
        <DistortedImage
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full"
          distortStrength={0.1}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[var(--landing-bg)]" />
      </div>

      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 h-full flex flex-col justify-between pt-20"
      >
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full flex-1">
          {/* Left Column: Heading and Description */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <p
              data-hero-reveal
              className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-[var(--landing-muted)]"
            >
              Creating clarity for ambitious visa applicants
            </p>
            <h1
              data-hero-reveal
              className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-medium leading-[1.05] tracking-tight text-white"
            >
              <ScrambleText as="span" className="text-[var(--landing-accent)]">
                Elevating
              </ScrambleText>{" "}
              your path to the U.S. —{" "}
              <ScrambleText as="span">clearly defined.</ScrambleText>
            </h1>
            <p
              data-hero-reveal
              className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--landing-muted)] md:text-base"
            >
              We turn your U.S. visa plans into clean, data-backed strategies. Powered by Explainable
              AI agents, we verify every regulatory requirement to ensure audit-ready compliance.
            </p>
            <div
              data-hero-reveal
              className="mt-10 flex flex-col sm:flex-row sm:items-center gap-6"
            >
              <Button
                className="group h-auto rounded-none border border-white/20 bg-[var(--landing-accent)] py-0 pl-6 pr-0 text-base font-normal text-[var(--landing-solid-bg)] hover:bg-[var(--landing-accent)]/90 cursor-pointer"
                asChild
              >
                <TransitionLink to="/sign-in">
                  Get started
                  <span className="ml-4 inline-flex border-l border-black/20 p-3 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="size-5" />
                  </span>
                </TransitionLink>
              </Button>
            </div>
          </div>

          {/* Right Column: Interactive Visa Card */}
          <div data-hero-reveal className="lg:col-span-5 flex justify-center w-full">
            <VisaInteractiveCard />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          data-hero-reveal
          className="mt-12 lg:mt-8 flex justify-between items-center w-full"
        >
          <a
            href="#work"
            className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-fg)]"
          >
            Scroll to explore
            <ArrowDown className="size-4 animate-bounce" />
          </a>
          <span className="text-[10px] font-mono text-white/20 tracking-wider hidden md:inline">
            SYSTEM VERSION: 2.1.0 • VISAIQ AGENT PROTOCOL
          </span>
        </div>
      </div>
    </section>
  );
}
