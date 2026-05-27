import { Link, useRouter } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { disposeAll } from "@/lib/disposables";
import { withViewTransition } from "@/lib/viewTransition";

type TransitionLinkProps = ComponentProps<typeof Link>;

export function TransitionLink({ children, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();

  return (
    <Link
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (props.target === "_blank") return;

        e.preventDefault();
        const href = (e.currentTarget as HTMLAnchorElement).pathname;
        const search = (e.currentTarget as HTMLAnchorElement).search;
        const hash = (e.currentTarget as HTMLAnchorElement).hash;

        withViewTransition(() => {
          disposeAll();
          void router.history.push(href + search + hash);
        });
      }}
    >
      {children}
    </Link>
  );
}
