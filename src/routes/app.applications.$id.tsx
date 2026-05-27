import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";

import { AppPage } from "@/components/AppPage";
import { HumanReviewPanel } from "@/components/HumanReviewPanel";
import { getApplicationBySlug } from "@/lib/applications";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";

export const Route = createFileRoute("/app/applications/$id")({
  head: () => ({ meta: [{ title: "Application detail — VisaIQ" }] }),
  component: AppDetail,
});

function AppDetail() {
  const { id } = Route.useParams();
  const { data: application, isLoading, isError } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplicationBySlug(id),
  });

  if (isLoading) {
    return (
      <AppPage>
        <p className="text-sm text-muted-foreground">Loading case…</p>
      </AppPage>
    );
  }

  if (isError || !application) {
    return (
      <AppPage>
        <p className="text-sm text-muted-foreground">Application not found.</p>
      </AppPage>
    );
  }

  return (
    <AppPage className="space-y-6">
      <PageHeader
        portal="attorney"
        eyebrow={`Case ${application.slug}`}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {application.applicantName}
            <VisaBadge type={application.visaType} />
          </span>
        }
        description={`${application.documentsSummary?.mandatoryUploaded ?? 0}/${application.documentsSummary?.mandatoryTotal ?? 0} mandatory docs · Phone ${application.phoneNumber || "—"}`}
        actions={<StatusBadge status={application.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-base">Submitted documents</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-2 pt-0">
            {application.documents.map((doc) => (
              <div
                key={doc.docId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/40 p-3 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{doc.label}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {doc.fileName ? doc.fileName : "Missing"}
                </span>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>

        <HumanReviewPanel application={application} />
      </div>
    </AppPage>
  );
}
