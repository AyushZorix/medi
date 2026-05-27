import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { TransitionLink } from "@/components/TransitionLink";
import { DistortedImage } from "./DistortedImage";
import { ScrambleText } from "./ScrambleText";

const WORK = [
  {
    title: "F-1 Student",
    subtitle: "Academic pathways",
    image:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "O-1 Extraordinary",
    subtitle: "Talent & achievement",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "B-1 / B-2 Visitor",
    subtitle: "Business & tourism",
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "AI review pipeline",
    subtitle: "Validator · Consistency · Decider",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

export function LandingWorkGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const cards = section.querySelectorAll("[data-work-card]");
    const ctx = gsap.context(() => {
      gsap.from(cards, {
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
        },
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section id="work" ref={sectionRef} className="relative z-10 px-6 py-20 md:px-12 lg:px-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              Our work
            </p>
            <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
              <ScrambleText as="span">Visa categories</ScrambleText> we power
            </h2>
          </div>
          <p className="max-w-xs text-xs text-[var(--landing-muted)]">
            Hover images to feel the fluid distortion field — the same WebGL technique used on
            studio-grade portfolio sites.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {WORK.map((item) => (
            <article
              key={item.title}
              data-work-card
              className="group landing-card overflow-hidden rounded-xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <DistortedImage
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full transition-transform duration-700 group-hover:scale-[1.02]"
                  distortStrength={0.12}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">{item.subtitle}</p>
                  <h3 className="mt-1 text-lg font-medium text-white">
                    <ScrambleText as="span">{item.title}</ScrambleText>
                  </h3>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
