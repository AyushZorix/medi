import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare, Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { AppPage } from "@/components/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — VisaIQ" }] }),
  component: Notifications,
});

const items = [
  { t: "2m", c: "email" as const, title: "Approved: Amelia Chen", body: "F-1 application approved · Confirmation email sent", unread: true },
  { t: "8m", c: "sms" as const, title: "Sofia Marquez: More info needed", body: "Follow-up documents requested · Text alert sent", unread: true },
  { t: "12m", c: "app" as const, title: "Approved: Daniel Okafor", body: "AI confidence 92% · Attorney signed off", unread: true },
  { t: "1h", c: "email" as const, title: "Weekly summary", body: "47 cases processed · Compliance team updated", unread: false },
  { t: "3h", c: "app" as const, title: "Pipeline completed", body: "Rohan Patel O-1 · Consistency check flagged 1 item", unread: false },
];

const iconMap = { email: Mail, sms: MessageSquare, app: Bell };
const channelLabel = { email: "Email", sms: "SMS", app: "In-app" };

function NotificationList({ filter }: { filter?: "email" | "sms" | "app" }) {
  const list = filter ? items.filter((i) => i.c === filter) : items;
  return (
    <ScrollArea className="h-[min(480px,55vh)] pr-4">
      <div className="relative space-y-1">
        <div className="absolute bottom-2 left-5 top-2 w-px bg-border" />
        {list.map((i) => {
          const Icon = iconMap[i.c];
          return (
            <button
              key={i.title}
              type="button"
              onClick={() => toast.success(i.title, { description: i.body })}
              className={`relative flex w-full gap-4 rounded-xl border border-transparent p-4 text-left transition hover:border-border/40 hover:bg-white/[0.03] ${i.unread ? "border-primary/20 bg-primary/5" : ""}`}
            >
              <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-border/60 glass">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{i.title}</span>
                    {i.unread && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{i.t} ago</span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{i.body}</p>
                <Badge variant="secondary" className="mt-2">
                  {channelLabel[i.c]}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function Notifications() {
  const unread = items.filter((i) => i.unread).length;

  return (
    <AppPage>
      <PageHeader
        portal="attorney"
        eyebrow="Activity"
        title="Notifications"
        description={`${unread} unread updates across email, SMS, and in-app alerts.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.message("All notifications marked read")}
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        }
      />

      <Tabs defaultValue="all">
        <TabsList className="glass h-10">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="app">In-app</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-base">Recent activity</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="pt-0">
              <NotificationList />
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
        <TabsContent value="email" className="mt-4">
          <GlassCard>
            <GlassCardContent className="pt-6">
              <NotificationList filter="email" />
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
        <TabsContent value="sms" className="mt-4">
          <GlassCard>
            <GlassCardContent className="pt-6">
              <NotificationList filter="sms" />
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
        <TabsContent value="app" className="mt-4">
          <GlassCard>
            <GlassCardContent className="pt-6">
              <NotificationList filter="app" />
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>

      <Separator />
      <p className="text-center text-xs text-muted-foreground">
        Click any notification to preview a toast — wired with shadcn Sonner.
      </p>
    </AppPage>
  );
}
