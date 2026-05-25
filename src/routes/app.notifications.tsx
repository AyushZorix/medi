import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare, Bell } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — VisaIQ" }] }),
  component: Notifications,
});

const items = [
  { t: "2m", c: "email", title: "Decision sent to Amelia Chen", body: "Approval notification · F-1" },
  { t: "8m", c: "sms", title: "SMS alert to Sofia Marquez", body: "Additional documentation requested" },
  { t: "12m", c: "app", title: "Daniel Okafor approved", body: "AI confidence 92% · attorney signoff complete" },
  { t: "1h", c: "email", title: "Weekly digest sent", body: "47 cases summarised for compliance team" },
];

const iconMap = { email: Mail, sms: MessageSquare, app: Bell };

function Notifications() {
  return (
    <div className="space-y-6 animate-[fade-up_0.6s_ease-out]">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Channel timeline</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Notifications</h1>
      </div>
      <div className="rounded-2xl glass p-6">
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border/60" />
          <div className="space-y-6">
            {items.map((i) => {
              const Icon = iconMap[i.c as keyof typeof iconMap];
              return (
                <div key={i.title} className="flex gap-4 relative">
                  <div className="size-10 rounded-full glass-strong grid place-items-center relative z-10">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 pt-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{i.title}</div>
                      <div className="text-xs text-muted-foreground">{i.t} ago</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{i.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
