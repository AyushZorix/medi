import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Mail } from "lucide-react";

import { AppPage } from "@/components/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";

export const Route = createFileRoute("/portal/messages")({
  head: () => ({ meta: [{ title: "Messages — VisaIQ" }] }),
  component: PortalMessages,
});

const messages = [
  {
    from: "Jordan Avery",
    role: "Attorney",
    time: "2h ago",
    subject: "Bank statement needed",
    body: "Please upload your latest bank statement so we can complete the financial review.",
    unread: true,
  },
  {
    from: "VisaIQ",
    role: "System",
    time: "1d ago",
    subject: "Documents received",
    body: "We received your passport and I-20. AI extraction completed successfully.",
    unread: true,
  },
  {
    from: "Jordan Avery",
    role: "Attorney",
    time: "3d ago",
    subject: "Welcome to your portal",
    body: "Use this space to upload documents and track your F-1 application.",
    unread: false,
  },
];

function PortalMessages() {
  return (
    <AppPage>
      <PageHeader
        portal="applicant"
        eyebrow="Inbox"
        title="Messages"
        description="Updates from your immigration attorney and automated case alerts."
      />

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-base">Conversation</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-2 pt-0">
          {messages.map((m) => (
            <button
              key={m.subject}
              type="button"
              className={`flex w-full gap-4 rounded-xl border p-4 text-left transition hover:bg-white/[0.03] ${
                m.unread ? "border-primary/25 bg-primary/5" : "border-border/40 bg-muted/10"
              }`}
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-full glass">
                {m.role === "Attorney" ? (
                  <Mail className="size-4 text-primary" />
                ) : (
                  <MessageSquare className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{m.from}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {m.role}
                  </Badge>
                  {m.unread && <span className="size-2 rounded-full bg-primary" />}
                  <span className="ml-auto text-xs text-muted-foreground">{m.time}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{m.subject}</p>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{m.body}</p>
              </div>
            </button>
          ))}
        </GlassCardContent>
      </GlassCard>
    </AppPage>
  );
}
