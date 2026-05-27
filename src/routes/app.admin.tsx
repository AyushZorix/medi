import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, UserCog, Scale, ArrowUpRight } from "lucide-react";

import { AppPage } from "@/components/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Attorney panel — VisaIQ" }] }),
  component: Admin,
});

const queue = [
  { id: "rohan-patel", name: "Rohan Patel", visa: "O-1", status: "processing" as const },
  { id: "sofia-marquez", name: "Sofia Marquez", visa: "B-2", status: "needs_info" as const },
  { id: "noor-al-sayed", name: "Noor Al-Sayed", visa: "O-1", status: "needs_info" as const },
];

const team = [
  { name: "Jordan Avery", role: "Lead reviewer", cases: 142, initials: "JA" },
  { name: "Taylor Morgan", role: "Attorney", cases: 98, initials: "TM" },
  { name: "Alex Kim", role: "Paralegal", cases: 67, initials: "AK" },
];

function Admin() {
  return (
    <AppPage>
      <PageHeader
        portal="attorney"
        eyebrow="Team management"
        title={
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-7 text-violet" /> Attorney controls
          </span>
        }
        description="Review AI decisions, override recommendations, and manage reviewer workload."
      />

      <Alert className="border-violet/30 bg-violet/10">
        <Scale className="size-4 text-violet" />
        <AlertTitle>Human-in-the-loop required</AlertTitle>
        <AlertDescription>
          3 cases are waiting for attorney sign-off before final notification is sent.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="queue">
        <TabsList className="glass h-10">
          <TabsTrigger value="queue">Review queue</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 space-y-4">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-base">Cases needing review</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3 pt-0">
              {queue.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline">{c.visa}</Badge>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <Button variant="gradient" size="sm" asChild>
                    <Link to="/app/applications/$id" params={{ id: c.id }}>
                      Review <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {team.map((m) => (
              <GlassCard key={m.name}>
                <GlassCardContent className="flex items-center gap-4 p-5">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-gradient-primary text-sm text-primary-foreground">
                      {m.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.role}</div>
                    <div className="mt-2 text-sm tabular-nums">{m.cases} active cases</div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <GlassCard className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Case</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-xs">
                {[
                  ["2026-03-14 11:42", "jordan.a", "approved", "#VIQ-2847"],
                  ["2026-03-14 10:18", "taylor.m", "override", "#VIQ-2839"],
                  ["2026-03-14 09:55", "system", "flagged", "#VIQ-2841"],
                  ["2026-03-13 18:02", "jordan.a", "note_added", "#VIQ-2812"],
                ].map(([ts, actor, action, caseId]) => (
                  <TableRow key={ts + caseId} className="border-border/30 hover:bg-white/[0.03]">
                    <TableCell className="text-muted-foreground">{ts}</TableCell>
                    <TableCell>{actor}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{action}</Badge>
                    </TableCell>
                    <TableCell>{caseId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          <UserCog className="size-3.5" /> Manage permissions
        </Button>
      </div>
    </AppPage>
  );
}
