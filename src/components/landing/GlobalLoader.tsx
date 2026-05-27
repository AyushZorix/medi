import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { soundManager } from "./SoundManager";

type GlobalLoaderProps = {
  onComplete: () => void;
};

export function GlobalLoader({ onComplete }: GlobalLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [loadingFinished, setLoadingFinished] = useState(false);
  const [shouldExit, setShouldExit] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    let start = 0;
    const interval = setInterval(() => {
      start += Math.floor(Math.random() * 8) + 3;
      if (start >= 100) {
        start = 100;
        clearInterval(interval);
        setLoadingFinished(true);
      }
      setProgress(start);
    }, 55);

    return () => clearInterval(interval);
  }, []);

  const handleProceed = (withSound: boolean) => {
    // Initialize Web Audio context from user gesture (avoids browser policy issues)
    soundManager.init();
    soundManager.setMute(!withSound);

    // Trigger exit animation
    setShouldExit(true);
    setTimeout(() => {
      onComplete();
    }, 800); // Wait for exit animations to play
  };

  return (
    <AnimatePresence>
      {!shouldExit && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            opacity: 0,
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[oklch(0.03_0.002_260)] text-white select-none"
        >
          {/* Subtle scanner laser line across screen */}
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--landing-accent)]/30 to-transparent top-1/2 -translate-y-1/2 w-full animate-[pulse-glow_2.6s_infinite]" />

          {/* Logo container */}
          <div className="relative mb-12 flex flex-col items-center">
            {/* Spinning background outline */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute size-24 border border-dashed border-white/10 rounded-full"
            />
            {/* Pulsing indicator */}
            <div className="absolute size-16 rounded-full bg-[var(--landing-accent)]/5 blur-xl animate-pulse" />

            {/* Stylized VisaIQ logo */}
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative z-10 text-[var(--landing-accent)]"
            >
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
              <polyline points="12 22 12 12 22 8.5" />
              <polyline points="2 8.5 12 12" />
            </svg>

            <span className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-[var(--landing-muted)]">
              VisaIQ Core
            </span>
          </div>

          <div className="relative h-20 w-80 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {!loadingFinished ? (
                /* Progress Counter */
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <span className="font-mono text-3xl font-light text-white tracking-widest">
                    {progress}%
                  </span>
                  <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                    Calibrating decision matrix
                  </span>
                </motion.div>
              ) : (
                /* Sound Selection Choice */
                <motion.div
                  key="audio-select"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--landing-muted)] mb-1">
                    System calibrated
                  </span>
                  <div className="flex gap-4 w-full justify-center">
                    <button
                      onClick={() => handleProceed(true)}
                      className="px-8 py-2.5 rounded-none border border-white/20 bg-white text-black font-mono text-xs uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
                    >
                      Enter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
