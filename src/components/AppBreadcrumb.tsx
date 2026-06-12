import { Link, useRouterState } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labels: Record<string, string> = {
  "/app": "Dashboard",
  "/app/applications": "Applications",
  "/app/pipeline": "AI Pipeline",
  "/app/documents": "Documents",
  "/app/decisions": "Decisions",
  "/app/notifications": "Notifications",
  "/app/admin": "Attorney Panel",
};

export function AppBreadcrumb() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const segments = path.split("/").filter(Boolean);
  const isDetail = segments.length > 2 && segments[1] === "applications";

  const crumbs: { href: string; label: string }[] = [];
  if (path !== "/app" && path !== "/app/") {
    crumbs.push({ href: "/app", label: "Dashboard" });
    const base = `/${segments.slice(0, 2).join("/")}`;
    const label = labels[base] ?? segments[1];
    crumbs.push({ href: base, label });
  }
  if (isDetail) {
    const id = segments[2];
    const name = id.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
    crumbs.push({ href: path, label: name });
  }

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {crumbs.map((c, i) => (
          <span key={c.href} className="contents">
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={c.href}>{c.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
