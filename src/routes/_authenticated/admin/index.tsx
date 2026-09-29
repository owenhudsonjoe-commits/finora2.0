import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, ArrowDownToLine, ArrowUpFromLine, LineChart, LifeBuoy, Wallet } from "lucide-react";
import { AdminShell } from "@/components/finora/admin-shell";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  LoadingRows,
  EmptyState,
} from "@/components/finora/primitives";
import { adminOverview } from "@/lib/admin.functions";
import { money, dateTime, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — FINORA" },
      { name: "description", content: "Platform metrics, pending approvals and recent activity." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const fn = useServerFn(adminOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
  });

  const t = data?.totals;
  const max = Math.max(1, ...(data?.series ?? []).map((s) => Math.max(s.deposits, s.withdrawals)));

  return (
    <AdminShell area="dashboard">
      <PageHeader
        title="Platform overview"
        description="Live metrics calculated from platform records."
      />

      {isLoading || !t ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Users"
              value={t.users}
              hint={`${t.activeUsers} active`}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="Approved deposits"
              value={money(t.totalDeposits)}
              hint={`${t.pendingDeposits} awaiting review`}
              icon={<ArrowDownToLine className="h-4 w-4" />}
              tone="accent"
            />
            <StatCard
              label="Paid withdrawals"
              value={money(t.totalWithdrawals)}
              hint={`${t.pendingWithdrawals} in queue`}
              icon={<ArrowUpFromLine className="h-4 w-4" />}
            />
            <StatCard
              label="Capital invested"
              value={money(t.totalInvested)}
              hint={`${t.activeInvestments} active investments`}
              icon={<LineChart className="h-4 w-4" />}
              tone="primary"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Referral commissions"
              value={money(t.referralCommissions)}
              icon={<Wallet className="h-4 w-4" />}
            />
            <StatCard
              label="Open tickets"
              value={t.openTickets}
              icon={<LifeBuoy className="h-4 w-4" />}
            />
            <StatCard label="Ledger entries" value={data.transactionCount} />
          </div>

          <div className="surface-card mt-6 p-5">
            <h2 className="text-sm font-semibold">Last 14 days</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Approved deposits vs paid withdrawals.
            </p>
            <div className="mt-5 flex h-40 items-end gap-2">
              {data.series.map((s) => (
                <div key={s.day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-32 w-full items-end justify-center gap-1">
                    <div
                      className="bg-accent/70 w-1/2 rounded-t"
                      style={{ height: `${(s.deposits / max) * 100}%` }}
                      title={`Deposits ${money(s.deposits)}`}
                    />
                    <div
                      className="bg-primary/60 w-1/2 rounded-t"
                      style={{ height: `${(s.withdrawals / max) * 100}%` }}
                      title={`Withdrawals ${money(s.withdrawals)}`}
                    />
                  </div>
                  <span className="text-muted-foreground text-[0.6rem]">{s.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent ledger activity</h2>
                <Link to="/admin/transactions" className="text-accent text-xs font-medium">
                  View ledger
                </Link>
              </div>
              {data.recentTransactions.length ? (
                <ul className="divide-border/70 divide-y text-sm">
                  {data.recentTransactions.map((tx) => (
                    <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{titleCase(tx.type)}</p>
                        <p className="text-muted-foreground text-xs">
                          {tx.reference} · {dateTime(tx.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="num font-medium">{money(tx.amount)}</p>
                        <StatusBadge status={tx.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No transactions yet" />
              )}
            </div>

            <div className="surface-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Newest users</h2>
                <Link to="/admin/users" className="text-accent text-xs font-medium">
                  Manage users
                </Link>
              </div>
              {data.recentUsers.length ? (
                <ul className="divide-border/70 divide-y text-sm">
                  {data.recentUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.full_name || "Unnamed"}</p>
                        <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {dateTime(u.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No users yet" />
              )}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
