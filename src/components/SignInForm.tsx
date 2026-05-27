import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, Loader2, Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

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
    <div className="grid gap-3 sm:grid-cols-2">
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
              "landing-card rounded-xl p-4 text-left transition-all",
              active
                ? "border-[var(--landing-accent)]/50 shadow-glow"
                : "opacity-90 hover:opacity-100",
              disabled && "pointer-events-none opacity-60",
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "grid size-9 place-items-center rounded-lg",
                  active ? "bg-gradient-aurora text-primary-foreground" : "bg-muted",
                )}
              >
                <Icon className="size-4" />
              </div>
              <span className="text-sm font-medium">{opt.title}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{opt.description}</p>
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
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Portal</Label>
            <PortalPicker value={portal} onChange={setPortal} disabled={loading} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "sign_up" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jordan Avery"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-border/60 bg-muted/50"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={portal === "attorney" ? "you@lawfirm.com" : "you@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-border/60 bg-muted/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "sign_up" ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-border/60 bg-muted/50"
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
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
