import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scale, Loader2, Search, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import { listVerifiedAttorneys } from "@/lib/attorneys";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type AttorneySelectProps = {
  value: string;
  onChange: (attorneyId: string) => void;
  disabled?: boolean;
  visaType?: string | null;
};

export function AttorneySelect({ value, onChange, disabled, visaType }: AttorneySelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: attorneys = [], isLoading, isError } = useQuery({
    queryKey: ["verified-attorneys", debouncedSearch, visaType],
    queryFn: () => listVerifiedAttorneys(debouncedSearch, visaType ?? undefined),
    enabled: Boolean(visaType),
  });

  const hasNoAttorneys = attorneys.length === 0 && !searchTerm.trim();

  if (!visaType) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a visa type to see attorneys who specialize in that category.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading verified attorneys…
      </p>
    );
  }

  if (isError || (hasNoAttorneys && attorneys.length === 0)) {
    return (
      <p className="text-sm text-muted-foreground">
        No verified attorneys are available yet. Please try again later or contact support.
      </p>
    );
  }

  const filteredAttorneys = attorneys.filter((attorney) =>
    !searchTerm.trim() ||
    attorney.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attorney.specialty && attorney.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="flex items-center gap-2">
          <Scale className="size-3.5" /> Choose your immigration attorney
        </Label>
        <p className="text-xs text-muted-foreground">
          Showing attorneys who specialize in the selected visa type. Your case is forwarded only
          to the attorney you select.
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
                  "landing-card rounded-xl p-4 text-left transition-all duration-300 relative overflow-hidden",
                  active
                    ? "border-2 border-primary bg-primary/15 shadow-[0_0_20px_rgba(124,58,237,0.2)]"
                    : "bg-muted/30 border-border/50 dark:bg-white/[0.02] dark:border-white/5 opacity-90 hover:opacity-100",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {attorney.fullName}
                  </p>
                  {active && (
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{attorney.specialty}</p>
                {attorney.visaTypes?.length ? (
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {attorney.visaTypes.join(" · ")}
                  </p>
                ) : null}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
