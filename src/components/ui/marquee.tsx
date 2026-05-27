import * as React from "react";

import { cn } from "@/lib/utils";

type MarqueeProps = React.HTMLAttributes<HTMLDivElement> & {
  pauseOnHover?: boolean;
  repeat?: number;
  vertical?: boolean;
};

export function Marquee({
  className,
  children,
  pauseOnHover = false,
  repeat = 3,
  vertical = false,
  ...props
}: MarqueeProps) {
  const items = Array.from({ length: repeat });

  return (
    <div
      className={cn(
        "group flex overflow-hidden",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
      {...props}
    >
      {items.map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex shrink-0 items-center justify-around gap-[var(--gap)]",
            vertical ? "animate-marquee-vertical flex-col" : "animate-marquee",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
