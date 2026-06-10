import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { GlassCard, GlassCardContent } from "@/components/GlassCard";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  iconClassName?: string;
};

export function MetricCard({ label, value, hint, icon: Icon, iconClassName }: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full cursor-pointer"
    >
      <GlassCard
        className="h-full border-border/40 shadow-sm hover:shadow-glow hover:border-primary/30 transition-all duration-300"
      >
        <GlassCardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-xs md:text-sm font-bold tracking-widest uppercase text-muted-foreground/90 select-none">
                {label}
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl text-foreground bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent">
                {value}
              </p>
              {hint && <p className="mt-1.5 text-xs text-muted-foreground/85 font-normal">{hint}</p>}
            </div>
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
                y: isHovered ? -2 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-xl border border-border/50 bg-muted/25 transition-all duration-300",
                isHovered ? "bg-primary/20 border-primary/40 shadow-[0_0_24px_-2px_color-mix(in_oklch,var(--primary)_40%,transparent)]" : ""
              )}
            >
              <Icon className={cn("size-5.5 text-primary/90 transition-colors", isHovered ? "text-primary scale-105" : "", iconClassName)} />
            </motion.div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}
