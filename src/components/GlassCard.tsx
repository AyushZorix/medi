import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "border-border/80 bg-card/80 shadow-sm backdrop-blur-md transition-[border-color,box-shadow,transform] duration-300 hover:border-border hover:shadow-md",
  {
    variants: {
      intensity: {
        default: "",
        strong: "shadow-md",
      },
    },
    defaultVariants: {
      intensity: "default",
    },
  },
);

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof glassCardVariants>;

function GlassCard({ className, intensity, ...props }: GlassCardProps) {
  return <Card className={cn(glassCardVariants({ intensity }), className)} {...props} />;
}

export {
  GlassCard,
  CardContent as GlassCardContent,
  CardDescription as GlassCardDescription,
  CardFooter as GlassCardFooter,
  CardHeader as GlassCardHeader,
  CardTitle as GlassCardTitle,
};
