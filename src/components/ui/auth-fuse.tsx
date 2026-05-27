"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, Briefcase, User as UserIcon, Loader2, Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight";
import { toast } from "sonner";
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input dark:border-input/50 bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-all placeholder:text-muted-foreground/50 focus-visible:bg-white/[0.05] focus-visible:border-[var(--landing-accent)] focus-visible:ring-1 focus-visible:ring-[var(--landing-accent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

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
    <div className="grid gap-3 grid-cols-2">
      {[
        {
          id: "applicant" as const,
          title: "Applicant",
          icon: UserIcon,
        },
        {
          id: "attorney" as const,
          title: "Attorney",
          icon: Briefcase,
        },
      ].map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer",
              active
                ? "border-[var(--landing-accent)] bg-white/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-white hover:bg-white/[0.05]",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <Icon className="size-4" />
            <span>{opt.title}</span>
          </button>
        );
      })}
    </div>
  );
}

function SignInForm({
  onSubmit,
  loading,
  email,
  setEmail,
  password,
  setPassword,
  portal,
  setPortal,
  portalLocked,
}: {
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  portal: PortalKind;
  setPortal: (val: PortalKind) => void;
  portalLocked: boolean;
}) {
  return (
    <form onSubmit={onSubmit} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.03)]">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--landing-accent)]"
          >
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
            <polyline points="12 22 12 12 22 8.5" />
            <polyline points="2 8.5 12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Sign in to VisaIQ</h1>
        <p className="text-balance text-sm text-muted-foreground">
          {portalLocked
            ? `Sign in to your ${portal === "attorney" ? "attorney" : "applicant"} portal`
            : "Select your portal role and enter your details"}
        </p>
      </div>
      <div className="grid gap-4">
        {!portalLocked && (
          <div className="grid gap-2">
            <Label>Portal Role</Label>
            <PortalPicker value={portal} onChange={setPortal} disabled={loading} />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <PasswordInput
            name="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Password"
            disabled={loading}
          />
        </div>
        <Button type="submit" variant="outline" className="mt-2 w-full flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Sign In
        </Button>
      </div>
    </form>
  );
}

function SignUpForm({
  onSubmit,
  loading,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  portal,
  setPortal,
  portalLocked,
}: {
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  portal: PortalKind;
  setPortal: (val: PortalKind) => void;
  portalLocked: boolean;
}) {
  return (
    <form onSubmit={onSubmit} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.03)]">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--landing-accent)]"
          >
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
            <polyline points="12 22 12 12 22 8.5" />
            <polyline points="2 8.5 12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Create your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          {portalLocked
            ? `Create your ${portal === "attorney" ? "attorney" : "applicant"} account`
            : "Select whether you are an applicant or an attorney"}
        </p>
      </div>
      <div className="grid gap-4">
        {!portalLocked && (
          <div className="grid gap-2">
            <Label>Portal Role</Label>
            <PortalPicker value={portal} onChange={setPortal} disabled={loading} />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <PasswordInput
            name="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Password"
            disabled={loading}
          />
        </div>
        <Button type="submit" variant="outline" className="mt-2 w-full flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Sign Up
        </Button>
      </div>
    </form>
  );
}

