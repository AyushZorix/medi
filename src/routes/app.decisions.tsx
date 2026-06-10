import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApplications } from "@/lib/applications";
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

function Decisions() {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
  });

  const decisions = applications.map((a) => {
    const hasBeenReviewed = a.humanReview?.reviewedAt;
    const reviewer = hasBeenReviewed
      ? (a.attorneyName ?? "Attorney")
      : (a.pipeline?.status === "awaiting_human" || a.pipeline?.status === "completed")
        ? "AI Pipeline"
        : "System";

    const formattedTime = a.updatedAt
      ? new Date(a.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
      : a.updated || "—";

    return {
      id: a.slug,
      name: a.applicantName,
      visa: a.visaType,
      status: a.status,
      score: a.score,
      reviewer,
      time: formattedTime,
    };
  });

  if (isLoading) {
    return (
      <AppPage>
        <p className="text-sm text-muted-foreground">Loading decision logs...</p>
      </AppPage>
    );
  }

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

function DecisionTable({ rows }: { rows: any[] }) {
  const [filterText, setFilterText] = useState("");
  const filteredRows = rows.filter((r) =>
    r.name.toLowerCase().includes(filterText.toLowerCase()) ||
    r.id.toLowerCase().includes(filterText.toLowerCase()) ||
    r.visa.toLowerCase().includes(filterText.toLowerCase())
  );
  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Filter by applicant, case ID, or visa type…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-sm h-10 border-border/60 bg-muted/40"
        />
      </div>
      <GlassCard className="overflow-hidden p-0 border-border/40 shadow-glow">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent bg-muted/20">
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4 pl-6">Applicant Name</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Visa Category</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Status</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Confidence Score</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Reviewer</TableHead>
              <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4 pr-6">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  No decisions found matching the active filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((r) => (
                <TableRow key={r.id} className="border-border/40 hover:bg-muted/30 transition-colors duration-200">
                  <TableCell className="py-3.5 pl-6">
                    <Link
                      to="/app/applications/$id"
                      params={{ id: r.id }}
                      className="font-semibold hover:text-primary transition-colors text-sm"
                    >
                      {r.name}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <VisaBadge type={r.visa} />
                  </TableCell>
                  <TableCell className="py-3.5">
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold text-sm py-3.5">{r.score}%</TableCell>
                  <TableCell className="text-muted-foreground/90 py-3.5 font-light">{r.reviewer}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground/80 py-3.5 pr-6 font-light">{r.time}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>
    </>
  );
}
