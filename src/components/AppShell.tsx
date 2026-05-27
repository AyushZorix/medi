import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Workflow,
  FileText,
  Gavel,
  Bell,
  ShieldCheck,
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

const nav: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: string;
}[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/applications", label: "Applications", icon: FolderKanban, badge: "9" },
  { to: "/app/pipeline", label: "AI Pipeline", icon: Workflow },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/decisions", label: "Decisions", icon: Gavel },
  { to: "/app/notifications", label: "Notifications", icon: Bell, badge: "4" },
  { to: "/app/admin", label: "Attorney Panel", icon: ShieldCheck },
];

export function AppShell() {
  useRequireAuth("attorney");
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { displayName, initials, user, signOut, loading } = useAuth();

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
    <LandingLayout className="flex min-h-svh w-full">
      <SidebarProvider className="min-h-svh w-full">
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-sidebar-border/60 bg-sidebar backdrop-blur-md shadow-[inset_-1px_0_0_oklch(1_0_0/0.06)]"
      >
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-aurora">
                    <Sparkles className="size-4 text-primary-foreground" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">VisaIQ</span>
                    <span className="truncate text-xs text-muted-foreground">Attorney portal</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => {
                  const active = item.exact ? path === item.to : path.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <Link to={item.to}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <GlassCard className="mx-2 mb-2">
            <GlassCardContent className="flex items-center gap-2.5 p-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-gradient-primary text-xs font-medium text-primary-foreground">
                  {initials || "—"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <div className="truncate font-medium">{displayName || "Signed in"}</div>
                <div className="truncate text-muted-foreground">{user?.email ?? "Attorney"}</div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-transparent">
        <AppBackground nested className="flex min-h-svh flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 flex-col justify-center gap-2 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:h-auto md:min-h-16 md:flex-row md:items-center md:gap-3 md:px-6 md:py-3">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <SidebarTrigger className="-ml-1" />
              <PortalBadge portal="attorney" className="hidden sm:inline-flex" />
              <AppBreadcrumb />
            </div>
            <div className="flex flex-1 items-center gap-2 md:justify-end">
              <div className="relative max-w-md flex-1 md:max-w-xs lg:max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search applicants, cases…"
                  className="h-9 border-border/60 bg-muted/50 pl-9"
                />
              </div>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="relative shrink-0" asChild>
                    <Link to="/app/notifications">
                      <Bell className="size-4" />
                      <Badge className="absolute -right-1 -top-1 size-4 rounded-full p-0 text-[9px]">
                        4
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
                      <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">
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
          <main className="flex-1 overflow-x-hidden p-4 md:p-8">
            <Outlet />
          </main>
        </AppBackground>
      </SidebarInset>
    </SidebarProvider>
    </LandingLayout>
  );
}
