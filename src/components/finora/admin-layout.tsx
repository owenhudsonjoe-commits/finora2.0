import { useState, type ReactNode } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  LineChart,
  Receipt,
  Settings,
  LifeBuoy,
  Bell,
  ScrollText,
  Share2,
  Menu,
  X,
  ExternalLink,
  Lock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { FinoraLogo } from "@/components/finora/logo";
import { useAdminSession } from "@/components/finora/admin-shell";
import { AdminGlobalSearch } from "@/components/finora/admin-search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AdminLayoutProps {
  children?: ReactNode;
  title?: string;
  description?: string;
  activeItem?: "dashboard" | "users" | "deposits" | "withdrawals" | string;
}

export type AdminNavLink = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
  badge?: string;
};

// Core primary administrative navigation links requested:
// 'Dashboard', 'Users', 'Deposits', 'Withdrawals'
export const PRIMARY_ADMIN_LINKS: AdminNavLink[] = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    key: "dashboard",
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
    key: "users",
  },
  {
    to: "/admin/deposits",
    label: "Deposits",
    icon: ArrowDownToLine,
    key: "deposits",
  },
  {
    to: "/admin/withdrawals",
    label: "Withdrawals",
    icon: ArrowUpFromLine,
    key: "withdrawals",
  },
];

export const SECONDARY_ADMIN_LINKS: AdminNavLink[] = [
  {
    to: "/admin/support",
    label: "Tickets & Support",
    icon: LifeBuoy,
    key: "support",
  },
  {
    to: "/admin/plans",
    label: "Plans",
    icon: Layers,
    key: "plans",
  },
  {
    to: "/admin/investments",
    label: "Investments",
    icon: LineChart,
    key: "investments",
  },
  {
    to: "/admin/transactions",
    label: "Ledger",
    icon: Receipt,
    key: "transactions",
  },
  {
    to: "/admin/referrals",
    label: "Referrals",
    icon: Share2,
    key: "referrals",
  },
  {
    to: "/admin/notifications",
    label: "Broadcasts",
    icon: Bell,
    key: "notifications",
  },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings,
    key: "settings",
  },
  {
    to: "/admin/logs",
    label: "Audit Logs",
    icon: ScrollText,
    key: "logs",
  },
];

/**
 * AdminLayout: Foundational administrative layout providing sticky sidebar navigation
 * with primary links for 'Dashboard', 'Users', 'Deposits', and 'Withdrawals'.
 */
export function AdminLayout({ children, title, description, activeItem }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: adminSession } = useAdminSession();

  const handleLockSession = () => {
    try {
      sessionStorage.removeItem("finora_admin_gate_unlocked");
    } catch {
      // Ignore storage errors
    }
    window.location.reload();
  };

  const isLinkActive = (item: AdminNavLink) => {
    if (activeItem) {
      return activeItem === item.key;
    }
    if (item.to === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(item.to);
  };

  const renderNavLinks = (links: AdminNavLink[]) => (
    <div className="space-y-1">
      {links.map((item) => {
        const active = isLinkActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span>{item.label}</span>
            </div>
            {active ? <ChevronRight className="h-3.5 w-3.5 opacity-80" /> : null}
          </Link>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="px-2">
          <Link to="/admin" className="flex items-center gap-2.5">
            <FinoraLogo />
          </Link>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-mono text-[11px] font-semibold tracking-wide uppercase">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Primary Administrative Navigation Links */}
        <div>
          <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground">
            Management
          </p>
          {renderNavLinks(PRIMARY_ADMIN_LINKS)}
        </div>

        {/* Secondary Operations */}
        <div>
          <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground">
            Operations
          </p>
          {renderNavLinks(SECONDARY_ADMIN_LINKS)}
        </div>
      </div>

      {/* Footer quick links & session management */}
      <div className="border-t border-border/70 pt-4 space-y-1">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>User Dashboard</span>
        </Link>
        <button
          type="button"
          onClick={handleLockSession}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Lock Admin Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-[1440px]">
        {/* Desktop Sticky Sidebar Navigation */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/70 bg-background p-4 lg:block">
          {sidebarContent}
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1 flex flex-col min-h-screen">
          {/* Topbar Header */}
          <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Toggle admin sidebar"
                onClick={() => setMobileMenuOpen((o) => !o)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-foreground lg:text-base">
                  {title || "FINORA Admin"}
                </span>
                {description && (
                  <span className="hidden text-xs text-muted-foreground xl:inline">
                    · {description}
                  </span>
                )}
              </div>
            </div>

            {/* Global Search Input */}
            <div className="w-full flex-1 max-w-md sm:mx-4">
              <AdminGlobalSearch />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="hidden text-right md:block">
                <p className="text-xs font-semibold text-foreground">
                  {adminSession?.profile?.full_name || "Super Admin"}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {adminSession?.profile?.email || "admin@finora.io"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLockSession}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lock Session</span>
              </Button>
            </div>
          </header>

          {/* Mobile Drawer Navigation */}
          {mobileMenuOpen && (
            <div className="border-b border-border/70 bg-background p-4 shadow-lg lg:hidden">
              {sidebarContent}
            </div>
          )}

          {/* Content Outlet / Children */}
          <main className="flex-1 p-4 lg:p-8">{children ?? <Outlet />}</main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
export { AdminGlobalSearch } from "@/components/finora/admin-search";
