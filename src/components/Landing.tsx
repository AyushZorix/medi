import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Brain,
  FileSearch,
  GitBranch,
  CheckCircle2,
} from "lucide-react";
import { PipelineFlow } from "./PipelineFlow";

export function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1100px] rounded-full"
        style={{ background: "var(--gradient-glow)" }} />

      {/* Nav */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="size-8 rounded-lg bg-gradient-aurora grid place-items-center shadow-glow">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight text-lg">VisaIQ</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a className="hover:text-foreground transition-colors" href="#pipeline">Pipeline</a>
          <a className="hover:text-foreground transition-colors" href="#capabilities">Capabilities</a>
          <a className="hover:text-foreground transition-colors" href="#trust">Trust</a>
          <a className="hover:text-foreground transition-colors" href="#integrations">Integrations</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/app" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 transition"
          >
            Launch console <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground mb-8">
          <span className="size-1.5 rounded-full bg-success animate-pulse-glow" />
          New · Multi-agent reasoning for O-1 visa
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
          Automate visa decisions
          <br />
          with <span className="text-gradient">explainable AI</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          From document parsing to final approval — intelligent agents that read, reason, and recommend.
          Every decision auditable. Every signal traceable.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 transition"
          >
            Start application <ArrowUpRight className="size-4" />
          </Link>
          <Link
            to="/app/pipeline"
            className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-medium hover:bg-white/[0.06] transition"
          >
            View live demo
          </Link>
        </div>

        {/* Hero stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl glass overflow-hidden">
          {[
            { k: "94.2%", v: "Decision accuracy" },
            { k: "12s", v: "Avg processing" },
            { k: "10×", v: "Faster than manual" },
            { k: "SOC 2", v: "Audit-ready logs" },
          ].map((s) => (
            <div key={s.v} className="bg-card/40 p-6 text-left">
              <div className="text-2xl md:text-3xl font-semibold tracking-tight">{s.k}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline preview */}
      <section id="pipeline" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">The AI Pipeline</div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Watch the system think</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Six stages, full transparency. Every node exposes its reasoning, evidence, and confidence.
          </p>
        </div>
        <div className="rounded-3xl glass-strong p-8 md:p-12">
          <PipelineFlow />
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { i: FileSearch, t: "OCR & extraction", d: "Multi-format ingestion with structural parsing for passports, I-20s, financial proofs." },
            { i: Brain, t: "Reasoning agents", d: "LLM agents cross-check fields against visa class rules and historical decisions." },
            { i: GitBranch, t: "Rule engine", d: "Deterministic validation for F-1, O-1, B-1, B-2 with versioned rule sets." },
            { i: ShieldCheck, t: "Explainability", d: "Every decision ships with cited evidence, matched rules, and natural-language rationale." },
            { i: Zap, t: "Real-time", d: "Streaming pipeline updates so applicants and attorneys see progress as it happens." },
            { i: CheckCircle2, t: "Human override", d: "Attorneys can amend, annotate, and re-run validation — all preserved in the audit trail." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl glass p-6 hover:bg-white/[0.05] transition group">
              <div className="size-10 rounded-xl bg-accent/60 grid place-items-center mb-4 group-hover:shadow-glow transition">
                <c.i className="size-5 text-primary" />
              </div>
              <div className="font-medium">{c.t}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl glass-strong p-10 md:p-16 relative overflow-hidden">
          <div className="absolute -right-32 -top-32 size-96 rounded-full opacity-30"
            style={{ background: "var(--gradient-aurora)" }} />
          <div className="relative max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Built for trust</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Decisions that withstand scrutiny.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every applicant gets a transparent breakdown. Every reviewer gets a full chain of evidence.
              Every change is logged with timestamp, actor, and rationale.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/app" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow">
                Open console <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer id="integrations" className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>© 2026 VisaIQ — Explainable visa intelligence.</div>
        <div className="flex gap-6">
          <span>ElevenLabs</span>
          <span>Twilio</span>
          <span>AWS S3</span>
          <span>SOC 2</span>
        </div>
      </footer>
    </div>
  );
}
