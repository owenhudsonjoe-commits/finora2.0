import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Briefcase,
  Users,
  Bell,
  LifeBuoy,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDashboard } from "@/lib/finora.functions";
import { FinoraLogo } from "./logo";
import { ScrollToTop } from "./scroll-to-top";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dashboardQuery = {
  queryKey: ["dashboard"] as const,
  queryFn: () => getDashboard(),
};

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/investments", label: "Investments", icon: Briefcase },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/referrals", label: "Referrals", icon: Users },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const MOBILE_NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/investments", label: "Portfolio", icon: Briefcase },
  { to: "/profile", label: "Account", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery(dashboardQuery);
  const unread = data?.unread ?? 0;
  const name = data?.profile?.full_name || "FINORA member";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="bg-muted/30 flex min-h-screen">
      <aside className="bg-primary text-primary-foreground sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-5 lg:flex">
        <Link to="/dashboard" className="mb-8 block">
          <FinoraLogo
            markClassName="text-primary-foreground/10"
            wordClassName="text-primary-foreground"
          />
        </Link>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              activeProps={{ className: "bg-primary-foreground/12 text-primary-foreground" }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.to === "/notifications" && unread > 0 ? (
                <span className="bg-accent text-accent-foreground ml-auto rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold">
                  {unread}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground mt-4 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/90 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/dashboard" className="lg:hidden">
              <FinoraLogo />
            </Link>
            <p className="text-muted-foreground hidden text-sm lg:block">
              Signed in as <span className="text-foreground font-medium">{name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative"
            >
              <Link to="/notifications">
                <Bell className="h-4 w-4" />
                {unread > 0 ? (
                  <span
                    className="bg-accent absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/wallet/deposit">Add funds</Link>
            </Button>
          </div>
        </header>

        {open ? (
          <div className="bg-background border-b px-4 py-3 lg:hidden">
            <nav className="grid gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm"
                  activeProps={{ className: "bg-muted font-medium" }}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ))}
              <button
                onClick={signOut}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </nav>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>

        <nav className="bg-background fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t lg:hidden">
          {MOBILE_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "text-muted-foreground flex flex-col items-center gap-1 py-2.5 text-[0.65rem]",
              )}
              activeProps={{ className: "text-foreground" }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <ScrollToTop />
      </div>
    </div>
  );
}
