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
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full cursor-pointer"
    >
      <GlassCard
        className={cn(
          "h-full transition-all duration-350 border-border/40",
          isHovered ? "bg-white/[0.06] border-white/20 shadow-glow" : "bg-white/[0.03]"
        )}
      >
        <GlassCardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground select-none">
                {label}
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl text-gradient">
                {value}
              </p>
              {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
            </div>
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? 12 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl border border-border/50 bg-primary/10 transition-colors duration-300",
                isHovered ? "bg-primary/20 border-primary/30" : ""
              )}
            >
              <Icon className={cn("size-4 text-primary", iconClassName)} />
            </motion.div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}
