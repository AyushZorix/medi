import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Calendar, TrendingUp, Cpu, RefreshCw, CheckCircle2 } from "lucide-react";
import { soundManager } from "./SoundManager";

type VisaData = {
  id: string;
  name: string;
  classification: string;
  description: string;
  processingTime: string;
  approvalRate: string;
  colorClass: string;
  glowColor: string;
  themeColor: string;
  checklist: string[];
  logs: string[];
};

const VISAS: VisaData[] = [
  {
    id: "O-1",
    name: "O-1 Protocol",
    classification: "Extraordinary Ability",
    description: "For individuals with extraordinary achievements in science, business, arts, or sports.",
    processingTime: "15 Days (Premium)",
    approvalRate: "94.2% AI-Recommended",
    colorClass: "text-amber-400 border-amber-500/30",
    glowColor: "rgba(245,158,11,0.15)",
    themeColor: "#f59e0b",
    checklist: [
      "Distinguished Peer Recommendations",
      "Major Press Coverage & Publications",
      "Evidence of Critical/Leading Roles",
    ],
    logs: [
      "INITIALIZING: O-1 petition scanner",
      "SCANNING: cv_researcher.pdf (118 citations)",
      "VERIFYING: h-index score against database (Score: 32)",
      "CRITERIA: Publications verified in Nature Journal",
      "REASONER: Critical employment role confirmed",
      "DECISION: Rule-engine match. Recommended for USCIS filing.",
    ],
  },
  {
    id: "F-1",
    name: "F-1 Protocol",
    classification: "Academic Student",
    description: "For students pursuing academic studies or language training at certified institutions.",
    processingTime: "20-30 Days (SEVIS)",
    approvalRate: "88.7% AI-Recommended",
    colorClass: "text-cyan-400 border-cyan-500/30",
    glowColor: "rgba(6,182,212,0.15)",
    themeColor: "#06b6d4",
    checklist: [
      "Validated Form I-20 Admission",
      "SEVIS I-901 Fee Receipt",
      "Proof of Liquid Financial Support",
    ],
    logs: [
      "INITIALIZING: F-1 admission compiler",
      "SCANNING: i20_university_admit.pdf",
      "VERIFYING: SEVIS ID N004281729 (Status: Valid)",
      "FINANCIALS: Bank proof scanned ($68,400 USD)",
      "TIES TO HOME COUNTRY: Non-immigrant intent verified",
      "DECISION: Auto-approved. Documentation ready for consular visa interview.",
    ],
  },
  {
    id: "B-1",
    name: "B-1 Protocol",
    classification: "Temporary Business",
    description: "For short-term commercial, scientific, or professional travel and consultations.",
    processingTime: "3-5 Days (Consular)",
    approvalRate: "91.5% AI-Recommended",
    colorClass: "text-emerald-400 border-emerald-500/30",
    glowColor: "rgba(16,185,129,0.15)",
    themeColor: "#10b981",
    checklist: [
      "Official Corporate Invitation Letter",
      "Host Company Verification",
      "Strict Business Travel Itinerary",
    ],
    logs: [
      "INITIALIZING: B-1 business traveler check",
      "SCANNING: corporate_invitation_letter.pdf",
      "VERIFYING: Host entity tax identification (Active)",
      "TRAVEL WINDOW: 14 days requested (Logical alignment)",
      "FINANCIAL RESPONSIBILITY: Host company backing verified",
      "DECISION: Rule criteria matched. Consular packaging compiled.",
    ],
  },
  {
    id: "B-2",
    name: "B-2 Protocol",
    classification: "Tourist & Pleasure",
    description: "For visitors travelling for tourism, vacation, medical treatment, or pleasure.",
    processingTime: "5-7 Days (Standard)",
    approvalRate: "85.4% AI-Recommended",
    colorClass: "text-violet-400 border-violet-500/30",
    glowColor: "rgba(139,92,246,0.15)",
    themeColor: "#8b5cf6",
    checklist: [
      "Round-Trip Airfare Confirmation",
      "Accredited Lodging Scans",
      "Personal Funding Verification",
    ],
    logs: [
      "INITIALIZING: B-2 leisure route scan",
      "SCANNING: delta_flight_confirmation.pdf",
      "VERIFYING: Return flight matching criteria (Confirmed)",
      "ACCOMMODATIONS: Airbnb reservation matched",
      "RISK ENGINE: Overstay risk assessment: LOW (Stable employment)",
      "DECISION: Package assembled. Tourist visa recommendations compiled.",
    ],
  },
];

