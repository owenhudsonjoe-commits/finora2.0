import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, Coins, Users, ArrowUpRight } from "lucide-react";
import { AppShell, dashboardQuery } from "@/components/finora/app-shell";
import {
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingRows,
  PageHeader,
} from "@/components/finora/primitives";
import { Button } from "@/components/ui/button";
import { money, dateTime, titleCase } from "@/lib/format";
import { ensureAccount } from "@/lib/finora.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FINORA" },
      {
        name: "description",
        content: "Your FINORA portfolio, wallet balance and recent activity at a glance.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Dashboard — FINORA" },
      { property: "og:description", content: "Portfolio, wallet and activity overview." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading, refetch } = useQuery(dashboardQuery);

  useEffect(() => {
    if (!isLoading && data && !data.profile) {
      ensureAccount()
        .then(() => refetch())
        .catch(() => undefined);
    }
  }, [isLoading, data, refetch]);

  const wallet = data?.wallet;
  const active = (data?.investments ?? []).filter((i) => i.status === "active");
  const dailyIncome = active.reduce((s, i) => s + Number(i.daily_earning), 0);

  return (
    <AppShell>
      <PageHeader
        title={`Welcome back${data?.profile?.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""}`}
        description="A live view of your balance, active plans and latest ledger entries."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available balance"
          value={money(Number(wallet?.available ?? 0))}
          hint="Ready to invest or withdraw"
          icon={<Wallet className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Invested"
          value={money(Number(wallet?.invested ?? 0))}
          hint={`${active.length} active plan${active.length === 1 ? "" : "s"}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Total earnings"
          value={money(Number(wallet?.total_earnings ?? 0))}
          hint={`${money(dailyIncome)} per day from active plans`}
          icon={<Coins className="h-4 w-4" />}
        />
        <StatCard
          label="Referral earnings"
          value={money(data?.referralEarnings ?? 0)}
          hint="Commission credited to your wallet"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild className="font-semibold">
          <Link to="/invest">Activate a plan</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/wallet/deposit">Deposit funds</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/wallet/withdraw">Withdraw</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Active investments</h2>
            <Link to="/investments" className="text-muted-foreground hover:text-foreground text-xs">
              View all
            </Link>
          </div>
          {isLoading ? (
            <LoadingRows />
          ) : (data?.investments ?? []).length === 0 ? (
            <EmptyState
              title="No investments yet"
              description="Fund your wallet and choose a plan to start building your portfolio."
              action={
                <Button asChild size="sm">
                  <Link to="/invest">Browse plans</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y">
              {data?.investments.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{inv.plan_name}</p>
                    <p className="text-muted-foreground text-xs">
                      {money(Number(inv.daily_earning))} daily · earned{" "}
                      {money(Number(inv.total_earned))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm font-semibold">{money(Number(inv.amount))}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link to="/wallet" className="text-muted-foreground hover:text-foreground text-xs">
              Full ledger
            </Link>
          </div>
          {isLoading ? (
            <LoadingRows />
          ) : (data?.transactions ?? []).length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Your deposits, investments and earnings appear here."
            />
          ) : (
            <ul className="divide-y">
              {data?.transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{titleCase(t.type)}</p>
                    <p className="text-muted-foreground text-xs">{dateTime(t.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm font-semibold">{money(Number(t.amount))}</p>
                    <StatusBadge status={t.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-muted-foreground mt-8 flex items-start gap-2 text-xs leading-relaxed">
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Figures shown are drawn directly from your ledger. Investment earnings follow the terms
        recorded with each investment and are not guaranteed.
      </p>
    </AppShell>
  );
}
