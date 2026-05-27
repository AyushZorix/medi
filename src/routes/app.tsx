import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { getSession, getUserRole, roleToPortal } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    if (import.meta.env.SSR) return;
    const user = await getSession();
    if (!user) {
      throw redirect({
        to: "/sign-in/attorney",
        search: { redirect: location.pathname },
      });
    }

    if (roleToPortal(getUserRole(user)) !== "attorney") {
      throw redirect({ to: "/portal" });
    }
  },
  component: AppShell,
});