function AuthFormContainer({
  isSignIn,
  onToggle,
  portal,
  setPortal,
  portalLocked,
  search,
}: {
  isSignIn: boolean;
  onToggle: () => void;
  portal: PortalKind;
  setPortal: (val: PortalKind) => void;
  portalLocked: boolean;
  search: any;
}) {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleBtnLoaded, setGoogleBtnLoaded] = useState(false);

  useEffect(() => {
    // Check if the script is already loaded
    if (document.getElementById("google-gsi-client")) {
      initGoogleBtn();
      return;
    }

    // Load the Google Identity Services script
    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initGoogleBtn();
    };
    document.body.appendChild(script);

    function initGoogleBtn() {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: "984146651145-dega19k07fismgo5r7eb69lni68jcfo1.apps.googleusercontent.com",
          callback: (response: any) => {
            handleGoogleSignIn(response.credential);
          },
        });
        setGoogleBtnLoaded(true);
      }
    }
  }, [portal]);

  useEffect(() => {
    if (googleBtnLoaded && (window as any).google) {
      const btn = document.getElementById("google-signin-button");
      if (btn) {
        (window as any).google.accounts.id.renderButton(btn, {
          theme: "outline",
          size: "large",
          width: 350,
          logo_alignment: "left",
          shape: "rectangular"
        });
      }
    }
  }, [googleBtnLoaded, isSignIn, portal]);

  async function handleGoogleSignIn(idToken: string) {
    if (loading) return;
    setLoading(true);
    try {
      const role = portal === "attorney" ? "attorney" : "user";
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken, role }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Google Sign-In failed");
      }

      const data = await res.json(); // { user }
      toast.success("Welcome!");
      await refreshSession();
      await redirectAfterAuth(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function redirectAfterAuth(user: User) {
    const role = getUserRole(user);
    const home = getHomeForUser(user);

    if (portalToRole(portal) !== role) {
      toast.info(
        `Your account is registered as ${role === "attorney" ? "an attorney" : "an applicant"}. Redirecting to the correct portal.`
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
      if (!isSignIn) {
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
    <div className="mx-auto grid w-[350px] gap-6">
      {isSignIn ? (
        <SignInForm
          onSubmit={handleSubmit}
          loading={loading}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          portal={portal}
          setPortal={setPortal}
          portalLocked={portalLocked}
        />
      ) : (
        <SignUpForm
          onSubmit={handleSubmit}
          loading={loading}
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          portal={portal}
          setPortal={setPortal}
          portalLocked={portalLocked}
        />
      )}
      <div className="text-center text-sm">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
        <Button variant="link" className="pl-1 text-foreground" onClick={onToggle}>
          {isSignIn ? "Sign up" : "Sign in"}
        </Button>
      </div>
      <div className="relative flex items-center justify-center gap-3 text-sm my-2">
        <div className="h-px flex-1 bg-border/40" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground shrink-0">Or continue with</span>
        <div className="h-px flex-1 bg-border/40" />
      </div>
      <div className="w-full flex justify-center min-h-[40px] relative">
        {googleBtnLoaded ? (
          <div id="google-signin-button" className="w-full flex justify-center z-10"></div>
        ) : (
          <Button variant="outline" type="button" className="w-full" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Google...
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-2">
        <Link to="/" className="hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

interface AuthUIProps {
  portalLock?: PortalKind;
  search?: { redirect?: string; portal?: PortalKind };
}

export function AuthUI({ portalLock, search }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const toggleForm = () => setIsSignIn((prev) => !prev);

  const initialPortal: PortalKind =
    portalLock ??
    (search?.portal === "attorney" || search?.portal === "applicant"
      ? search.portal
      : "applicant");

  const [portal, setPortal] = useState<PortalKind>(initialPortal);
  const portalLocked = Boolean(portalLock);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-transparent text-foreground relative z-10 overflow-hidden py-12 px-4">
      {/* Background Spotlights */}
      <Spotlight className="-top-40 left-0 md:left-20 md:-top-40" fill="var(--landing-accent)" />
      <Spotlight className="top-40 left-10 md:left-60 md:top-20" fill="rgba(124,58,237,0.12)" />

      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.005 }}
        className="w-full max-w-[440px] px-8 py-10 rounded-2xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(124,58,237,0.06)] relative z-10"
      >
        <AuthFormContainer
          isSignIn={isSignIn}
          onToggle={toggleForm}
          portal={portal}
          setPortal={setPortal}
          portalLocked={portalLocked}
          search={search}
        />
      </motion.div>
    </div>
  );
}
