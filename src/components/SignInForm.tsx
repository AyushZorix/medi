import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, Loader2, Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  getHomeForUser,
  getUserRole,
  portalToRole,
  signIn,
  signUp,
  type PortalKind,
  type User,
} from "@/lib/auth";
import { cn } from "@/lib/utils";

const portalOptions: {
  id: PortalKind;
  title: string;
  description: string;
  icon: typeof Briefcase;
}[] = [
  {
    id: "applicant",
    title: "Visa applicant",
    description: "Track your application, upload documents, and message your attorney.",
    icon: UserIcon,
  },
  {
    id: "attorney",
    title: "Immigration attorney",
    description: "Review cases, run the AI pipeline, and manage your team queue.",
    icon: Briefcase,
  },
];

function PortalPicker({
  value,
  onChange,
  disabled,
}: {
  value: PortalKind;
  onChange: (p: PortalKind) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex rounded-xl bg-muted/30 p-1 border border-border/60 shadow-inner">
      {portalOptions.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2.5 rounded-lg py-2.5 text-xs font-semibold transition-all duration-300 select-none cursor-pointer z-10",
              active
                ? "text-white"
                : "text-muted-foreground hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {active && (
              <motion.div
                layoutId="active-portal-pill"
                className="absolute inset-0 bg-gradient-aurora rounded-lg -z-10 shadow-glow"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className="size-4 shrink-0" />
            <span>{opt.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SignInForm({
  search,
  portalLock,
}: {
  search?: { redirect?: string; portal?: PortalKind };
  portalLock?: PortalKind;
}) {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const initialPortal: PortalKind =
    portalLock ??
    (search?.portal === "attorney" || search?.portal === "applicant"
      ? search.portal
      : "applicant");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [portal, setPortal] = useState<PortalKind>(initialPortal);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const portalLocked = Boolean(portalLock);

  async function redirectAfterAuth(user: User) {
    const role = getUserRole(user);
    const home = getHomeForUser(user);

    if (portalToRole(portal) !== role) {
      toast.info(
        `Your account is registered as ${role === "attorney" ? "an attorney" : "an applicant"}. Redirecting to the correct portal.`,
      );
      await navigate({ to: home });
      return;
    }

    const redirectTo = search?.redirect;
    if (redirectTo?.startsWith("/portal")) {
      await navigate({ to: "/portal" });
      return;
    }
    if (redirectTo?.startsWith("/app")) {
      await navigate({ to: "/app" });
      return;
    }

    await navigate({ to: home });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (mode === "sign_up") {
        if (!fullName.trim()) throw new Error("Please enter your full name");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");

        const user = await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role: portalToRole(portal),
        });
        toast.success("Welcome to VisaIQ");
        await refreshSession();
        await redirectAfterAuth(user);
      } else {
        const user = await signIn({ email: email.trim(), password });
        toast.success("Signed in");
        await refreshSession();
        await redirectAfterAuth(user);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard intensity="strong" className="w-full max-w-xl shadow-glow">
      <GlassCardHeader className="text-center">
        <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-gradient-aurora">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        <GlassCardTitle className="text-2xl">
          {mode === "sign_in" ? "Sign in to VisaIQ" : "Create your account"}
        </GlassCardTitle>
        <GlassCardDescription>
          {mode === "sign_in"
            ? portalLocked
              ? `Sign in to the ${portal === "attorney" ? "attorney" : "applicant"} portal.`
              : "Choose your portal, then enter your credentials."
            : portalLocked
              ? `Create your ${portal === "attorney" ? "attorney" : "applicant"} account.`
              : "Select whether you are an applicant or an attorney."}
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-5">
        {!portalLocked && (
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/85 font-semibold">Select Portal Access</Label>
            <PortalPicker value={portal} onChange={setPortal} disabled={loading} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "sign_up" && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs text-muted-foreground/80 font-medium">Full name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jordan Avery"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 border-border/80 bg-muted/20 hover:border-border transition-all rounded-lg text-sm px-3.5"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-muted-foreground/80 font-medium">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={portal === "attorney" ? "you@lawfirm.com" : "you@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 border-border/80 bg-muted/20 hover:border-border transition-all rounded-lg text-sm px-3.5"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-muted-foreground/80 font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "sign_up" ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-10 border-border/80 bg-muted/20 hover:border-border transition-all rounded-lg text-sm px-3.5"
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full h-10 mt-2 font-medium rounded-lg active:scale-[0.985] transition-all cursor-pointer" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin mr-1.5" />}
            {mode === "sign_in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "sign_in" ? (
            <>
              New here?{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setMode("sign_up")}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setMode("sign_in")}
              >
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </p>
      </GlassCardContent>
    </GlassCard>
  );
}
