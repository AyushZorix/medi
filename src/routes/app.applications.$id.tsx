import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppPage } from "@/components/AppPage";
import { HumanReviewPanel } from "@/components/HumanReviewPanel";
import { AttorneyDocumentChecklist } from "@/components/AttorneyDocumentChecklist";
import { getApplicationBySlug } from "@/lib/applications";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";

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
        <AttorneyDocumentChecklist application={application} />
        <HumanReviewPanel application={application} />
      </div>
    </AppPage>
  );
}
