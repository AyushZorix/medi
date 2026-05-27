import { useState, useEffect } from "react";
import "lenis/dist/lenis.css";

import { LandingHero } from "@/components/landing/LandingHero";
import { LandingUnderground } from "@/components/landing/LandingUnderground";
import { LandingWorkGrid } from "@/components/landing/LandingWorkGrid";
import { TransitionLink } from "@/components/TransitionLink";
import { useLandingLenis } from "@/components/landing/useLandingLenis";
import { LandingLayout } from "@/components/LandingLayout";

import { GlobalLoader } from "@/components/landing/GlobalLoader";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { ContactModal } from "@/components/landing/ContactModal";
import { soundManager } from "@/components/landing/SoundManager";

export function Landing() {
  const [isLoading, setIsLoading] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Hook to enable smooth scrolling via Lenis
  useLandingLenis(!isLoading);

  // Clean up Web Audio nodes when navigating away
  useEffect(() => {
    return () => {
      soundManager.destroy();
    };
  }, []);

  return (
    <>
      {/* Full screen loader prior to entry */}
      {isLoading && <GlobalLoader onComplete={() => setIsLoading(false)} />}

      {/* Global Interactive Elements */}
      {!isLoading && (
        <>
          <LandingNavbar onContactClick={() => setIsContactOpen(true)} />
          <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </>
      )}

      {/* Main Landing Page Layout with animated mesh shader background enabled */}
      <LandingLayout shader={true} className="min-h-screen bg-[var(--landing-bg)]">
        <LandingHero />
        <LandingWorkGrid />
        <LandingUnderground />

        <footer className="relative z-10 flex flex-col items-center justify-between gap-6 border-t border-[var(--landing-border)] px-6 py-12 text-xs text-[var(--landing-muted)] md:flex-row md:px-12 lg:px-20 bg-black/40">
          <div>© 2026 VisaIQ. All rights reserved.</div>
          <div className="flex flex-wrap justify-center gap-8">
            <TransitionLink to="/sign-in" className="transition-colors hover:text-[var(--landing-fg)]">
              Attorney Portal
            </TransitionLink>
            <TransitionLink to="/sign-in" className="transition-colors hover:text-[var(--landing-fg)]">
              Applicant Sign In
            </TransitionLink>
            <span>Explainable AI Visa Processing</span>
          </div>
        </footer>
      </LandingLayout>
    </>
  );
}
export default Landing;
