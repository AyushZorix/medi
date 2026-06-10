import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApplications } from "@/lib/applications";
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

const iconMap = { email: Mail, sms: MessageSquare, app: Bell };
const channelLabel = { email: "Email", sms: "SMS", app: "In-app" };

function NotificationList({ items, filter }: { items: any[]; filter?: "email" | "sms" | "app" }) {
  const list = filter ? items.filter((i) => i.c === filter) : items;
  
  if (list.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No notifications in this category.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[min(480px,55vh)] pr-4">
      <div className="relative space-y-1">
        <div className="absolute bottom-2 left-5 top-2 w-px bg-border" />
        {list.map((i) => {
          const Icon = iconMap[i.c];
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => toast.success(i.title, { description: i.body })}
              className={`relative flex w-full gap-4 rounded-xl border border-transparent p-4 text-left transition hover:border-border/40 hover:bg-muted/30 ${i.unread ? "border-primary/20 bg-primary/5" : ""}`}
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
                  <span className="shrink-0 text-xs text-muted-foreground">{i.t}</span>
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
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
  });

  const dynamicItems = applications.flatMap((a) => {
    const list = [];
    const timeText = a.updated || "just now";

    if (a.status === "approved") {
      list.push({
        id: `${a.id}-approved`,
        t: timeText,
        c: "email" as const,
        title: `Approved: ${a.applicantName}`,
        body: `${a.visaType} application approved · Outbound status call logged`,
        unread: false,
      });
    } else if (a.status === "rejected") {
      list.push({
        id: `${a.id}-rejected`,
        t: timeText,
        c: "sms" as const,
        title: `Rejected: ${a.applicantName}`,
        body: `${a.visaType} application rejected · Decision call completed`,
        unread: false,
      });
    }

    if (a.status === "needs_info") {
      list.push({
        id: `${a.id}-needs-info`,
        t: timeText,
        c: "sms" as const,
        title: `${a.applicantName}: Action Required`,
        body: `Attorney requested follow-up documents / notes`,
        unread: true,
      });
    }

    if (a.pipeline?.status === "awaiting_human") {
      list.push({
        id: `${a.id}-pipeline`,
        t: timeText,
        c: "app" as const,
        title: `Pipeline complete: ${a.applicantName}`,
        body: `${a.visaType} case · AI score ${a.score}% · Awaiting human review`,
        unread: true,
      });
    } else if (a.pipeline?.status === "running") {
      list.push({
        id: `${a.id}-running`,
        t: timeText,
        c: "app" as const,
        title: `Pipeline active: ${a.applicantName}`,
        body: `AI validator and consistency analysis in progress`,
        unread: true,
      });
    }

    return list;
  });

  const unread = dynamicItems.filter((i) => i.unread).length;

  if (isLoading) {
    return (
      <AppPage>
        <p className="text-sm text-muted-foreground">Loading notifications...</p>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <PageHeader
        portal="attorney"
        eyebrow="Activity"
        title="Notifications"
        description={`${unread} unread update${unread === 1 ? "" : "s"} across email, SMS, and in-app alerts.`}
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
              <NotificationList items={dynamicItems} />
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
        <TabsContent value="email" className="mt-4">
          <GlassCard>
            <GlassCardContent className="pt-6">
              <NotificationList items={dynamicItems} filter="email" />
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
        <TabsContent value="sms" className="mt-4">
          <GlassCard>
            <GlassCardContent className="pt-6">
              <NotificationList items={dynamicItems} filter="sms" />
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
        <TabsContent value="app" className="mt-4">
          <GlassCard>
            <GlassCardContent className="pt-6">
              <NotificationList items={dynamicItems} filter="app" />
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
