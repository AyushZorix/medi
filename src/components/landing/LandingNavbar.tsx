import { useState, useEffect } from "react";
import { soundManager } from "./SoundManager";
import { ScrambleText } from "./ScrambleText";
import { Link } from "@tanstack/react-router";

type LandingNavbarProps = {
  onContactClick: () => void;
};

export function LandingNavbar({ onContactClick }: LandingNavbarProps) {
  const [muted, setMuted] = useState(true);

  // Sync mute state on mount/init
  useEffect(() => {
    setMuted(soundManager.getMuted());
  }, []);

  const handleAudioToggle = () => {
    const nextMute = soundManager.toggleMute();
    setMuted(nextMute);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-6 py-5 md:px-12 lg:px-20 backdrop-blur-md bg-black/10 border-b border-white/5 select-none">
      {/* Left Links */}
      <nav className="hidden sm:flex items-center gap-8">
        <a
          href="#work"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--landing-muted)] hover:text-white transition-colors"
        >
          <ScrambleText as="span">Work</ScrambleText>
        </a>
        <a
          href="#underground"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--landing-muted)] hover:text-white transition-colors"
        >
          <ScrambleText as="span">About</ScrambleText>
        </a>
      </nav>

      {/* Center Logo */}
      <a href="/" className="relative z-10 flex items-center gap-2 group cursor-pointer">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--landing-accent)] group-hover:rotate-12 transition-transform duration-300"
        >
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
          <polyline points="12 22 12 12 22 8.5" />
          <polyline points="2 8.5 12 12" />
        </svg>
        <span className="font-mono text-xs font-semibold tracking-[0.25em] text-white hidden xs:inline">
          VisaIQ
        </span>
      </a>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        {/* Audio Toggle button */}
        <button
          onClick={handleAudioToggle}
          className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--landing-muted)] hover:text-white transition-colors cursor-pointer border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm"
        >
          <ScrambleText as="span">{muted ? "Sound Off" : "Sound On"}</ScrambleText>
        </button>

        {/* Contact button */}
        <button
          onClick={onContactClick}
          className="font-mono text-[9px] uppercase tracking-[0.18em] text-black bg-[var(--landing-accent)] hover:bg-[var(--landing-accent)]/90 px-4 py-1.5 transition-colors cursor-pointer"
        >
          <ScrambleText as="span">Contact</ScrambleText>
        </button>
      </div>
    </header>
  );
}
