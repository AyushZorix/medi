import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/documents")({
  head: () => ({ meta: [{ title: "Documents — VisaIQ" }] }),
  component: () => <Placeholder title="Documents" subtitle="Unified document library across all cases." />,
});

function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-6 animate-[fade-up_0.6s_ease-out]">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Module</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="rounded-2xl glass-strong p-12 text-center">
        <div className="text-sm text-muted-foreground">This surface is wired into the design system and ready for content.</div>
      </div>
    </div>
  );
}
