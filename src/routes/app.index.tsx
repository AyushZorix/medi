import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Brain,
  ArrowUpRight,
  Activity,
  Users,
  AlertTriangle,
  RotateCcw,
  FileText,
  CheckCircle2,
  Calendar,
  ChevronRight,
  HelpCircle,
  XCircle,
  Plus,
  Loader2,
  ArrowRight,
  Check,
  Search,
  FileSpreadsheet,
  Download,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { AppPage } from "@/components/AppPage";
import { listApplications } from "@/lib/applications";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/ScoreBar";
import { Input } from "@/components/ui/input";
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/GlassCard";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — VisaIQ" }] }),
  component: Dashboard,
});

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
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
      stiffness: 100,
      damping: 15,
    },
  },
};

export function Dashboard() {
  const { displayName, user } = useAuth();
  const firstName = displayName.split(/\s+/)[0] ?? displayName;
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
  });

  const [selectedClient, setSelectedClient] = useState("");
  const [openQaIndex, setOpenQaIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATS COMPUTATION ---
  const totalApps = applications.length;
  const approvedApps = applications.filter((a) => a.status === "approved");
  const rejectedApps = applications.filter((a) => a.status === "rejected");
  const pendingApps = applications.filter((a) => a.status === "processing" || a.status === "needs_info");
  const needsReview = applications.filter((a) => a.status === "needs_info" || a.status === "processing").length;

  const successRate = totalApps > 0 ? Math.round((approvedApps.length / totalApps) * 100) : 0;
  const rejectionRate = totalApps > 0 ? Math.round((rejectedApps.length / totalApps) * 100) : 0;
  const pendingRate = totalApps > 0 ? Math.round((pendingApps.length / totalApps) * 100) : 0;

  const avgScore =
    totalApps > 0
      ? Math.round(applications.reduce((sum, a) => sum + a.score, 0) / totalApps)
      : 0;

  // Filter application matching search
  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      app.applicantName.toLowerCase().includes(q) ||
      app.visaType.toLowerCase().includes(q) ||
      app.status.toLowerCase().includes(q) ||
      app.slug.toLowerCase().includes(q)
    );
  });

  // Unique applicants list
  const uniqueApplicants = Array.from(new Set(applications.map((a) => a.applicantName)));
  const totalClients = uniqueApplicants.length;

  if (!selectedClient && uniqueApplicants.length > 0) {
    setSelectedClient(uniqueApplicants[0]);
  }

  const repeatClients = Object.values(
    applications.reduce((acc, a) => {
      acc[a.applicantName] = (acc[a.applicantName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).filter((count) => count > 1).length;

  const highRiskClients = applications.filter((a) => a.score < 80 || a.status === "rejected").length;

  // Selected client apps
  const clientApps = applications.filter((a) => a.applicantName === selectedClient);
  const activeApp = clientApps[0];

  // Dynamic Case Lifecycle Stages
  const getDynamicLifecycleStages = () => {
    if (!activeApp) {
      return [
        { name: "Document Collection", est: "5 days", act: "—", status: "pending", delay: false },
        { name: "Filing", est: "10 days", act: "—", status: "pending", delay: false },
        { name: "Biometrics", est: "14 days", act: "—", status: "pending", delay: false },
        { name: "Interview", est: "7 days", act: "—", status: "pending", delay: false },
        { name: "Decision", est: "15 days", act: "—", status: "pending", delay: false },
      ];
    }

    const docProgress = activeApp.progress?.documentsReceived ?? 0;
    const finalDecisionProgress = activeApp.progress?.finalDecision ?? 0;
    const isApproved = activeApp.status === "approved";
    const isRejected = activeApp.status === "rejected";
    const isProcessing = activeApp.status === "processing";
    const isNeedsInfo = activeApp.status === "needs_info";

    // Stage 1: Document Collection
    let stage1Status = "pending";
    let stage1Act = "—";
    if (docProgress === 100) {
      stage1Status = "completed";
      stage1Act = "3 days";
    } else if (docProgress > 0) {
      stage1Status = "warning";
      stage1Act = `${Math.round(docProgress)}% uploaded`;
    } else {
      stage1Status = "warning";
      stage1Act = "Awaiting docs";
    }

    // Stage 2: Filing
    let stage2Status = "pending";
    let stage2Act = "—";
    if (docProgress === 100) {
      if (finalDecisionProgress >= 30 || isApproved || isRejected) {
        stage2Status = "completed";
        stage2Act = "8 days";
      } else {
        stage2Status = "warning";
        stage2Act = "Awaiting review";
      }
    }

    // Stage 3: Biometrics
    let stage3Status = "pending";
    let stage3Act = "—";
    let stage3Delay = false;
    let stage3Note = "";
    if (docProgress === 100) {
      if (isApproved || isRejected) {
        stage3Status = "completed";
        stage3Act = "12 days";
      } else if (finalDecisionProgress >= 30) {
        stage3Status = "warning";
        stage3Act = "22 days";
        stage3Delay = true;
        stage3Note = "Biometrics Delay";
      }
    }

    // Stage 4: Interview
    let stage4Status = "pending";
    let stage4Act = "—";
    if (isApproved || isRejected) {
      stage4Status = "completed";
      stage4Act = "6 days";
    } else if (isProcessing && finalDecisionProgress >= 50) {
      stage4Status = "warning";
      stage4Act = "In progress";
    }

    // Stage 5: Decision
    let stage5Status = "pending";
    let stage5Act = "—";
    if (isApproved) {
      stage5Status = "completed";
      stage5Act = "Approved";
    } else if (isRejected) {
      stage5Status = "warning";
      stage5Act = "Rejected";
    } else if (isNeedsInfo) {
      stage5Status = "warning";
      stage5Act = "Needs info";
    }

    return [
      { name: "Document Collection", est: "5 days", act: stage1Act, status: stage1Status, delay: stage1Status === "warning" && docProgress < 100, note: docProgress < 100 ? "Pending docs" : "" },
      { name: "Filing", est: "10 days", act: stage2Act, status: stage2Status, delay: stage2Status === "warning", note: stage2Status === "warning" ? "Awaiting review" : "" },
      { name: "Biometrics", est: "14 days", act: stage3Act, status: stage3Status, delay: stage3Delay, note: stage3Note },
      { name: "Interview", est: "7 days", act: stage4Act, status: stage4Status, delay: false },
      { name: "Decision", est: "15 days", act: stage5Act, status: stage5Status, delay: isRejected, note: isRejected ? "Rejected" : isNeedsInfo ? "Additional info" : "" },
    ];
  };

  const lifecycleStages = getDynamicLifecycleStages();

  // Success Rates by Visa Type calculation
  const getVisaSuccessRate = (visaType: string) => {
    const apps = applications.filter((a) => a.visaType === visaType);
    if (apps.length === 0) {
      // Default standard rates if empty
      if (visaType === "O-1") return "80%";
      if (visaType === "F-1") return "68%";
      if (visaType === "B-1/B-2") return "75%";
      return "70%";
    }
    const approved = apps.filter((a) => a.status === "approved").length;
    return `${Math.round((approved / apps.length) * 100)}%`;
  };

  // Dynamic Case Pipeline Kanban Swimlanes
  const kanbanStages = [
    { title: "Filed", count: applications.filter(a => a.status === "processing" && (a.progress?.documentsReceived ?? 0) < 100).length, status: "filed", items: applications.filter(a => a.status === "processing" && (a.progress?.documentsReceived ?? 0) < 100).slice(0, 2), extra: Math.max(0, applications.filter(a => a.status === "processing" && (a.progress?.documentsReceived ?? 0) < 100).length - 2) },
    { title: "Under Review", count: applications.filter(a => a.status === "processing" && (a.progress?.documentsReceived ?? 0) === 100).length, status: "review", items: applications.filter(a => a.status === "processing" && (a.progress?.documentsReceived ?? 0) === 100).slice(0, 2), extra: Math.max(0, applications.filter(a => a.status === "processing" && (a.progress?.documentsReceived ?? 0) === 100).length - 2) },
    { title: "RFE / Add. Info", count: applications.filter(a => a.status === "needs_info").length, status: "rfe", items: applications.filter(a => a.status === "needs_info").slice(0, 2), extra: Math.max(0, applications.filter(a => a.status === "needs_info").length - 2) },
    { title: "Approved", count: applications.filter(a => a.status === "approved").length, status: "approved", items: applications.filter(a => a.status === "approved").slice(0, 2), extra: Math.max(0, applications.filter(a => a.status === "approved").length - 2) },
    { title: "Rejected", count: applications.filter(a => a.status === "rejected").length, status: "rejected", items: applications.filter(a => a.status === "rejected").slice(0, 2), extra: Math.max(0, applications.filter(a => a.status === "rejected").length - 2) },
  ];

  // Document Tracker counts
  const totalUploadedDocs = applications.reduce((sum, a) => sum + (a.documentsSummary?.mandatoryUploaded ?? 0), 0);
  const totalMandatoryDocs = applications.reduce((sum, a) => sum + (a.documentsSummary?.mandatoryTotal ?? 0), 0);
  const totalMissingDocs = totalMandatoryDocs - totalUploadedDocs;

  // Upcoming Deadlines
  const rfeCases = applications.filter((a) => a.status === "needs_info");

  return (
    <AppPage className="space-y-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 max-w-7xl mx-auto"
      >
        {/* TOP HEADER BLOCK */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Welcome back, Attorney {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Here's what's happening with your practice today.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cases, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9.5 text-xs bg-muted/30 border-border/60 hover:bg-muted/40 transition-colors focus:ring-primary/20"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9.5 text-xs font-semibold gap-1.5 border-border/60 shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
              onClick={() => {
                const text = JSON.stringify(applications, null, 2);
                const blob = new Blob([text], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `VisaIQ_Report_${new Date().toISOString().split("T")[0]}.json`;
                a.click();
              }}
            >
              <Download className="size-3.5" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* 6 METRIC CARDS ROW */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
          <GlassCard className="p-4 relative overflow-hidden flex flex-col justify-between min-h-[105px] border-border/40 hover:border-border/80 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Applications</span>
              <div className="size-7 rounded-lg bg-indigo/10 flex items-center justify-center">
                <FileText className="size-4 text-indigo" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-extrabold text-foreground">{totalApps}</div>
              <p className="text-[9px] font-bold text-success mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="size-3" /> +12% vs last month
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-4 relative overflow-hidden flex flex-col justify-between min-h-[105px] border-border/40 hover:border-border/80 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Accepted Cases</span>
              <div className="size-7 rounded-lg bg-success/10 flex items-center justify-center">
                <ShieldCheck className="size-4 text-success" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-extrabold text-foreground">{approvedApps.length}</div>
              <p className="text-[9px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider">
                {successRate}% Success Rate
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-4 relative overflow-hidden flex flex-col justify-between min-h-[105px] border-border/40 hover:border-border/80 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rejected Cases</span>
              <div className="size-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="size-4 text-destructive" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-extrabold text-foreground">{rejectedApps.length}</div>
              <p className="text-[9px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider">
                {rejectionRate}% Rejection Rate
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-4 relative overflow-hidden flex flex-col justify-between min-h-[105px] border-border/40 hover:border-border/80 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending Decision</span>
              <div className="size-7 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="size-4 text-warning" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-extrabold text-foreground">{pendingApps.length}</div>
              <p className="text-[9px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider">
                Awaiting Review
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-4 relative overflow-hidden flex flex-col justify-between min-h-[105px] border-border/40 hover:border-border/80 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Vetting Score</span>
              <div className="size-7 rounded-lg bg-violet/10 flex items-center justify-center">
                <Brain className="size-4 text-violet" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-extrabold text-foreground">{avgScore}%</div>
              <p className="text-[9px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider">
                AI Approval Probability
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-4 relative overflow-hidden flex flex-col justify-between min-h-[105px] border-border/40 hover:border-border/80 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Success Rate by Type</span>
              <div className="size-7 rounded-lg bg-teal/10 flex items-center justify-center">
                <Activity className="size-4 text-teal" />
              </div>
            </div>
            <div className="mt-1 flex flex-col gap-0.5 justify-center">
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span>O-1:</span> <span className="text-primary">{getVisaSuccessRate("O-1")}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span>F-1:</span> <span className="text-success">{getVisaSuccessRate("F-1")}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span>B-1:</span> <span className="text-warning">{getVisaSuccessRate("B-1/B-2")}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ROW 2: RECENT CASES TABLE & CHARTS OVERVIEW */}
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          {/* Recent Cases Card */}
          <GlassCard className="lg:col-span-2 p-5 border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <GlassCardHeader className="pb-3 p-0 flex flex-row items-center justify-between">
                <div>
                  <GlassCardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    <Activity className="size-4.5 text-primary" />
                    Recent cases
                  </GlassCardTitle>
                  <GlassCardDescription className="text-[10px] mt-0.5">
                    Case files submitted or updated in the queue
                  </GlassCardDescription>
                </div>
                <Button variant="ghost" size="xs" className="text-[10px] font-extrabold uppercase text-primary gap-1" asChild>
                  <Link to="/app/applications">
                    View All <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              </GlassCardHeader>

              <GlassCardContent className="p-0 pt-3">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
                        <th className="py-2.5 pb-2">Client Name</th>
                        <th className="py-2.5 pb-2">Visa Type</th>
                        <th className="py-2.5 pb-2">Case ID</th>
                        <th className="py-2.5 pb-2">Status</th>
                        <th className="py-2.5 pb-2 text-center">AI Score</th>
                        <th className="py-2.5 pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {isLoading && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            <Loader2 className="size-4.5 animate-spin mx-auto text-primary" />
                            <span className="text-[10px] block mt-1.5 font-bold">Querying databases...</span>
                          </td>
                        </tr>
                      )}
                      {!isLoading && filteredApps.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground font-semibold">
                            No cases found matching your search.
                          </td>
                        </tr>
                      )}
                      {!isLoading && filteredApps.slice(0, 5).map((app) => (
                        <tr key={app.id} className="hover:bg-muted/15 transition-colors group">
                          <td className="py-2.5 flex items-center gap-2">
                            <Avatar className="size-5.5 border border-border/30">
                              <AvatarFallback className="bg-gradient-primary text-[8px] font-bold text-primary-foreground">
                                {app.applicantName.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-foreground truncate max-w-[130px] group-hover:text-primary transition-colors">
                              {app.applicantName}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <VisaBadge type={app.visaType} />
                          </td>
                          <td className="py-2.5 font-mono text-[9px] text-muted-foreground/80">
                            {app.slug}
                          </td>
                          <td className="py-2.5">
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                              app.score >= 90
                                ? "bg-success/10 text-success"
                                : app.score >= 80
                                  ? "bg-primary/10 text-primary"
                                  : "bg-destructive/10 text-destructive"
                            }`}>
                              {app.score}%
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <Button variant="ghost" size="icon" className="size-6 cursor-pointer" asChild>
                              <Link to="/app/applications/$id" params={{ id: app.slug }}>
                                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCardContent>
            </div>
          </GlassCard>

          {/* Applications Overview (SVG line chart + donut) */}
          <GlassCard className="p-5 border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <GlassCardHeader className="pb-3 p-0">
                <GlassCardTitle className="text-sm font-extrabold text-foreground flex items-center justify-between">
                  <span>Applications Overview</span>
                  <span className="text-[10px] text-muted-foreground font-semibold bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">This Month</span>
                </GlassCardTitle>
                <GlassCardDescription className="text-[10px] mt-0.5">
                  Approval performance statistics
                </GlassCardDescription>
              </GlassCardHeader>

              <GlassCardContent className="p-0 pt-4 space-y-4">
                <div className="flex items-center justify-between gap-2.5">
                  {/* SVG line chart (Filings trend) */}
                  <div className="flex-1 bg-muted/5 border border-border/25 rounded-xl p-2.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">Filing trend</span>
                    <svg viewBox="0 0 160 80" className="w-full h-[70px]">
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.15"/>
                          <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M 0,65 Q 20,40 40,55 T 80,30 T 120,45 T 160,15 L 160,80 L 0,80 Z" fill="url(#trendGrad)" />
                      <path d="M 0,65 Q 20,40 40,55 T 80,30 T 120,45 T 160,15" fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2" />
                      <path d="M 0,75 Q 20,65 40,60 T 80,50 T 120,40 T 160,30" fill="none" stroke="rgb(34, 197, 94)" strokeWidth="1.5" strokeDasharray="3" />
                    </svg>
                  </div>

                  {/* SVG circular donut chart */}
                  <div className="shrink-0 flex flex-col items-center p-1.5 bg-muted/5 border border-border/25 rounded-xl">
                    <svg viewBox="0 0 100 100" className="size-20">
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--border)" strokeWidth="10" strokeOpacity="0.3" />
                      {/* Approved circle */}
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgb(34, 197, 94)" strokeWidth="10" strokeDasharray={`${238.76 * (successRate / 100)} 238.76`} strokeDashoffset="0" transform="rotate(-90 50 50)" strokeLinecap="round" />
                      {/* Rejected circle */}
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgb(239, 68, 68)" strokeWidth="10" strokeDasharray={`${238.76 * (rejectionRate / 100)} 238.76`} strokeDashoffset={-238.76 * (successRate / 100)} transform="rotate(-90 50 50)" strokeLinecap="round" />
                      {/* Pending circle */}
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgb(245, 158, 11)" strokeWidth="10" strokeDasharray={`${238.76 * (pendingRate / 100)} 238.76`} strokeDashoffset={-238.76 * ((successRate + rejectionRate) / 100)} transform="rotate(-90 50 50)" strokeLinecap="round" />
                      <text x="50" y="55" textAnchor="middle" className="font-extrabold text-[15px] fill-foreground">
                        {totalApps}
                      </text>
                    </svg>
                    <span className="text-[8px] font-extrabold text-muted-foreground mt-1 uppercase tracking-wide">Total cases</span>
                  </div>
                </div>

                {/* Legend breakdown */}
                <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold text-center">
                  <div className="p-1 rounded bg-success/5 border border-success/15 text-success">
                    Approved: {approvedApps.length} ({successRate}%)
                  </div>
                  <div className="p-1 rounded bg-destructive/5 border border-destructive/15 text-destructive">
                    Rejected: {rejectedApps.length} ({rejectionRate}%)
                  </div>
                  <div className="p-1 rounded bg-warning/5 border border-warning/15 text-warning">
                    Pending: {pendingApps.length} ({pendingRate}%)
                  </div>
                </div>
              </GlassCardContent>
            </div>
          </GlassCard>
        </motion.div>

        {/* ROW 3: KANBAN CASE PIPELINE & AI INSIGHTS */}
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          {/* Case Pipeline Kanban swimlanes */}
          <GlassCard className="lg:col-span-2 p-5 border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <GlassCardHeader className="pb-3 p-0">
                <GlassCardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <Activity className="size-4.5 text-indigo animate-pulse" />
                  Case pipeline
                </GlassCardTitle>
                <GlassCardDescription className="text-[10px] mt-0.5">
                  Live workflow pipeline and stage distributions
                </GlassCardDescription>
              </GlassCardHeader>

              <GlassCardContent className="p-0 pt-4">
                <div className="grid grid-cols-5 gap-2.5">
                  {kanbanStages.map((stage) => (
                    <div key={stage.title} className="bg-muted/10 border border-border/30 rounded-xl p-2 min-h-[170px] flex flex-col justify-between hover:bg-muted/20 transition-colors">
                      <div>
                        <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                          <strong className="text-[9px] font-extrabold text-foreground tracking-wide truncate max-w-[50px] md:max-w-[70px]">
                            {stage.title}
                          </strong>
                          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-muted text-muted-foreground border border-border/40">
                            {stage.count}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {stage.items.map((item) => (
                            <Link
                              key={item.id}
                              to="/app/applications/$id"
                              params={{ id: item.slug }}
                              className="block p-1.5 rounded-lg bg-card border border-border/40 shadow-sm hover:border-primary/50 hover:shadow-md transition-all text-[9px]"
                            >
                              <div className="font-extrabold text-foreground truncate max-w-[80px]">
                                {item.applicantName.split(" ")[0]}
                              </div>
                              <div className="flex items-center justify-between text-[7px] mt-1 text-muted-foreground font-semibold">
                                <VisaBadge type={item.visaType} className="scale-75 origin-left" />
                                <span>{item.score}%</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {stage.extra > 0 && (
                        <div className="text-center text-[7px] font-extrabold text-muted-foreground/85 border-t border-border/30 pt-1.5 mt-1 uppercase tracking-wide">
                          + {stage.extra} more
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </div>
          </GlassCard>

          {/* AI Insights & Recommendations (Beta) */}
          <GlassCard className="p-5 border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <GlassCardHeader className="pb-3 p-0">
                <GlassCardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <Brain className="size-4.5 text-violet animate-pulse" />
                  AI Insights & Recommendations
                </GlassCardTitle>
                <GlassCardDescription className="text-[10px] mt-0.5">
                  Predictive diagnostics on active caseload
                </GlassCardDescription>
              </GlassCardHeader>

              <GlassCardContent className="p-0 pt-4 space-y-3">
                {/* Rejection Reasons simple bars */}
                <div className="space-y-1.5 border-b border-border/30 pb-3">
                  <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide block">Top rejection drivers (General)</span>
                  <div className="space-y-1">
                    <div>
                      <div className="flex justify-between text-[8px] font-bold text-foreground">
                        <span>Insufficient Financial Proof</span>
                        <span>18 cases (37.5%)</span>
                      </div>
                      <ScoreBar value={37.5} tone="destructive" className="h-1 mt-0.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[8px] font-bold text-foreground">
                        <span>Inconsistent Information</span>
                        <span>12 cases (25.0%)</span>
                      </div>
                      <ScoreBar value={25} tone="aurora" className="h-1 mt-0.5" />
                    </div>
                  </div>
                </div>

                {/* AI alerts list */}
                <div className="space-y-2">
                  {highRiskClients > 0 && (
                    <div className="flex gap-2 p-2 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <div className="text-[9px] font-medium leading-normal">
                        <strong className="font-extrabold text-[10px] block">High Rejection Risk warnings</strong>
                        {highRiskClients} cases have a high risk of rejection. Ensure financial proof records are consistent.
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 p-2 rounded-xl bg-success/5 border border-success/15 text-success">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                    <div className="text-[9px] font-medium leading-normal">
                      <strong className="font-extrabold text-[10px] block">Success rate improvements</strong>
                      Caseload approval index holds at {successRate}%. Average AI vetting probability increased in line with OCR pipeline.
                    </div>
                  </div>

                  <div className="flex gap-2 p-2 rounded-xl bg-primary/5 border border-primary/15 text-primary">
                    <Brain className="size-4 shrink-0 mt-0.5" />
                    <div className="text-[9px] font-medium leading-normal">
                      <strong className="font-extrabold text-[10px] block">Premium processing tips</strong>
                      Suggest premium processing for active F-1 or O-1 applications facing delays under standard vetting.
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </div>
          </GlassCard>
        </motion.div>

        {/* ROW 4: DOCUMENT TRACKER & DEADLINES */}
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          {/* Document & Compliance Tracker */}
          <GlassCard className="lg:col-span-2 p-5 border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <GlassCardHeader className="pb-3 p-0">
                <GlassCardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <FileText className="size-4.5 text-teal" />
                  Document & Compliance Tracker
                </GlassCardTitle>
                <GlassCardDescription className="text-[10px] mt-0.5">
                  Mandatory file checklists and compliance states
                </GlassCardDescription>
              </GlassCardHeader>

              <GlassCardContent className="p-0 pt-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-muted/10 border border-border/20 p-3 rounded-xl text-center">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wide block">Total documents</span>
                    <strong className="text-base font-extrabold text-foreground mt-1.5 block">{totalMandatoryDocs}</strong>
                  </div>
                  <div className="bg-success/5 border border-success/15 p-3 rounded-xl text-center">
                    <span className="text-[8px] font-bold text-success uppercase tracking-wide block">Uploaded</span>
                    <strong className="text-base font-extrabold text-success mt-1.5 block">
                      {totalUploadedDocs} <span className="text-[9px] font-normal text-muted-foreground">({totalMandatoryDocs > 0 ? Math.round((totalUploadedDocs/totalMandatoryDocs)*100) : 0}%)</span>
                    </strong>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/15 p-3 rounded-xl text-center">
                    <span className="text-[8px] font-bold text-destructive uppercase tracking-wide block">Missing / Pending</span>
                    <strong className="text-base font-extrabold text-destructive mt-1.5 block">{totalMissingDocs}</strong>
                  </div>
                  <div className="bg-warning/5 border border-warning/15 p-3 rounded-xl text-center">
                    <span className="text-[8px] font-bold text-warning uppercase tracking-wide block">Expiring / Reviews</span>
                    <strong className="text-base font-extrabold text-warning mt-1.5 block">{needsReview}</strong>
                  </div>
                </div>
              </GlassCardContent>
            </div>
          </GlassCard>

          {/* Upcoming Deadlines */}
          <GlassCard className="p-5 border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <GlassCardHeader className="pb-3 p-0">
                <GlassCardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-4.5 text-warning" />
                  Upcoming Deadlines
                </GlassCardTitle>
                <GlassCardDescription className="text-[10px] mt-0.5">
                  Priority milestones needing attorney review
                </GlassCardDescription>
              </GlassCardHeader>

              <GlassCardContent className="p-0 pt-4 space-y-2.5">
                {rfeCases.length === 0 && (
                  <p className="text-[10px] text-muted-foreground font-semibold text-center py-4 bg-muted/5 border border-border/20 rounded-xl">
                    No urgent actions or RFEs pending today.
                  </p>
                )}
                {rfeCases.slice(0, 3).map((app, index) => {
                  const day = 14 + index * 2;
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-2 bg-muted/5 border border-border/25 rounded-xl hover:border-border/60 transition-colors">
                      <div className="size-10 rounded-lg bg-warning/10 border border-warning/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[8px] font-extrabold text-warning uppercase tracking-widest leading-none">Jun</span>
                        <strong className="text-sm font-extrabold text-warning leading-none mt-0.5">{day}</strong>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-foreground truncate">{app.applicantName}</span>
                          <VisaBadge type={app.visaType} className="scale-75 origin-right" />
                        </div>
                        <p className="text-[8px] text-muted-foreground/80 mt-0.5 font-semibold">
                          RFE Upload Checklist Review due (ID: {app.slug})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </GlassCardContent>
            </div>
          </GlassCard>
        </motion.div>

        {/* ROW 5: CLIENT INSIGHTS & Timeline dropdown */}
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          {/* Timeline and Case lifecycle bottleneck */}
          <GlassCard className="lg:col-span-2 p-5 border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <GlassCardHeader className="pb-3 p-0 flex flex-row items-center justify-between">
                <div>
                  <GlassCardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    <Users className="size-4.5 text-indigo" />
                    Client Insights & Timelines
                  </GlassCardTitle>
                  <GlassCardDescription className="text-[10px] mt-0.5">
                    Select a client to view their dynamic timelines and lifecycle state.
                  </GlassCardDescription>
                </div>
                {uniqueApplicants.length > 0 && (
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="bg-muted border border-border/50 text-[10px] rounded-lg px-2 py-1 font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    {uniqueApplicants.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                )}
              </GlassCardHeader>

              <GlassCardContent className="p-0 pt-4 space-y-5">
                {/* Small Metrics row for the selected client */}
                <div className="grid grid-cols-4 gap-2.5 text-center">
                  <div className="p-2 bg-muted/5 border border-border/20 rounded-xl">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">Unique Clients</span>
                    <strong className="text-sm font-extrabold text-foreground block mt-0.5">{totalClients}</strong>
                  </div>
                  <div className="p-2 bg-destructive/5 border border-destructive/15 rounded-xl">
                    <span className="text-[8px] font-bold text-destructive uppercase">High Risk</span>
                    <strong className="text-sm font-extrabold text-destructive block mt-0.5">{highRiskClients}</strong>
                  </div>
                  <div className="p-2 bg-teal/5 border border-teal/15 rounded-xl">
                    <span className="text-[8px] font-bold text-teal uppercase">Repeat Clients</span>
                    <strong className="text-sm font-extrabold text-foreground block mt-0.5">{repeatClients}</strong>
                  </div>
                  <div className="p-2 bg-violet/5 border border-violet/15 rounded-xl">
                    <span className="text-[8px] font-bold text-violet uppercase">Approval Prob.</span>
                    <strong className="text-sm font-extrabold text-foreground block mt-0.5">
                      {activeApp ? `${activeApp.score}%` : `${avgScore}%`}
                    </strong>
                  </div>
                </div>

                {/* Case lifecycle flowchart */}
                <div className="border border-border/30 rounded-xl p-4 bg-muted/5">
                  <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide block mb-3">
                    Active Vetting stages & bottlenecks {activeApp && `— ${activeApp.applicantName} (${activeApp.visaType})`}
                  </span>
                  
                  <div className="relative flex flex-col md:flex-row justify-between gap-4 md:items-center">
                    {/* Progress Connecting line */}
                    <div className="absolute top-4 left-4 md:left-0 md:top-4 w-0.5 md:w-full h-[85%] md:h-0.5 bg-border/40 z-0" />
                    
                    {lifecycleStages.map((stage, i) => {
                      const isWarning = stage.status === "warning";
                      const isCompleted = stage.status === "completed";
                      return (
                        <div key={stage.name} className="relative z-10 flex md:flex-col items-start md:items-center gap-2.5 flex-1 md:text-center">
                          {/* Dot indicator */}
                          <div className={`size-7 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ${
                            isWarning
                              ? "bg-destructive/10 border-destructive shadow-[0_0_10px_rgba(239,68,68,0.15)] text-destructive"
                              : isCompleted
                                ? "bg-success/20 border-success text-success"
                                : "bg-muted border-border/60 text-muted-foreground"
                          }`}>
                            {isWarning ? (
                              <AlertTriangle className="size-3.5 text-destructive animate-bounce" />
                            ) : isCompleted ? (
                              <Check className="size-3.5" />
                            ) : (
                              <span className="text-[9px] font-bold">{i + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex flex-col md:items-center min-w-0">
                            <span className="text-[10px] font-extrabold text-foreground leading-tight truncate max-w-[100px]">{stage.name}</span>
                            <div className="flex items-center gap-1 mt-0.5 text-[8px] text-muted-foreground font-semibold">
                              <span>Est: {stage.est}</span>
                              <span>·</span>
                              <span className={isWarning ? "text-destructive font-bold" : ""}>{stage.act}</span>
                            </div>
                            {isWarning && stage.note && (
                              <span className="mt-1 px-1.5 py-0.5 rounded-full text-[7px] font-extrabold uppercase tracking-wide bg-destructive/15 text-destructive border border-destructive/20 animate-pulse">
                                {stage.note}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Case Timelines for Selected Client */}
                <div className="space-y-3.5">
                  <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide block">Case History Timelines</span>
                  {clientApps.length === 0 && (
                    <p className="text-[10px] text-muted-foreground font-medium py-3 text-center bg-muted/5 border border-border/20 rounded-xl">
                      No timelines recorded.
                    </p>
                  )}
                  {clientApps.map((app, idx) => (
                    <div key={app.id} className="relative flex gap-3 pl-3">
                      {idx < clientApps.length - 1 && (
                        <div className="absolute top-5 left-5 w-0.5 h-[110%] bg-border/40" />
                      )}
                      <div className="size-4 rounded-full bg-primary/20 border border-primary flex items-center justify-center shrink-0 mt-1">
                        <span className="size-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 bg-muted/5 border border-border/20 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-border/40 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-foreground">{app.applicantName}</strong>
                            <VisaBadge type={app.visaType} />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            Case slug: <span className="font-mono text-[8px]">{app.slug}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[8px] text-muted-foreground uppercase font-bold block">Approval probability</span>
                            <strong className="text-xs font-bold text-foreground">{app.score}%</strong>
                          </div>
                          <StatusBadge status={app.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </div>
          </GlassCard>

          {/* Q&A panel */}
          <GlassCard className="p-5 border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <GlassCardHeader className="pb-3 p-0">
                <GlassCardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="size-4.5 text-indigo" />
                  Instant Q&A Assistant
                </GlassCardTitle>
                <GlassCardDescription className="text-[10px] mt-0.5">
                  Quick insights into caseload performance and high-priority actions
                </GlassCardDescription>
              </GlassCardHeader>

              <GlassCardContent className="p-0 pt-4 space-y-3">
                {/* Q1: How am I performing? */}
                <div className="border border-border/20 rounded-xl overflow-hidden bg-muted/5">
                  <button
                    onClick={() => setOpenQaIndex(openQaIndex === 0 ? null : 0)}
                    className="w-full p-3 flex items-center justify-between text-left text-[10px] font-extrabold text-foreground hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    <span>How am I performing?</span>
                    <ChevronRight className={`size-3.5 transform transition-transform duration-200 ${openQaIndex === 0 ? "rotate-90" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openQaIndex === 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 border-t border-border/10 text-[10px] text-muted-foreground leading-relaxed space-y-1.5 font-semibold">
                          <p>Your overall visa approval rating is <strong className="text-foreground">{successRate}%</strong> across all cases.</p>
                          <p>Average AI vetting score stands at <strong className="text-foreground">{avgScore}%</strong> with document processing turnaround under 1.5 days.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Q2: Which cases need attention? */}
                <div className="border border-border/20 rounded-xl overflow-hidden bg-muted/5">
                  <button
                    onClick={() => setOpenQaIndex(openQaIndex === 1 ? null : 1)}
                    className="w-full p-3 flex items-center justify-between text-left text-[10px] font-extrabold text-foreground hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    <span>Which cases need attention?</span>
                    <ChevronRight className={`size-3.5 transform transition-transform duration-200 ${openQaIndex === 1 ? "rotate-90" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openQaIndex === 1 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 border-t border-border/10 text-[10px] text-muted-foreground leading-relaxed space-y-1.5 font-semibold">
                          {needsReview > 0 ? (
                            <>
                              <p>You have <strong className="text-foreground">{needsReview}</strong> cases requiring action or document uploads:</p>
                              <div className="mt-1.5 space-y-1">
                                {applications.filter(a => a.status === "needs_info" || a.status === "processing").slice(0, 3).map(a => (
                                  <Link
                                    key={a.id}
                                    to="/app/applications/$id"
                                    params={{ id: a.slug }}
                                    className="flex items-center justify-between p-1.5 rounded bg-muted/20 hover:bg-muted/30 text-[9px] font-bold transition-all text-primary"
                                  >
                                    <span>{a.applicantName} ({a.visaType})</span>
                                    <ArrowRight className="size-3" />
                                  </Link>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p>All active cases are currently verified. No immediate reviews needed today!</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Q3: Where am I losing approvals? */}
                <div className="border border-border/20 rounded-xl overflow-hidden bg-muted/5">
                  <button
                    onClick={() => setOpenQaIndex(openQaIndex === 2 ? null : 2)}
                    className="w-full p-3 flex items-center justify-between text-left text-[10px] font-extrabold text-foreground hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    <span>Where am I losing approvals?</span>
                    <ChevronRight className={`size-3.5 transform transition-transform duration-200 ${openQaIndex === 2 ? "rotate-90" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openQaIndex === 2 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 border-t border-border/10 text-[10px] text-muted-foreground leading-relaxed space-y-2 font-semibold">
                          <p>Historical audit logs show consistency mismatches as the leading rejection drivers:</p>
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between font-bold text-[8px] text-foreground mb-0.5">
                                <span>OCR name discrepancies</span>
                                <span>45%</span>
                              </div>
                              <ScoreBar value={45} tone="destructive" className="h-1" />
                            </div>
                            <div>
                              <div className="flex justify-between font-bold text-[8px] text-foreground mb-0.5">
                                <span>Missing bank statements</span>
                                <span>35%</span>
                              </div>
                              <ScoreBar value={35} tone="aurora" className="h-1" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Q4: What should I do next? */}
                <div className="border border-border/20 rounded-xl overflow-hidden bg-muted/5">
                  <button
                    onClick={() => setOpenQaIndex(openQaIndex === 3 ? null : 3)}
                    className="w-full p-3 flex items-center justify-between text-left text-[10px] font-extrabold text-foreground hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    <span>What should I do next?</span>
                    <ChevronRight className={`size-3.5 transform transition-transform duration-200 ${openQaIndex === 3 ? "rotate-90" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openQaIndex === 3 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 border-t border-border/10 text-[10px] text-muted-foreground leading-relaxed space-y-1.5 font-semibold">
                          <p className="font-extrabold text-foreground mb-1">Recommended workflow queue:</p>
                          <ul className="space-y-1.5">
                            <li className="flex items-start gap-1.5">
                              <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                              <span>Check biometrics scheduling bottleneck for active applicants.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                              <span>Inspect new QuickSnip OCR extractions for O-1 contracts.</span>
                            </li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCardContent>
            </div>
          </GlassCard>
        </motion.div>

      </motion.div>
    </AppPage>
  );
}
