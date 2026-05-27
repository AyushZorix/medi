import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
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

const nav = [
  { to: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/portal/application", label: "My application", icon: FileText },
  { to: "/portal/documents", label: "Documents", icon: Upload, badge: "1" },
  { to: "/portal/messages", label: "Messages", icon: MessageSquare, badge: "2" },
] as const;

export function UserPortalShell() {
  useRequireAuth("applicant");
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
    await navigate({ to: "/sign-in/applicant" });
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
                <Link to="/portal">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-aurora">
                    <Sparkles className="size-4 text-primary-foreground" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">VisaIQ</span>
                    <span className="truncate text-xs text-muted-foreground">Applicant portal</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>My visa</SidebarGroupLabel>
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
                      {"badge" in item && item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
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
                <AvatarFallback className="bg-teal/80 text-xs font-medium text-primary-foreground">
                  {initials || "—"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <div className="truncate font-medium">{displayName}</div>
                <div className="truncate text-muted-foreground">Applicant</div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-transparent">
        <AppBackground nested className="flex min-h-svh flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <PortalBadge portal="applicant" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="relative shrink-0" asChild>
                <Link to="/portal/messages">
                  <Bell className="size-4" />
                  <Badge className="absolute -right-1 -top-1 size-4 rounded-full p-0 text-[9px]">2</Badge>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-teal/80 text-xs text-primary-foreground">
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
          <main className="flex-1 overflow-x-hidden p-4 md:p-8">
            <Outlet />
          </main>
        </AppBackground>
      </SidebarInset>
    </SidebarProvider>
    </LandingLayout>
  );
}
