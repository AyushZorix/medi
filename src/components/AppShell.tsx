import { Bell, FileStack, Gavel, LayoutDashboard, Search, Settings, ShieldCheck } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/documents", label: "Documents", icon: FileStack },
  { to: "/app/visa-info", label: "Visa Requirements", icon: ShieldCheck },
  { to: "/app/cases", label: "Cases", icon: Gavel },
  { to: "/app/audit", label: "Audit", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings }
];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand-link">
          <span className="brand-mark">VF</span>
          <div>
            <p className="brand-title">VisaFlow AI</p>
            <p className="brand-subtitle">Attorney Assistant</p>
          </div>
        </Link>
        <nav className="nav-stack">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <div className="search-wrap">
            <Search size={16} />
            <input placeholder="Search applicants, docs, workflows" />
          </div>
          <div className="avatar">RK</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
