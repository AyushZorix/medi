import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/decisions")({
  head: () => ({ meta: [{ title: "Decisions — VisaIQ" }] }),
  component: () => (
    <div className="space-y-6 animate-[fade-up_0.6s_ease-out]">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Module</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Decisions</h1>
        <p className="text-sm text-muted-foreground mt-1">Full ledger of every approval, rejection, and request for info.</p>
      </div>
      <div className="rounded-2xl glass-strong p-12 text-center text-sm text-muted-foreground">
        Audit-grade decision history.
      </div>
    </div>
  ),
});
