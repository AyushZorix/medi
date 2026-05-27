import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Clock, ShieldCheck, Brain, ArrowUpRight, Activity } from "lucide-react";

import { AppPage } from "@/components/AppPage";
import { listApplications } from "@/lib/applications";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScoreBar } from "@/components/ScoreBar";
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — VisaIQ" }] }),
  component: Dashboard,
});

import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 14,
    },
  },
};

export function Dashboard() {
  const [hoveredFeedId, setHoveredFeedId] = useState<string | null>(null);
  const { displayName } = useAuth();
  const firstName = displayName.split(/\s+/)[0] ?? displayName;
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
  });

  const needsReview = applications.filter((a) => a.status === "needs_info" || a.status === "processing").length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const approvalRate =
    applications.length > 0 ? `${Math.round((approved / applications.length) * 100)}%` : "—";
  const avgScore =
    applications.length > 0
      ? `${Math.round(applications.reduce((sum, a) => sum + a.score, 0) / applications.length)}%`
      : "—";

  const dynamicMetrics = [
    { label: "Total applications", value: String(applications.length), hint: "From MongoDB", icon: TrendingUp, iconClassName: "text-indigo" },
    { label: "Approval rate", value: approvalRate, hint: `${approved} approved`, icon: ShieldCheck, iconClassName: "text-success" },
    { label: "Needs review", value: String(needsReview), hint: "Processing or pending docs", icon: Clock, iconClassName: "text-teal" },
    { label: "Avg AI score", value: avgScore, hint: "Across active cases", icon: Brain, iconClassName: "text-violet" },
  ];

  const feed = applications.slice(0, 6);

  return (
    <AppPage className="space-y-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            portal="attorney"
            eyebrow="Command center"
            title={`Good morning, ${firstName}`}
            description={`${needsReview} application${needsReview === 1 ? "" : "s"} waiting for review across F-1, O-1, and B visas.`}
            actions={
              <Button
                variant="gradient"
                size="sm"
                className="hidden sm:inline-flex transition-transform duration-200 active:scale-[0.98]"
                asChild
              >
                <Link to="/app/applications">
                  Add new case
                  <ArrowUpRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            }
          />
        </motion.div>

        {needsReview > 0 && (
          <motion.div variants={itemVariants}>
            <Alert className="border-warning/40 bg-warning/10">
              <AlertTitle>
                {needsReview} case{needsReview === 1 ? "" : "s"} need your review
              </AlertTitle>
              <AlertDescription>
                Open the applications queue to review processing and document requests.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {dynamicMetrics.map((m) => (
            <motion.div key={m.label} variants={itemVariants}>
              <MetricCard label={m.label} value={m.value} hint={m.hint} icon={m.icon} iconClassName={m.iconClassName} />
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <GlassCard className="h-full">
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <GlassCardTitle>Recent activity</GlassCardTitle>
                    <GlassCardDescription>Latest applications and decisions</GlassCardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-success animate-pulse" />
                    Live updates
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <div className="divide-y divide-border/40">
                  {isLoading && (
                    <p className="py-6 text-center text-sm text-muted-foreground">Loading applications…</p>
                  )}
                  {!isLoading && feed.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">No applications yet.</p>
                  )}
                  {feed.map((f) => (
                    <motion.div
                      key={f.id}
                      onMouseEnter={() => setHoveredFeedId(f.id)}
                      onMouseLeave={() => setHoveredFeedId(null)}
                      whileHover={{ x: 6 }}
                      whileTap={{ scale: 0.995 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    >
                      <Link
                        to="/app/applications/$id"
                        params={{ id: f.slug }}
                        className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 bg-transparent hover:bg-white/[0.03] transition-colors duration-200"
                      >
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-gradient-primary text-xs font-medium text-primary-foreground">
                            {f.applicantName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {f.applicantName}
                          </div>
                          <div className="text-xs text-muted-foreground">Updated {f.updated}</div>
                        </div>
                        <VisaBadge type={f.visaType} />
                        <div className="hidden w-24 sm:block">
                          <div className="mb-1 text-[10px] text-muted-foreground">AI {f.score}%</div>
                          <ScoreBar value={f.score} />
                        </div>
                        <StatusBadge status={f.status} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="h-full">
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <GlassCardTitle>Processing status</GlassCardTitle>
                  <Activity className="size-4 text-primary" />
                </div>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4 pt-0">
                {[
                  { label: "Extract documents", val: 100, status: "Done" },
                  { label: "Check completeness", val: 100, status: "Done" },
                  { label: "Verify consistency", val: 72, status: "In progress" },
                  { label: "Validate rules", val: 0, status: "Waiting" },
                  { label: "Prepare decision", val: 0, status: "Waiting" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span>{s.label}</span>
                      <span className="text-muted-foreground">{s.status}</span>
                    </div>
                    <ScoreBar
                      value={s.val}
                      tone={s.val === 100 ? "success" : s.val > 0 ? "aurora" : "default"}
                    />
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="text-xs text-muted-foreground">AI confidence score</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-semibold tracking-tight text-gradient">88.4%</div>
                  <div className="text-xs text-success">4.2% above average</div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </AppPage>
  );
}
