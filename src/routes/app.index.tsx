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
  const { displayName, user } = useAuth();
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

  const totalApps = applications.length;
  const docsReceivedAvg = totalApps > 0 ? Math.round(applications.reduce((sum, a) => sum + (a.progress?.documentsReceived ?? 0), 0) / totalApps) : 0;
  const idVerificationAvg = totalApps > 0 ? Math.round(applications.reduce((sum, a) => sum + (a.progress?.identityVerification ?? 0), 0) / totalApps) : 0;
  const financialReviewAvg = totalApps > 0 ? Math.round(applications.reduce((sum, a) => sum + (a.progress?.financialReview ?? 0), 0) / totalApps) : 0;
  const finalDecisionAvg = totalApps > 0 ? Math.round(applications.reduce((sum, a) => sum + (a.progress?.finalDecision ?? 0), 0) / totalApps) : 0;

  const processingSteps = [
    { label: "Extract documents", val: docsReceivedAvg, status: docsReceivedAvg === 100 ? "Done" : docsReceivedAvg > 0 ? "In progress" : "Waiting" },
    { label: "Check completeness", val: docsReceivedAvg, status: docsReceivedAvg === 100 ? "Done" : docsReceivedAvg > 0 ? "In progress" : "Waiting" },
    { label: "Verify consistency (AI)", val: financialReviewAvg, status: financialReviewAvg === 100 ? "Done" : financialReviewAvg > 0 ? "In progress" : "Waiting" },
    { label: "Validate rules (AI)", val: idVerificationAvg, status: idVerificationAvg === 100 ? "Done" : idVerificationAvg > 0 ? "In progress" : "Waiting" },
    { label: "Prepare decision", val: finalDecisionAvg, status: finalDecisionAvg === 100 ? "Done" : finalDecisionAvg > 0 ? "In progress" : "Waiting" },
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
            description={
              user?.attorneyVisaTypes?.length
                ? `Specializing in ${user.attorneyVisaTypes.join(", ")} | ${needsReview} case${needsReview === 1 ? "" : "s"} waiting for review.`
                : `${needsReview} application${needsReview === 1 ? "" : "s"} waiting for review across F-1, O-1, and B visas.`
            }
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
            <Alert className="glass border-warning/25 bg-warning/[0.03] text-warning-foreground shadow-[0_0_20px_rgba(245,158,11,0.03)]">
              <AlertTitle className="font-semibold tracking-wide">
                {needsReview} case{needsReview === 1 ? "" : "s"} require attorney review
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground/90 font-light mt-1">
                Open the applications queue to review documents, process details, and execute the AI pipeline check.
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

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <GlassCard className="h-full border-white/[0.04]">
              <GlassCardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <GlassCardTitle className="text-lg font-bold">Recent cases</GlassCardTitle>
                    <GlassCardDescription className="text-xs font-light">Latest applications and pipeline reviews</GlassCardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 bg-white/[0.02] border border-white/[0.05] rounded-full px-2.5 py-1">
                    <span className="size-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_var(--color-success)]" />
                    Live pipeline
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <div className="space-y-1">
                  {isLoading && (
                    <p className="py-8 text-center text-sm text-muted-foreground">Loading applications…</p>
                  )}
                  {!isLoading && feed.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">No applications in queue yet.</p>
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
                        className="-mx-2 flex items-center gap-4 rounded-xl px-3 py-3 bg-transparent hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04] transition-all duration-200"
                      >
                        <Avatar className="size-9 border border-white/[0.08]">
                          <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                            {f.applicantName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium tracking-tight">
                            {f.applicantName}
                          </div>
                          <div className="text-[11px] text-muted-foreground/80 font-light mt-0.5">Updated {f.updated}</div>
                        </div>
                        <VisaBadge type={f.visaType} />
                        <div className="hidden w-24 sm:block select-none">
                          <div className="mb-1 text-[10px] text-muted-foreground font-light">Confidence {f.score}%</div>
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
            <GlassCard className="h-full border-white/[0.04]">
              <GlassCardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <GlassCardTitle className="text-base font-bold">Pipeline analytics</GlassCardTitle>
                  <Activity className="size-4 text-primary animate-pulse" />
                </div>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4.5 pt-0">
                {processingSteps.map((s) => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-light">
                      <span>{s.label}</span>
                      <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">{s.status}</span>
                    </div>
                    <ScoreBar
                      value={s.val}
                      tone={s.val === 100 ? "success" : s.val > 0 ? "aurora" : "default"}
                    />
                  </div>
                ))}
                <Separator className="bg-white/[0.05] my-2" />
                <div className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground select-none">AI Confidence rating</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold tracking-tight text-gradient">{avgScore}</div>
                  <div className="text-[10px] text-success font-medium bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                    Average Score
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </AppPage>
  );
}
