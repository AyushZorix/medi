import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        approved: "bg-success/10 text-success border-success/30",
        processing: "bg-primary/10 text-primary border-primary/30",
        needs_info: "bg-warning/10 text-warning border-warning/30",
        rejected: "bg-destructive/10 text-destructive border-destructive/30",
        visa_f1: "bg-indigo/15 text-indigo border-indigo/30 font-mono text-[10px] tracking-tight",
        visa_o1: "bg-violet/15 text-violet border-violet/30 font-mono text-[10px] tracking-tight",
        visa_b1: "bg-teal/15 text-teal border-teal/30 font-mono text-[10px] tracking-tight",
        visa_b2: "bg-warning/10 text-warning border-warning/30 font-mono text-[10px] tracking-tight",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
