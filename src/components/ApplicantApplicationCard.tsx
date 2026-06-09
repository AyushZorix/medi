import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

import { progressSteps, type Application } from "@/lib/applications";
import { ScoreBar } from "@/components/ScoreBar";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ApplicantApplicationCardProps = {
  application: Application;
};

export function ApplicantApplicationCard({ application }: ApplicantApplicationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const steps = progressSteps(application);
  const { mandatoryUploaded, mandatoryTotal } = application.documentsSummary ?? {
    mandatoryUploaded: 0,
    mandatoryTotal: 0,
    complete: false,
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full"
    >
      <GlassCard
        className="h-full border-border/40"
      >
        <GlassCardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <GlassCardTitle className="select-none font-bold text-base">
                {`${application.visaType} Application`}
              </GlassCardTitle>
              <GlassCardDescription className="text-[11px] font-light mt-0.5">
                Case {application.slug} · {mandatoryUploaded}/{mandatoryTotal} documents
                {application.forwardedToAttorney && application.attorneyName
                  ? ` · Attorney: ${application.attorneyName}`
                  : " · Attorney not assigned"}
              </GlassCardDescription>
            </div>
            <div className="flex items-center gap-2">
              <VisaBadge type={application.visaType} />
              <StatusBadge status={application.status} />
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold tracking-tight">Overall progress</p>
              <p className="text-[11px] text-muted-foreground/80 font-light mt-0.5">
                {!application.forwardedToAttorney
                  ? "Select an attorney to forward your case"
                  : application.pipeline.status === "awaiting_human"
                    ? "Awaiting attorney approval"
                    : application.pipeline.status === "idle"
                      ? "Upload mandatory documents"
                      : "AI pipeline in progress"}
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-gradient">{application.overallProgress}%</p>
          </div>
          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{s.label}</span>
                  <span className="text-muted-foreground">{s.val}%</span>
                </div>
                <ScoreBar
                  value={s.val}
                  tone={s.val === 100 ? "success" : s.val > 0 ? "aurora" : "default"}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="glass"
              size="sm"
              asChild
            >
              <Link to="/portal/documents" search={{ slug: application.slug }}>
                Documents
                <ArrowUpRight className="ml-1 size-3.5" />
              </Link>
            </Button>
            <Button
              variant="glass"
              size="sm"
              asChild
            >
              <Link to="/portal/application" search={{ slug: application.slug }}>
                Details
                <ArrowUpRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}
