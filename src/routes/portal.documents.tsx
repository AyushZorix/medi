import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { AppPage } from "@/components/AppPage";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { PageHeader } from "@/components/PageHeader";
import { getApplicationBySlug, getMyApplications } from "@/lib/applications";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PipelineResults } from "@/components/PipelineResults";
import { Scale } from "lucide-react";

const searchSchema = z.object({
  slug: z.string().optional(),
});

export const Route = createFileRoute("/portal/documents")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "My documents — VisaIQ" }] }),
  component: PortalDocuments,
});

function PortalDocuments() {
  const { slug } = Route.useSearch();
  const { data: apps = [], isLoading: loadingApps } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

  const activeSlug = slug ?? apps[0]?.slug;

  const { data: application, isLoading } = useQuery({
    queryKey: ["application", activeSlug],
    queryFn: () => getApplicationBySlug(activeSlug!),
    enabled: Boolean(activeSlug),
  });

  if (loadingApps || isLoading) {
    return (
      <AppPage>
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      </AppPage>
    );
  }

  if (!application) {
    return (
      <AppPage>
        <PageHeader
          portal="applicant"
          title="No application yet"
          description="Start an application from your dashboard to see mandatory documents for your visa type."
        />
        <Button variant="gradient" asChild>
          <Link to="/portal">Go to dashboard</Link>
        </Button>
      </AppPage>
    );
  }

  return (
    <AppPage className="space-y-6">
      <PageHeader
        portal="applicant"
        eyebrow={application.visaType}
        title="Mandatory documents"
        description={`Upload every required document for your ${application.visaType} case. Progress updates automatically.`}
      />

      {apps.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {apps.map((a) => (
            <Button
              key={a.id}
              variant={a.slug === application.slug ? "gradient" : "glass"}
              size="sm"
              asChild
            >
              <Link to="/portal/documents" search={{ slug: a.slug }}>
                {a.visaType}
              </Link>
            </Button>
          ))}
        </div>
      )}

      {!application.forwardedToAttorney && (
        <Alert className="border-warning/40 bg-warning/10">
          <Scale className="size-4 text-warning" />
          <AlertTitle>Select an attorney first</AlertTitle>
          <AlertDescription>
            Choose a verified attorney on your dashboard before uploading documents. Your case is
            only forwarded after that step.
          </AlertDescription>
          <Button variant="gradient" size="sm" className="mt-3" asChild>
            <Link to="/portal">Choose attorney</Link>
          </Button>
        </Alert>
      )}

      {application.forwardedToAttorney && <DocumentChecklist application={application} />}
      <PipelineResults application={application} />
    </AppPage>
  );
}
