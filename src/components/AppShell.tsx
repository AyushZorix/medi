import { useEffect } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApplications } from "@/lib/applications";
import Dock from "@/components/Dock";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Gavel,
  Bell,
  Sparkles,
  Search,
  Settings,
  LogOut,
  User,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { AppBackground } from "@/components/AppBackground";
import { LandingLayout } from "@/components/LandingLayout";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GlassCard, GlassCardContent } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export function AppShell() {
  useRequireAuth("attorney");
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { displayName, initials, user, signOut, loading } = useAuth();

  useEffect(() => {
    document.body.classList.add("authenticated-theme");
    return () => {
      document.body.classList.remove("authenticated-theme");
    };
  }, []);

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
    enabled: !!user,
  });

  const needsReview = applications.filter((a) => a.status === "needs_info" || a.status === "processing").length;

  const nav = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/app/applications", label: "Applications", icon: FolderKanban, badge: applications.length > 0 ? String(applications.length) : undefined },
    { to: "/app/documents", label: "Documents", icon: FileText },
    { to: "/app/decisions", label: "Decisions", icon: Gavel },
    { to: "/app/notifications", label: "Notifications", icon: Bell, badge: needsReview > 0 ? String(needsReview) : undefined },
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
    await navigate({ to: "/sign-in/attorney" });
  }

  return (
    <LandingLayout shader={false} className="flex min-h-svh w-full authenticated-theme">
      <AppBackground className="flex min-h-svh flex-1 flex-col" nested>
        <Dock items={dockItems} />
        <header className="sticky top-0 z-20 flex h-16 shrink-0 flex-col justify-center gap-2 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:h-auto md:min-h-16 md:flex-row md:items-center md:gap-3 md:px-6 md:py-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Link to="/" className="flex items-center gap-2 mr-4 hover:opacity-80 transition-opacity">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-aurora">
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">VisaIQ</span>
            </Link>
            <PortalBadge portal="attorney" className="hidden sm:inline-flex" />
            <AppBreadcrumb />
          </div>
          <div className="flex flex-1 items-center gap-2 md:justify-end">
            <Button
              variant="gradient"
              size="sm"
              className="hidden shrink-0 sm:inline-flex"
              asChild
            >
              <Link to="/app/applications">
                <Plus className="size-3.5" /> New case
              </Link>
            </Button>
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="relative shrink-0" asChild>
                  <Link to="/app/notifications">
                    <Bell className="size-4" />
                    <Badge className="absolute -right-1 -top-1 size-4 rounded-full p-0 text-[9px] flex items-center justify-center">
                      {needsReview}
                    </Badge>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground font-semibold">
                      {initials || "—"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
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
