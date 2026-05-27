import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";

import { listApplications } from "@/lib/applications";

import { AppPage } from "@/components/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreBar } from "@/components/ScoreBar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/app/applications")({
  head: () => ({ meta: [{ title: "Applications — VisaIQ" }] }),
  component: Applications,
});

function Applications() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
  });

  return (
    <AppPage>
      <PageHeader portal="attorney" eyebrow="Case management" title="All applications" description="Search, filter, and open any applicant case in your queue." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, case ID, or country…"
            className="h-10 border-border/60 bg-muted/40 pl-9"
          />
        </div>
        <Tabs defaultValue="all" className="w-auto">
          <TabsList className="glass h-10">
            {(["All", "F-1", "O-1", "B-1", "B-2"] as const).map((t) => (
              <TabsTrigger key={t} value={t === "All" ? "all" : t.toLowerCase()}>
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="glass" className="h-10 shrink-0">
          <SlidersHorizontal className="size-3.5" /> Filters
        </Button>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider">Applicant</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Visa</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">AI score</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wider">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Loading applications…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No applications in the database yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id} className="border-border/30 hover:bg-white/[0.03]">
                <TableCell>
                  <Link
                    to="/app/applications/$id"
                    params={{ id: r.slug }}
                    className="flex items-center gap-3 font-medium"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-gradient-primary text-[11px] text-primary-foreground">
                        {r.applicantName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {r.applicantName}
                  </Link>
                </TableCell>
                <TableCell>
                  <VisaBadge type={r.visaType} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ScoreBar value={r.score} className="w-16" />
                    <span className="text-xs tabular-nums text-muted-foreground">{r.score}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{r.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>
    </AppPage>
  );
}
