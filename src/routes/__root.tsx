import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { LandingLayout } from "@/components/LandingLayout";
import { ViewTransitionManager } from "@/components/ViewTransitionManager";
import { AuthProvider } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <LandingLayout shader={false} className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md landing-card text-center">
        <CardHeader>
          <CardTitle className="text-7xl font-bold">404</CardTitle>
          <CardDescription className="text-base text-foreground">Page not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
        </CardFooter>
      </Card>
    </LandingLayout>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <LandingLayout shader={false} className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md landing-card text-center">
        <CardHeader>
          <CardTitle>This page didn't load</CardTitle>
          <CardDescription>
            Something went wrong on our end. You can try refreshing or head back home.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Go home</a>
          </Button>
        </CardFooter>
      </Card>
    </LandingLayout>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VisaIQ — Explainable AI for visa decisions" },
      { name: "description", content: "Automate visa decisions with explainable AI. Document parsing, reasoning agents, and audit-ready rule engines." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231a1a1a'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='16' fill='%23c8e650'%3EV%3C/text%3E%3C/svg%3E",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster richColors position="top-right" />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <ViewTransitionManager />
          <div className="route-view-root">
            <Outlet />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
