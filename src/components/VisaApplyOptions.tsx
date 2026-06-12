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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_COUNTRY_CODES = [
  { code: "+1", label: "US +1" },
  { code: "+91", label: "IN +91" },
  { code: "+44", label: "GB +44" },
  { code: "+1-CA", label: "CA +1" },
  { code: "+61", label: "AU +61" },
  { code: "+81", label: "JP +81" },
];

const icons: Record<ApplicantVisaChoice, typeof GraduationCap> = {
  "F-1": GraduationCap,
  "O-1": Star,
  "B-1/B-2": Plane,
};

function visaKey(visaType: string): ApplicantVisaChoice | null {
  if (visaType === "F-1" || visaType === "O-1" || visaType === "B-1/B-2") return visaType;
  if (visaType === "B-1" || visaType === "B-2") return "B-1/B-2";
  return null;
}

function parsePhoneNumber(
  rawPhone: string,
  countryCodes: { code: string; label: string }[],
  onAddExtraCode: (code: string) => void
): { code: string; number: string } {
  if (!rawPhone) return { code: "+1", number: "" };

  const matched = countryCodes.find((c) => rawPhone.startsWith(c.code.split("-")[0]));
  if (matched) {
    const codeVal = matched.code.split("-")[0];
    return { code: codeVal, number: rawPhone.slice(codeVal.length) };
  }

  if (rawPhone.startsWith("+")) {
    let detectedCode = "";
    let remaining = rawPhone;

    if (/^\+\d{3}/.test(rawPhone)) {
      detectedCode = rawPhone.slice(0, 4);
      remaining = rawPhone.slice(4);
    } else if (/^\+\d{2}/.test(rawPhone)) {
      detectedCode = rawPhone.slice(0, 3);
      remaining = rawPhone.slice(3);
    } else if (/^\+\d{1}/.test(rawPhone)) {
      detectedCode = rawPhone.slice(0, 2);
      remaining = rawPhone.slice(2);
    }

    if (detectedCode) {
      onAddExtraCode(detectedCode);
      return { code: detectedCode, number: remaining };
    }
  }

  return { code: "+1", number: rawPhone };
}

type VisaApplyOptionsProps = {
  existingApplications: Application[];
  onStarted?: (app: Application) => void;
};

