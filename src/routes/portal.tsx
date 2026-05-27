import { createFileRoute, redirect } from "@tanstack/react-router";

import { UserPortalShell } from "@/components/UserPortalShell";
import { getSession, getUserRole, roleToPortal } from "@/lib/auth";

export const Route = createFileRoute("/portal")({
  beforeLoad: async ({ location }) => {
    if (import.meta.env.SSR) return;
    const user = await getSession();
    if (!user) {
      throw redirect({
        to: "/sign-in/applicant",
        search: { redirect: location.pathname },
      });
    }

    const role = getUserRole(user);
    if (roleToPortal(role) !== "applicant") {
      throw redirect({ to: "/app" });
    }
  },
  component: UserPortalShell,
});
