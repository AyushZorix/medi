import { createFileRoute } from "@tanstack/react-router";
import { FileText, CheckCircle2, AlertTriangle, XCircle, Sparkles, MessageSquare, History } from "lucide-react";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/app/applications/$id")({
  head: () => ({ meta: [{ title: "Application detail — VisaIQ" }] }),
  component: AppDetail,
});

function AppDetail() {
  const { id } = Route.useParams();
  const name = id.split("-").map((s: string) => s[0].toUpperCase() + s.slice(1)).join(" ");

  return (
    <div className="space-y-6 animate-[fade-up_0.6s_ease-out]">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Case #VIQ-2847</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1 flex items-center gap-3">
            {name} <VisaBadge type="O-1" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Submitted Mar 14, 2026 · 9 documents · 3 reviewers</p>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-lg glass hover:bg-white/[0.06] text-sm">Override</button>
          <button className="h-9 px-3 rounded-lg glass hover:bg-white/[0.06] text-sm">Re-run AI</button>
          <button className="h-9 px-3 rounded-lg bg-success/15 text-success border border-success/30 text-sm font-medium">Approve</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left: docs */}
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-2xl glass p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium">Document viewer</div>
              <div className="text-xs text-muted-foreground">passport.pdf · 2 of 9</div>
            </div>
            <div className="aspect-[4/5] rounded-xl border border-border/60 bg-muted/30 grid place-items-center relative overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="relative text-center">
                <FileText className="size-12 mx-auto text-muted-foreground/60" />
                <div className="mt-3 text-sm text-muted-foreground">Passport · Republic of India</div>
                <div className="text-xs text-muted-foreground/70 mt-1">Highlighted regions show OCR-extracted fields</div>
              </div>
              <div className="absolute top-1/3 left-1/4 w-32 h-8 rounded border-2 border-primary/60 bg-primary/10 animate-pulse-glow" />
              <div className="absolute bottom-1/3 right-1/4 w-24 h-8 rounded border-2 border-teal/60 bg-teal/10" />
            </div>
          </div>

          <div className="rounded-2xl glass p-6">
            <div className="font-medium mb-4">Extracted data</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Full name", "Rohan Patel"],
                ["Date of birth", "1994-08-12"],
                ["Passport no.", "M8472193"],
                ["Nationality", "Indian"],
                ["Issuing authority", "MEA New Delhi"],
                ["Expiry", "2031-04-22"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="font-mono text-sm mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI panel */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl glass-strong p-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 size-48 rounded-full opacity-30" style={{ background: "var(--gradient-aurora)" }} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Final decision</div>
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <div className="text-3xl font-semibold tracking-tight">Needs info</div>
                <StatusBadge status="needs_info" />
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Confidence <span className="text-gradient font-semibold text-base">89.6%</span> · 2026-03-14 11:42 UTC
              </div>
            </div>
          </div>

          <div className="rounded-2xl glass p-6">
            <div className="font-medium mb-4">AI analysis</div>
            <div className="space-y-3">
              <Signal kind="ok" label="Completeness" detail="9/9 required documents present" />
              <Signal kind="warn" label="Inconsistency" detail="Address mismatch between visa form and bank statement" />
              <Signal kind="ok" label="Identity match" detail="Cross-document name & DOB verified" />
              <Signal kind="bad" label="Risk signal" detail="Single overseas trip declared in 5y history" />
            </div>
          </div>

          <div className="rounded-2xl glass p-6">
            <div className="font-medium mb-4">Rule engine</div>
            <div className="space-y-2.5">
              {[
                ["O1.PROOF_EXTRAORDINARY_ABILITY", true],
                ["O1.EMPLOYER_PETITION_SIGNED", true],
                ["O1.PEER_TESTIMONIALS_GTE_3", true],
                ["O1.MEDIA_COVERAGE_VERIFIED", true],
                ["O1.ADDRESS_CONSISTENCY", false],
              ].map(([rule, pass]) => (
                <div key={rule as string} className="flex items-center gap-2 text-xs font-mono">
                  {pass ? <CheckCircle2 className="size-3.5 text-success" /> : <XCircle className="size-3.5 text-destructive" />}
                  <span className={pass ? "text-foreground" : "text-destructive"}>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl glass p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="size-4 text-primary" />
              <div className="font-medium">Why this decision</div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your application satisfies <span className="text-foreground font-medium">9 of 10</span> O-1 requirements.
              The address on your visa form (<span className="text-warning">Mumbai</span>) does not match the
              one shown on your bank statement (<span className="text-warning">Pune</span>). Please upload a
              utility bill or rental agreement confirming current residence.
            </p>
          </div>

          <div className="rounded-2xl glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="size-4 text-muted-foreground" />
              <div className="font-medium">Audit trail</div>
            </div>
            <div className="space-y-3 text-xs">
              {[
                ["11:42", "AI", "Generated decision · needs_info"],
                ["11:41", "AI", "Rule engine evaluation complete"],
                ["11:40", "AI", "Consistency check raised 1 flag"],
                ["11:39", "System", "OCR completed in 3.4s"],
                ["11:38", "Applicant", "Submitted 9 documents"],
              ].map(([t, who, what]) => (
                <div key={t + what} className="flex gap-3">
                  <span className="text-muted-foreground tabular-nums w-10">{t}</span>
                  <span className="text-muted-foreground w-16">{who}</span>
                  <span>{what}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Signal({ kind, label, detail }: { kind: "ok" | "warn" | "bad"; label: string; detail: string }) {
  const map = {
    ok: { Icon: CheckCircle2, color: "text-success" },
    warn: { Icon: AlertTriangle, color: "text-warning" },
    bad: { Icon: XCircle, color: "text-destructive" },
  } as const;
  const { Icon, color } = map[kind];
  return (
    <div className="flex gap-3 items-start">
      <Icon className={`size-4 mt-0.5 ${color}`} />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{detail}</div>
      </div>
    </div>
  );
}
