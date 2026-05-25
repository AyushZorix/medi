import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Attorney panel — VisaIQ" }] }),
  component: Admin,
});

function Admin() {
  return (
    <div className="space-y-6 animate-[fade-up_0.6s_ease-out]">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Privileged access</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1 flex items-center gap-2">
          <ShieldCheck className="size-7 text-violet" /> Attorney panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Override AI decisions, leave notes, and audit changes.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl glass p-6">
          <div className="font-medium mb-3">Pending overrides</div>
          <div className="space-y-3">
            {["Rohan Patel · O-1", "Sofia Marquez · B-2", "Noor Al-Sayed · O-1"].map((n) => (
              <div key={n} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 text-sm">
                <span>{n}</span>
                <button className="text-xs text-primary hover:underline">Review</button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl glass p-6">
          <div className="font-medium mb-3">Recent audit entries</div>
          <div className="space-y-2 text-xs font-mono text-muted-foreground">
            <div>2026-03-14 11:42 · jordan.a · approve · #VIQ-2847</div>
            <div>2026-03-14 10:18 · taylor.m · override · #VIQ-2839</div>
            <div>2026-03-14 09:55 · system  · auto-flag · #VIQ-2841</div>
            <div>2026-03-13 18:02 · jordan.a · note · #VIQ-2812</div>
          </div>
        </div>
      </div>
    </div>
  );
}
