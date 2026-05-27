import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { useAuth } from "@/contexts/AuthContext";
import { getUserRole, roleToPortal, type PortalKind } from "@/lib/auth";

/** Client-side guard when SSR cannot read auth cookies */
export function useRequireAuth(portal: PortalKind) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      void navigate({
        to: portal === "attorney" ? "/sign-in/attorney" : "/sign-in/applicant",
        search: { redirect: pathname },
      });
      return;
    }

    if (roleToPortal(getUserRole(user)) !== portal) {
      void navigate({ to: portal === "attorney" ? "/portal" : "/app" });
    }
  }, [user, loading, navigate, pathname, portal]);
}
