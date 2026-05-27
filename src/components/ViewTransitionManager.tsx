import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { disposeAll } from "@/lib/disposables";

/** Disposes WebGL scenes and heavy listeners before SPA navigation. */
export function ViewTransitionManager() {
  const router = useRouter();

  useEffect(() => {
    return router.subscribe("onBeforeNavigate", () => {
      disposeAll();
    });
  }, [router]);

  return null;
}
