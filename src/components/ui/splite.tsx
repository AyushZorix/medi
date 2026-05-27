import { Suspense, lazy } from "react";

import { cn } from "@/lib/utils";

const Spline = lazy(() => import("@splinetool/react-spline"));

export interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <span className="loader" aria-label="Loading 3D scene" />
        </div>
      }
    >
      <Spline scene={scene} className={cn("h-full w-full", className)} />
    </Suspense>
  );
}
