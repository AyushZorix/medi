import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ScrambleText } from "./ScrambleText";
import { GrassFieldScene } from "./GrassFieldScene";
import { VideoAmbientScene } from "./VideoAmbientScene";

export function LandingUnderground() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.from(section.querySelectorAll("[data-underground-reveal]"), {
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="underground"
      ref={sectionRef}
      className="relative z-10 min-h-[100vh] scroll-mt-0"
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <VideoAmbientScene className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--landing-bg)] via-transparent to-[var(--landing-bg)]" />

        <GrassFieldScene className="absolute inset-x-0 bottom-0 h-[55%] w-full" />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p
            data-underground-reveal
            className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-muted)]"
          >
            Go underground
          </p>
          <h2
            data-underground-reveal
            className="mt-4 max-w-3xl text-3xl font-medium tracking-tight text-white md:text-5xl"
          >
            <ScrambleText as="span">Immersive review</ScrambleText>
            {" — "}
            <span className="text-[var(--landing-accent)]">expert attorneys</span>
          </h2>
          <p
            data-underground-reveal
            className="mt-4 max-w-lg text-sm text-[var(--landing-muted)] md:text-base"
          >
            Move your cursor over the grass. Interact with the 3D studio displaying our
            network of top-tier verified U.S. immigration attorneys.
          </p>
        </div>
      </div>
    </section>
  );
}
