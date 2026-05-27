import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ScoreBarProps = {
  value: number;
  className?: string;
  tone?: "default" | "success" | "aurora";
};

export function ScoreBar({ value, className, tone = "aurora" }: ScoreBarProps) {
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-muted/40", className)}>
      <motion.div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          tone === "success" && "bg-success",
          tone === "aurora" && "bg-gradient-aurora",
          tone === "default" && "bg-primary"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
