import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Upload, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

import { AppPage } from "@/components/AppPage";
import { ApplicantApplicationCard } from "@/components/ApplicantApplicationCard";
import { VisaApplyOptions } from "@/components/VisaApplyOptions";
import { getMyApplications } from "@/lib/applications";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/")({
  head: () => ({ meta: [{ title: "Applicant dashboard — VisaIQ" }] }),
  component: ApplicantDashboard,
});

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

function ApplicantDashboard() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const firstName = displayName.split(/\s+/)[0] ?? displayName;
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

  const needsAction = applications.some((a) => a.status === "needs_info");

  return (
    <AppPage>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            portal="applicant"
            eyebrow="Overview"
            title={`Welcome back, ${firstName}`}
            description={
              applications.length > 0
                ? "Continue your in-progress applications or start a new visa category below."
                : "Select a visa type to begin your application. Progress is saved automatically."
            }
            actions={
              applications.length > 0 ? (
                <Button variant="gradient" size="sm" className="rounded-full" asChild>
                  <Link to="/portal/documents">
                    Upload document <Upload className="size-3.5" />
                  </Link>
                </Button>
              ) : undefined
            }
          />
        </motion.div>

        {needsAction && (
          <motion.div variants={itemVariants}>
            <Alert className="glass border-warning/25 bg-warning/[0.03] text-warning-foreground shadow-[0_0_20px_rgba(245,158,11,0.03)]">
              <AlertTriangle className="size-4 text-warning" />
              <AlertTitle className="font-semibold tracking-wide">Action required</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground/90 font-light mt-1">
                One or more visa application cases require additional document uploads. Open the case below to submit outstanding items.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {isLoading && (
          <motion.p variants={itemVariants} className="text-sm text-muted-foreground/80 font-light">
            Syncing application data with MongoDB...
          </motion.p>
        )}

        {!isLoading && applications.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-gradient bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent select-none pl-1">Your cases</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              {applications.map((app) => (
                <ApplicantApplicationCard key={app.id} application={app} />
              ))}
            </div>
          </motion.section>
        )}

        <motion.div variants={itemVariants}>
          <GlassCard className="p-6 border-white/[0.04] shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
            <VisaApplyOptions
              existingApplications={applications}
              onStarted={(app) => {
                void navigate({
                  to: "/portal/documents",
                  search: { slug: app.slug },
                });
              }}
            />
          </GlassCard>
        </motion.div>
      </motion.div>
    </AppPage>
  );
}
