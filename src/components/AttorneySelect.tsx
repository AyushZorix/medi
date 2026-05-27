import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scale, Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";

import { listVerifiedAttorneys } from "@/lib/attorneys";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type AttorneySelectProps = {
  value: string;
  onChange: (attorneyId: string) => void;
  disabled?: boolean;
};

export function AttorneySelect({ value, onChange, disabled }: AttorneySelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: attorneys = [], isLoading, isError } = useQuery({
    queryKey: ["verified-attorneys"],
    queryFn: listVerifiedAttorneys,
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading verified attorneys…
      </p>
    );
  }

  if (isError || attorneys.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No verified attorneys are available yet. Please try again later or contact support.
      </p>
    );
  }

  const filteredAttorneys = attorneys.filter((attorney) => {
    const term = searchTerm.toLowerCase();
    return (
      attorney.fullName.toLowerCase().includes(term) ||
      attorney.specialty.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="flex items-center gap-2">
          <Scale className="size-3.5" /> Choose your immigration attorney
        </Label>
        <p className="text-xs text-muted-foreground">
          Your case is forwarded only to the attorney you select. They will review it after AI
          validation.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search attorney by name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-border/60 bg-muted/30 pl-9 h-9"
        />
      </div>

      {filteredAttorneys.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No verified attorneys match your search.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAttorneys.map((attorney) => {
            const active = value === attorney.id;
            return (
              <motion.button
                key={attorney.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(attorney.id)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                className={cn(
                  "landing-card rounded-xl p-4 text-left transition-all duration-300",
                  active
                    ? "border-[var(--landing-accent)]/50 bg-white/[0.08] shadow-glow"
                    : "bg-white/[0.02] border-white/5 opacity-90 hover:opacity-100",
                )}
              >
                <p className="text-sm font-medium">
                  {attorney.fullName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{attorney.specialty}</p>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
