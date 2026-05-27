import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { AppPage } from "@/components/AppPage";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { PageHeader } from "@/components/PageHeader";
import { PipelineResults } from "@/components/PipelineResults";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";
import { getApplicationBySlug, getMyApplications, progressSteps } from "@/lib/applications";
import { ScoreBar } from "@/components/ScoreBar";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";

const searchSchema = z.object({
  slug: z.string().optional(),
});

export const Route = createFileRoute("/portal/application")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "My application — VisaIQ" }] }),
  component: PortalApplication,
});

function PortalApplication() {
  const { slug } = Route.useSearch();
  const { data: myApps = [] } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

  const activeSlug = slug ?? myApps[0]?.slug;

  const { data: application, isLoading, isError } = useQuery({
    queryKey: ["application", activeSlug],
    queryFn: () => getApplicationBySlug(activeSlug!),
    enabled: Boolean(activeSlug),
  });

  if (!activeSlug) {
    return (
      <AppPage>
        <PageHeader
          portal="applicant"
          title="No application selected"
          description="Choose F-1, O-1, or B-1/B-2 on your dashboard to begin."
        />
        <Button variant="gradient" asChild>
          <Link to="/portal">Back to dashboard</Link>
        </Button>
      </AppPage>
    );
  }

  if (isLoading) {
    return (
      <AppPage>
        <p className="text-sm text-muted-foreground">Loading application…</p>
      </AppPage>
    );
  }

  if (isError || !application) {
    return (
      <AppPage>
        <PageHeader portal="applicant" title="Application not found" />
        <Button variant="gradient" asChild>
          <Link to="/portal">Back to dashboard</Link>
        </Button>
      </AppPage>
    );
  }

  const steps = progressSteps(application);

  return (
    <AppPage className="space-y-6">
      <PageHeader
        portal="applicant"
        eyebrow={`Case ${application.slug}`}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {application.visaType} application <VisaBadge type={application.visaType} />
          </span>
        }
        description={`${application.forwardedToAttorney ? `Attorney ${application.attorneyName}` : "Attorney not assigned"} · Phone ${application.phoneNumber || "—"} · ${application.documentsSummary?.mandatoryUploaded ?? 0}/${application.documentsSummary?.mandatoryTotal ?? 0} documents uploaded`}
        actions={<StatusBadge status={application.status} />}
      />

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-base">Live progress</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3 pt-0">
          {steps.map((s) => (
            <div key={s.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{s.label}</span>
                <span className="text-muted-foreground">{s.val}%</span>
              </div>
              <ScoreBar value={s.val} tone={s.val === 100 ? "success" : s.val > 0 ? "aurora" : "default"} />
            </div>
          ))}
        </GlassCardContent>
      </GlassCard>

      <DocumentChecklist application={application} />
      <PipelineResults application={application} />

      <Button variant="ghost" asChild>
        <Link to="/portal">← Dashboard</Link>
      </Button>
    </AppPage>
  );
}
