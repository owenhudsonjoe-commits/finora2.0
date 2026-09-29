import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  LineChart,
  Receipt,
  Share2,
  Bell,
  LifeBuoy,
  FileText,
  Settings,
  ScrollText,
  Menu,
  X,
  ExternalLink,
  Lock,
} from "lucide-react";
import { FinoraLogo } from "@/components/finora/logo";
import { getAdminSession, type AdminArea } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; area: AdminArea; icon: ReactNode };

const NAV: NavItem[] = [
  {
    to: "/admin",
    label: "Overview",
    area: "dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  { to: "/admin/users", label: "Users", area: "users", icon: <Users className="h-4 w-4" /> },
  {
    to: "/admin/deposits",
    label: "Deposits",
    area: "deposits",
    icon: <ArrowDownToLine className="h-4 w-4" />,
  },
  {
    to: "/admin/withdrawals",
    label: "Withdrawals",
    area: "withdrawals",
    icon: <ArrowUpFromLine className="h-4 w-4" />,
  },
  { to: "/admin/plans", label: "Plans", area: "plans", icon: <Layers className="h-4 w-4" /> },
  {
    to: "/admin/investments",
    label: "Investments",
    area: "investments",
    icon: <LineChart className="h-4 w-4" />,
  },
  {
    to: "/admin/transactions",
    label: "Ledger",
    area: "transactions",
    icon: <Receipt className="h-4 w-4" />,
  },
  {
    to: "/admin/referrals",
    label: "Referrals",
    area: "referrals",
    icon: <Share2 className="h-4 w-4" />,
  },
  {
    to: "/admin/notifications",
    label: "Broadcasts",
    area: "notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  {
    to: "/admin/support",
    label: "Support",
    area: "support",
    icon: <LifeBuoy className="h-4 w-4" />,
  },
  {
    to: "/admin/content",
    label: "Content",
    area: "content",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    to: "/admin/settings",
    label: "Settings",
    area: "settings",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    to: "/admin/logs",
    label: "Audit logs",
    area: "logs",
    icon: <ScrollText className="h-4 w-4" />,
  },
];

export function useAdminSession() {
  const fn = useServerFn(getAdminSession);
  return useQuery({ queryKey: ["admin-session"], queryFn: () => fn(), staleTime: 60_000 });
}

export function AdminShell({ area, children }: { area: AdminArea; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useAdminSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isLoading) {
    return (
      <div className="bg-muted/30 min-h-screen p-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  const areas = data?.areas ?? [];
  const roles = data?.roles ?? [];

  if (!roles.length) {
    return (
      <NoAccess
        title="Administrator access required"
        body="This account has no administrator role assigned."
      />
    );
  }

  if (!areas.includes(area)) {
    return (
      <NoAccess
        title="You don't have access to this section"
        body={`Your role (${roles.map(titleCase).join(", ")}) does not include this area.`}
      />
    );
  }

  const items = NAV.filter((n) => areas.includes(n.area));

  const handleLockSession = () => {
    try {
      sessionStorage.removeItem("finora_admin_gate_unlocked");
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  const sidebar = (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="border-border/70 sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-background p-4 lg:block">
          <Link to="/admin" className="mb-6 flex items-center gap-2">
            <FinoraLogo />
          </Link>
          <p className="text-muted-foreground mb-3 px-3 text-[0.68rem] font-semibold tracking-[0.18em] uppercase">
            Control centre
          </p>
          {sidebar}
          <div className="border-border/70 mt-6 space-y-1 border-t pt-4">
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 py-2 text-sm"
            >
              <ExternalLink className="h-4 w-4" /> User dashboard
            </Link>
            <button
              type="button"
              onClick={handleLockSession}
              className="text-muted-foreground hover:text-destructive flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
            >
              <Lock className="h-4 w-4" /> Lock session
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-border/70 sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Toggle admin menu"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <span className="text-sm font-semibold lg:hidden">FINORA Admin</span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div className="hidden sm:block">
                <p className="text-sm font-medium">
                  {data?.profile?.full_name || data?.profile?.email || "umairi455"}
                </p>
                <p className="text-muted-foreground text-xs">{roles.map(titleCase).join(" · ")}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLockSession}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Lock administrative session"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lock Admin</span>
              </Button>
            </div>
          </header>

          {open ? (
            <div className="border-border/70 border-b bg-background p-4 lg:hidden">{sidebar}</div>
          ) : null}

          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function NoAccess({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="surface-card max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{body}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/setup">Administrator setup</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminTableShell({ children }: { children: ReactNode }) {
  return <div className="surface-card overflow-x-auto">{children}</div>;
}

export { AdminLayout } from "./admin-layout";
