import * as React from "react";
import { useState, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "glass relative overflow-hidden transition-[border-color,box-shadow,transform] duration-300 hover:border-white/25",
  {
    variants: {
      intensity: {
        default: "",
        strong: "glass-strong",
      },
    },
    defaultVariants: {
      intensity: "default",
    },
  },
);

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof glassCardVariants>;

function GlassCard({ className, intensity, children, ...props }: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <Card
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(glassCardVariants({ intensity }), className)}
      {...props}
    >
      {/* Background Spotlight overlay */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-100 transition-opacity duration-300 z-0"
          style={{
            background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, color-mix(in oklch, var(--primary) 12%, transparent), transparent 80%)`,
          }}
        />
      )}
      {/* Light border glow */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(100px circle at ${coords.x}px ${coords.y}px, color-mix(in oklch, var(--primary) 35%, transparent), transparent 80%)`,
            border: "1px solid transparent",
            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "destination-out",
            maskComposite: "exclude",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </Card>
  );
}

export {
  GlassCard,
  CardContent as GlassCardContent,
  CardDescription as GlassCardDescription,
  CardFooter as GlassCardFooter,
  CardHeader as GlassCardHeader,
  CardTitle as GlassCardTitle,
};
