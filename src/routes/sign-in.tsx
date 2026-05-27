import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { LandingLayout } from "@/components/LandingLayout";
import { AuthUI } from "@/components/ui/auth-fuse";
import { getHomeForUser, getSession } from "@/lib/auth";

const signInSearchSchema = z.object({
  redirect: z.string().optional(),
  portal: z.enum(["attorney", "applicant"]).optional(),
});

export const Route = createFileRoute("/sign-in")({
  validateSearch: signInSearchSchema,
  head: () => ({ meta: [{ title: "Sign in — VisaIQ" }] }),
  beforeLoad: async () => {
    if (import.meta.env.SSR) return;
    const user = await getSession();
    if (user) {
      throw redirect({ to: getHomeForUser(user) });
    }
  },
  component: SignInPage,
});

function SignInPage() {
  const search = Route.useSearch();
  return (
    <LandingLayout shader={false} ocean={true} className="p-0 m-0 w-full min-h-screen">
      <AuthUI search={search} />
    </LandingLayout>
  );
}