export function VisaInteractiveCard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [logFeed, setLogFeed] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [showLaser, setShowLaser] = useState(true);

  const activeVisa = VISAS[activeIndex];
  const timerRef = useRef<number | null>(null);

  // Auto cycling timer
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = window.setInterval(() => {
      setProgress(0);
      setActiveIndex((prev) => (prev + 1) % VISAS.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Handle progress bar animation for the active tab (0% to 100% over 5s)
  useEffect(() => {
    setProgress(0);
    if (!isPlaying) {
      setProgress(100);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / 5000) * 100, 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [activeIndex, isPlaying]);

  // Simulate scrolling logs inside the terminal frame
  useEffect(() => {
    setLogFeed([]);
    let logIndex = 0;
    const logs = activeVisa.logs;

    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setLogFeed((prev) => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const selectVisa = (index: number) => {
    soundManager.playClick();
    setActiveIndex(index);
    setIsPlaying(false); // Pause auto rotation upon manual selection
  };

  return (
    <div
      className="relative mx-auto w-full max-w-lg border border-white/10 bg-black/60 p-6 backdrop-blur-xl rounded-2xl select-none"
      style={{
        boxShadow: `0 20px 50px -15px ${activeVisa.glowColor}`,
        transition: "box-shadow 0.6s ease",
      }}
    >
      {/* Active Scanner Laser bar moving down */}
      <AnimatePresence>
        {showLaser && (
          <motion.div
            initial={{ top: "0%" }}
            animate={{ top: "98%" }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="absolute left-0 right-0 h-[2px] z-20 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${activeVisa.themeColor}, transparent)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div
            className="size-2 animate-ping rounded-full"
            style={{ backgroundColor: activeVisa.themeColor }}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--landing-muted)]">
            VisaIQ Decision Protocol
          </span>
        </div>
        <button
          onClick={() => {
            soundManager.playClick();
            setIsPlaying(!isPlaying);
          }}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[8px] uppercase tracking-wider text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className={`size-2.5 ${isPlaying ? "animate-spin" : ""}`} />
          {isPlaying ? "Live Agent Active" : "Agent Paused"}
        </button>
      </div>

      {/* Manual Visa Navigation Tabs */}
      <div className="mb-6 grid grid-cols-4 gap-1.5 border-b border-white/5 pb-4">
        {VISAS.map((visa, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={visa.id}
              onClick={() => selectVisa(idx)}
              className={`relative py-2.5 font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                isActive ? "text-white font-medium" : "text-[var(--landing-muted)] hover:text-white/80"
              }`}
            >
              {visa.id}
              {isActive && (
                <>
                  <motion.div
                    layoutId="activeTabBorder"
                    className="absolute bottom-0 inset-x-0 h-px z-10"
                    style={{ backgroundColor: activeVisa.themeColor }}
                  />
                  {isPlaying && (
                    <motion.div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        height: 1,
                        width: `${progress}%`,
                        backgroundColor: activeVisa.themeColor,
                        filter: "brightness(1.5)",
                      }}
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Visa Information View with fade transitions */}
      <div className="relative min-h-[310px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeVisa.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col gap-5"
          >
            {/* Title & Classification */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-light text-white tracking-tight">{activeVisa.name}</h4>
                <span
                  className="rounded-full border px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-wider"
                  style={{
                    color: activeVisa.themeColor,
                    borderColor: `${activeVisa.themeColor}30`,
                    backgroundColor: `${activeVisa.themeColor}08`,
                  }}
                >
                  {activeVisa.classification}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--landing-muted)] leading-relaxed">
                {activeVisa.description}
              </p>
            </div>

            {/* Metrics Checklist grid */}
            <div className="grid grid-cols-2 gap-3 border-y border-white/5 py-4">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-white/40" />
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-[var(--landing-muted)]">
                    Audit Time
                  </p>
                  <p className="text-xs font-medium text-white">{activeVisa.processingTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-white/40" />
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-[var(--landing-muted)]">
                    USCIS Compliance
                  </p>
                  <p className="text-xs font-medium text-white">{activeVisa.approvalRate}</p>
                </div>
              </div>
            </div>

            {/* Required Criteria Checkbox list */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--landing-muted)] mb-3">
                Mandatory Documentation Checklist
              </p>
              <ul className="flex flex-col gap-2">
                {activeVisa.checklist.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-white/90">
                    <CheckCircle2
                      className="size-4 shrink-0"
                      style={{ color: activeVisa.themeColor }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Agent Console Logs simulation */}
            <div className="rounded-lg bg-black/45 border border-white/5 p-4 flex flex-col gap-1.5 h-[105px] overflow-y-auto font-mono text-[9px] tracking-wide text-white/80 scrollbar-none relative">
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <Cpu className="size-3 text-white/30" />
                <span className="text-[7px] text-white/20">AGENT LOG</span>
              </div>

              {logFeed.map((log, index) => {
                const isDecision = log && typeof log === "string" && log.startsWith("DECISION:");
                return (
                  <div
                    key={index}
                    className="flex gap-1.5 leading-relaxed"
                    style={{
                      color: isDecision ? activeVisa.themeColor : "",
                      fontWeight: isDecision ? "bold" : "normal",
                    }}
                  >
                    <span className="text-white/20 select-none">&gt;</span>
                    <span>{log || ""}</span>
                  </div>
                );
              })}
              {/* blinking terminal cursor */}
              {logFeed.length < activeVisa.logs.length && (
                <div className="flex gap-1.5">
                  <span className="text-white/20 select-none">&gt;</span>
                  <span className="w-1.5 h-3 bg-white/60 animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
