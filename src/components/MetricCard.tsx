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
        className="h-full border-white/[0.04]"
      >
        <GlassCardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground select-none">
                {label}
              </div>
              <p className="mt-2.5 text-2xl font-bold tracking-tight md:text-3xl text-gradient">
                {value}
              </p>
              {hint && <p className="mt-2 text-[10px] text-muted-foreground/80 font-light">{hint}</p>}
            </div>
            <motion.div
              animate={{
                scale: isHovered ? 1.15 : 1,
                rotate: isHovered ? 8 : 0,
              }}
              transition={{ type: "spring", stiffness: 350, damping: 15 }}
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.02] transition-all duration-300",
                isHovered ? "bg-primary/20 border-primary/45 shadow-[0_0_15px_-3px_var(--primary)]" : ""
              )}
            >
              <Icon className={cn("size-4 text-primary transition-colors", iconClassName)} />
            </motion.div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}
