import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Download } from "lucide-react";

import { AppPage } from "@/components/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/app/decisions")({
  head: () => ({ meta: [{ title: "Decisions — VisaIQ" }] }),
  component: Decisions,
});

const decisions = [
  { id: "amelia-chen", name: "Amelia Chen", visa: "F-1", status: "approved" as const, score: 96, reviewer: "Jordan A.", time: "Mar 14, 11:42" },
  { id: "yuki-tanaka", name: "Yuki Tanaka", visa: "O-1", status: "rejected" as const, score: 42, reviewer: "Taylor M.", time: "Mar 14, 10:18" },
  { id: "sofia-marquez", name: "Sofia Marquez", visa: "B-2", status: "needs_info" as const, score: 71, reviewer: "AI + Jordan", time: "Mar 14, 09:55" },
  { id: "daniel-okafor", name: "Daniel Okafor", visa: "F-1", status: "approved" as const, score: 92, reviewer: "Jordan A.", time: "Mar 13, 18:02" },
  { id: "liam-oconnor", name: "Liam O'Connor", visa: "B-1", status: "approved" as const, score: 89, reviewer: "System", time: "Mar 13, 14:30" },
];

function Decisions() {
  return (
    <AppPage>
      <PageHeader
        portal="attorney"
        eyebrow="Audit trail"
        title="Decision log"
        description="Every approval, rejection, and info request — timestamped and exportable."
        actions={
          <Button variant="outline" size="sm">
            <Download className="size-3.5" /> Export CSV
          </Button>
        }
      />

      <Alert className="glass border-primary/30 bg-primary/5">
        <Gavel className="size-4 text-primary" />
        <AlertTitle>Full audit mode enabled</AlertTitle>
        <AlertDescription>
          All decisions include AI reasoning snapshots, rule evaluations, and attorney sign-off metadata.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="all">
        <TabsList className="glass h-10">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="needs_info">Needs info</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <DecisionTable rows={decisions} />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <DecisionTable rows={decisions.filter((d) => d.status === "approved")} />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <DecisionTable rows={decisions.filter((d) => d.status === "rejected")} />
        </TabsContent>
        <TabsContent value="needs_info" className="mt-4">
          <DecisionTable rows={decisions.filter((d) => d.status === "needs_info")} />
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}

function DecisionTable({ rows }: { rows: typeof decisions }) {
  return (
    <>
      <div className="mb-4">
        <Input placeholder="Filter by applicant or case ID…" className="max-w-sm h-10 border-border/60 bg-muted/40" />
      </div>
      <GlassCard className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Applicant</TableHead>
              <TableHead>Visa</TableHead>
              <TableHead>Decision</TableHead>
              <TableHead>AI score</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="border-border/30 hover:bg-white/[0.03]">
                <TableCell>
                  <Link
                    to="/app/applications/$id"
                    params={{ id: r.id }}
                    className="font-medium hover:text-primary"
                  >
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <VisaBadge type={r.visa} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="tabular-nums">{r.score}%</TableCell>
                <TableCell className="text-muted-foreground">{r.reviewer}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{r.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>
    </>
  );
}
