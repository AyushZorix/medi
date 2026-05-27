import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { LandingLayout } from "@/components/LandingLayout";
import { AuthUI } from "@/components/ui/auth-fuse";
import { getHomeForUser, getSession } from "@/lib/auth";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/sign-in/applicant")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Applicant sign in — VisaIQ" }] }),
  beforeLoad: async () => {
    if (import.meta.env.SSR) return;
    const user = await getSession();
    if (user) {
      throw redirect({ to: getHomeForUser(user) });
    }
  },
  component: ApplicantSignInPage,
});

function ApplicantSignInPage() {
  const search = Route.useSearch();
  return (
    <LandingLayout shader={true} className="p-0 m-0 w-full min-h-screen">
      <AuthUI search={search} portalLock="applicant" />
    </LandingLayout>
  );
}
