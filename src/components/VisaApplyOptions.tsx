import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plane, Star, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { AttorneySelect } from "@/components/AttorneySelect";
import { GlassCard } from "@/components/GlassCard";
import {
  APPLICANT_VISA_OPTIONS,
  startApplication,
  type ApplicantVisaChoice,
  type Application,
} from "@/lib/applications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const icons: Record<ApplicantVisaChoice, typeof GraduationCap> = {
  "F-1": GraduationCap,
  "O-1": Star,
  "B-1/B-2": Plane,
};

const OCEAN_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80";

function visaKey(visaType: string): ApplicantVisaChoice | null {
  if (visaType === "F-1" || visaType === "O-1" || visaType === "B-1/B-2") return visaType;
  if (visaType === "B-1" || visaType === "B-2") return "B-1/B-2";
  return null;
}

type VisaApplyOptionsProps = {
  existingApplications: Application[];
  onStarted?: (app: Application) => void;
};

export function VisaApplyOptions({ existingApplications, onStarted }: VisaApplyOptionsProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ApplicantVisaChoice>("F-1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [attorneyUserId, setAttorneyUserId] = useState("");
  const [hoveredOption, setHoveredOption] = useState<ApplicantVisaChoice | null>(null);

  const existingTypes = new Set(
    existingApplications
      .map((a) => visaKey(a.visaType))
      .filter((v): v is ApplicantVisaChoice => v !== null),
  );

  const existingApp = existingApplications.find((a) => visaKey(a.visaType) === selected);
  const needsAttorneyOnly = Boolean(existingApp && !existingApp.forwardedToAttorney);

  useEffect(() => {
    if (existingApp?.attorneyUserId) setAttorneyUserId(existingApp.attorneyUserId);
    if (existingApp?.phoneNumber) setPhoneNumber(existingApp.phoneNumber);
  }, [existingApp?.attorneyUserId, existingApp?.phoneNumber]);

  const mutation = useMutation({
    mutationFn: () => startApplication(selected, phoneNumber, attorneyUserId),
    onSuccess: async (app) => {
      await queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success(
        app.forwardedToAttorney
          ? `Case forwarded to ${app.attorneyName ?? "your attorney"}`
          : `Application ready — upload mandatory ${selected} documents next`,
      );
      onStarted?.(app);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not start application");
    },
  });

  const selectedAlreadyExists = existingTypes.has(selected);
  const canSubmit = Boolean(phoneNumber.trim() && attorneyUserId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium tracking-tight">Apply for a visa</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a verified attorney first — your case is only forwarded after you choose one. We
          will call your mobile number when a final decision is made.
        </p>
      </div>

      <AttorneySelect
        value={attorneyUserId}
        onChange={setAttorneyUserId}
        disabled={mutation.isPending}
      />

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="size-3.5" /> Mobile number (for status calls)
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="border-border/60 bg-muted/50 max-w-md"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {APPLICANT_VISA_OPTIONS.map((opt) => {
          const Icon = icons[opt.id];
          const active = selected === opt.id;
          const started = existingTypes.has(opt.id);
          const isHovered = hoveredOption === opt.id;
          return (
            <motion.div
              key={opt.id}
              onClick={() => !mutation.isPending && setSelected(opt.id)}
              onMouseEnter={() => setHoveredOption(opt.id)}
              onMouseLeave={() => setHoveredOption(null)}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="cursor-pointer h-full"
            >
              <GlassCard
                className={cn(
                  "p-4 text-left transition-all duration-300 h-full",
                  active
                    ? "border-[var(--landing-accent)]/50 bg-white/[0.08] shadow-glow"
                    : "bg-white/[0.02] border-white/5 opacity-90 hover:opacity-100",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <motion.div
                    animate={{
                      scale: isHovered ? 1.15 : 1,
                      rotate: isHovered ? 8 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className={cn(
                      "grid size-10 place-items-center rounded-lg transition-colors duration-300",
                      active ? "bg-[var(--landing-accent)] text-[var(--landing-solid-bg)]" : "bg-muted",
                    )}
                  >
                    <Icon className="size-5" />
                  </motion.div>
                  {started && (
                    <span className="rounded-full border border-[var(--landing-border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Started
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium">
                  {opt.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{opt.description}</p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
      <Button
        variant="gradient"
        disabled={mutation.isPending || !canSubmit}
        onClick={() => mutation.mutate()}
        className="w-full sm:w-auto transition-transform duration-200 active:scale-[0.98]"
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
        {needsAttorneyOnly
          ? "Forward case to attorney"
          : selectedAlreadyExists
            ? `Continue ${selected} application`
            : `Start ${selected} application`}
      </Button>
    </div>
  );
}
