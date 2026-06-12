import { useEffect } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications } from "@/lib/applications";
import Dock from "@/components/Dock";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Upload,
  Sparkles,
  LogOut,
  Settings,
  User,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

import { AppBackground } from "@/components/AppBackground";
import { LandingLayout } from "@/components/LandingLayout";
import { PortalBadge } from "@/components/PortalBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { GlassCard, GlassCardContent } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export function UserPortalShell() {
  useRequireAuth("applicant");
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { displayName, initials, user, signOut, loading } = useAuth();

  useEffect(() => {
    document.body.classList.add("authenticated-theme");
    return () => {
      document.body.classList.remove("authenticated-theme");
    };
  }, []);

  const { data: apps = [] } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    enabled: !!user,
  });

  const activeApp = apps[0];
  const missingDocsCount = activeApp
    ? (activeApp.documentsSummary?.mandatoryTotal ?? 0) - (activeApp.documentsSummary?.mandatoryUploaded ?? 0)
    : 0;

  const nav = [
    { to: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/portal/application", label: "My application", icon: FileText },
    { to: "/portal/documents", label: "Documents", icon: Upload, badge: activeApp?.forwardedToAttorney && missingDocsCount > 0 ? String(missingDocsCount) : undefined },
    { to: "/portal/messages", label: "Messages", icon: MessageSquare, badge: activeApp?.submittedToAttorney ? "1" : undefined },
  ];

  const dockItems = nav.map((item) => {
    const Icon = item.icon;
    const isActive = item.exact ? path === item.to : path.startsWith(item.to);
    return {
      icon: <Icon className="size-5" />,
      label: item.label,
      active: isActive,
      onClick: () => {
        navigate({ to: item.to });
      },
    };
  });

  if (loading || !user) {
    return (
      <AppBackground className="flex min-h-svh items-center justify-center">
        <div className="loader" aria-label="Loading" />
      </AppBackground>
    );
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    await navigate({ to: "/sign-in/applicant" });
  }

  return (
    <LandingLayout shader={false} className="flex min-h-svh w-full authenticated-theme">
      <AppBackground className="flex min-h-svh flex-1 flex-col" nested>
        <Dock items={dockItems} />
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2">
            <Link to="/portal" className="flex items-center gap-2 mr-4 hover:opacity-80 transition-opacity">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-aurora">
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">VisaIQ</span>
            </Link>
            <PortalBadge portal="applicant" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" className="relative shrink-0" asChild>
              <Link to="/portal/messages">
                <Bell className="size-4" />
                <Badge className="absolute -right-1 -top-1 size-4 rounded-full p-0 text-[9px] flex items-center justify-center">2</Badge>
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-teal/80 text-xs text-primary-foreground font-semibold">
                      {initials || "—"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 glass-strong">
                <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
                {user?.email && (
                  <p className="px-2 pb-2 text-xs text-muted-foreground truncate">{user.email}</p>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="size-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void handleSignOut()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-8 pl-28 md:pl-28">
          <Outlet />
        </main>
      </AppBackground>
    </LandingLayout>
  );
}
