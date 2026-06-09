import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ScoreBarProps = {
  value: number;
  className?: string;
  tone?: "default" | "success" | "aurora";
};

export function ScoreBar({ value, className, tone = "aurora" }: ScoreBarProps) {
  return (
    <div className={cn("relative h-2.5 w-full rounded-full bg-muted/40 border border-border/40 overflow-hidden", className)}>
      <motion.div
        className={cn(
          "relative h-full rounded-full transition-all duration-300",
          tone === "success" && "bg-success shadow-[0_0_12px_var(--color-success)]",
          tone === "aurora" && "bg-gradient-aurora shadow-[0_0_12px_rgba(108,93,211,0.5)]",
          tone === "default" && "bg-primary shadow-[0_0_12px_rgba(108,93,211,0.4)]"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {value > 0 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
        )}
      </motion.div>
    </div>
  );
}