export function VisaApplyOptions({ existingApplications, onStarted }: VisaApplyOptionsProps) {
  const queryClient = useQueryClient();
  
  const visibleVisaOptions = APPLICANT_VISA_OPTIONS;

  const [selected, setSelected] = useState<ApplicantVisaChoice | null>(() => {
    if (existingApplications.length > 0) {
      const firstApp = existingApplications[0];
      const key = visaKey(firstApp.visaType);
      if (key) return key;
    }
    return null;
  });

  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [attorneyUserId, setAttorneyUserId] = useState("");
  const [hoveredOption, setHoveredOption] = useState<ApplicantVisaChoice | null>(null);
  
  const [extraCountryCodes, setExtraCountryCodes] = useState<{ code: string; label: string }[]>([]);
  const countryCodes = [...DEFAULT_COUNTRY_CODES, ...extraCountryCodes];

  // Track initialization status and active selections
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastSelected, setLastSelected] = useState<ApplicantVisaChoice | null>(selected);

  useEffect(() => {
    if (visibleVisaOptions.length > 0 && selected && !visibleVisaOptions.some((opt) => opt.id === selected)) {
      setSelected(visibleVisaOptions[0].id);
    }
  }, [visibleVisaOptions, selected]);

  const existingTypes = new Set(
    existingApplications
      .map((a) => visaKey(a.visaType))
      .filter((v): v is ApplicantVisaChoice => v !== null),
  );

  const existingApp = selected
    ? existingApplications.find((a) => visaKey(a.visaType) === selected)
    : undefined;
  const needsAttorneyOnly = Boolean(existingApp && !existingApp.forwardedToAttorney);
  const attorneyChanged = Boolean(
    existingApp &&
    attorneyUserId &&
    existingApp.attorneyUserId !== attorneyUserId
  );

  // 1. Initial mounting/loading seeding from first available case or current selected case
  useEffect(() => {
    if (!hasInitialized && existingApplications.length > 0) {
      const firstApp = selected
        ? existingApplications.find((a) => visaKey(a.visaType) === selected)
        : existingApplications[0];
      if (firstApp) {
        const key = visaKey(firstApp.visaType);
        if (key) setSelected(key);
        if (firstApp.attorneyUserId) setAttorneyUserId(firstApp.attorneyUserId);
        
        const { code, number } = parsePhoneNumber(
          firstApp.phoneNumber || "",
          countryCodes,
          (extraCode) => {
            setExtraCountryCodes((prev) => {
              if (prev.some((c) => c.code === extraCode)) return prev;
              return [...prev, { code: extraCode, label: `Code: ${extraCode}` }];
            });
          }
        );
        setCountryCode(code);
        setPhoneNumber(number);
        setHasInitialized(true);
      }
    }
  }, [existingApplications, selected, hasInitialized, countryCodes]);

  // 2. Tab change preservation/load logic
  useEffect(() => {
    if (selected !== lastSelected) {
      setLastSelected(selected);
      if (!selected) return;
      const newApp = existingApplications.find((a) => visaKey(a.visaType) === selected);
      if (newApp) {
        if (newApp.attorneyUserId) {
          setAttorneyUserId(newApp.attorneyUserId);
        } else {
          setAttorneyUserId("");
        }
        const { code, number } = parsePhoneNumber(
          newApp.phoneNumber || "",
          countryCodes,
          (extraCode) => {
            setExtraCountryCodes((prev) => {
              if (prev.some((c) => c.code === extraCode)) return prev;
              return [...prev, { code: extraCode, label: `Code: ${extraCode}` }];
            });
          }
        );
        setCountryCode(code);
        setPhoneNumber(number);
      } else {
        setAttorneyUserId("");
      }
    }
  }, [selected, lastSelected, existingApplications, countryCodes]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!selected) {
        throw new Error("Select a visa type before starting an application");
      }
      const cleanCode = countryCode.split("-")[0];
      const fullPhone = cleanCode + phoneNumber.replace(/\D/g, "");
      return startApplication(selected, fullPhone, attorneyUserId);
    },
    onSuccess: async (app) => {
      await queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success(
        app.forwardedToAttorney
          ? `Case forwarded to ${app.attorneyName ?? "your attorney"}`
          : `Application ready — upload mandatory ${app.visaType} documents next`,
      );
      onStarted?.(app);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not start application");
    },
  });

  const selectedAlreadyExists = selected ? existingTypes.has(selected) : false;
  const canSubmit = Boolean(selected && phoneNumber.trim() && attorneyUserId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium tracking-tight">Apply for a visa</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a visa type first, then choose a verified attorney who specializes in that visa.
          We will call your mobile number when a final decision is made.
        </p>
      </div>

      <div className={cn("grid gap-3", visibleVisaOptions.length === 1 ? "md:grid-cols-1 max-w-sm" : "md:grid-cols-3")}>
        {visibleVisaOptions.map((opt) => {
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
                    ? "border-primary bg-accent/40 shadow-glow"
                    : "bg-muted/30 border-border/50 opacity-90 hover:opacity-100",
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

      <AttorneySelect
        value={attorneyUserId}
        onChange={setAttorneyUserId}
        disabled={mutation.isPending || !selected}
        visaType={selected}
      />

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="size-3.5" /> Mobile number (for status calls)
        </Label>
        <div className="flex gap-2 max-w-md">
          <div className="w-[110px] shrink-0">
            <Select value={countryCode} onValueChange={setCountryCode} disabled={mutation.isPending}>
              <SelectTrigger className="border-border/60 bg-muted/50 h-10 cursor-pointer">
                <SelectValue placeholder="Code" />
              </SelectTrigger>
              <SelectContent className="glass border-border/50 z-50">
                {countryCodes.map((c) => (
                  <SelectItem key={c.label} value={c.code} className="cursor-pointer">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            id="phone"
            type="tel"
            autoComplete="one-time-code"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="border-border/60 bg-muted/50 flex-1 h-10"
          />
        </div>
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
          : attorneyChanged
            ? "Redirect case to selected attorney"
            : selectedAlreadyExists && selected
              ? `Continue ${selected} application`
              : selected
                ? `Start ${selected} application`
                : "Select a visa type"}
      </Button>
    </div>
  );
}
