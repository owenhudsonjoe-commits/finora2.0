import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, Clock } from "lucide-react";
import { AppShell } from "@/components/finora/app-shell";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingRows,
} from "@/components/finora/primitives";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money, dateTime, titleCase } from "@/lib/format";
import { getWalletData } from "@/lib/finora.functions";

export const walletQuery = { queryKey: ["wallet"] as const, queryFn: () => getWalletData() };

export const Route = createFileRoute("/_authenticated/wallet/")({
  head: () => ({
    meta: [
      { title: "Wallet — FINORA" },
      {
        name: "description",
        content: "Your FINORA balance, deposits, withdrawals and full transaction ledger.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Wallet — FINORA" },
      { property: "og:description", content: "Balance, deposits, withdrawals and ledger." },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { data, isLoading } = useQuery(walletQuery);
  const w = data?.wallet;

  return (
    <AppShell>
      <PageHeader
        title="Wallet"
        description="Every movement of money on your account, recorded with a reference."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available"
          value={money(Number(w?.available ?? 0))}
          icon={<WalletIcon className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard label="Invested" value={money(Number(w?.invested ?? 0))} />
        <StatCard
          label="Pending withdrawals"
          value={money(Number(w?.pending ?? 0))}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard label="Total earnings" value={money(Number(w?.total_earnings ?? 0))} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/wallet/deposit">
            <ArrowDownLeft className="mr-1.5 h-4 w-4" /> Deposit
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/wallet/withdraw">
            <ArrowUpRight className="mr-1.5 h-4 w-4" /> Withdraw
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="ledger" className="mt-8">
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="surface-card mt-4 p-5">
          {isLoading ? (
            <LoadingRows rows={6} />
          ) : (data?.transactions ?? []).length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Deposits, investments and earnings will appear here."
            />
          ) : (
            <ul className="divide-y">
              {data?.transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{titleCase(t.type)}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {t.reference} · {dateTime(t.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm font-semibold">{money(Number(t.amount))}</p>
                    <StatusBadge status={t.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="deposits" className="surface-card mt-4 p-5">
          {(data?.deposits ?? []).length === 0 ? (
            <EmptyState
              title="No deposits yet"
              description="Submit a deposit to fund your wallet."
            />
          ) : (
            <ul className="divide-y">
              {data?.deposits.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{money(Number(d.amount))}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {d.payment_method || "Manual transfer"} · {dateTime(d.created_at)}
                    </p>
                    {d.rejection_reason ? (
                      <p className="text-destructive mt-1 text-xs">{d.rejection_reason}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="withdrawals" className="surface-card mt-4 p-5">
          {(data?.withdrawals ?? []).length === 0 ? (
            <EmptyState
              title="No withdrawals yet"
              description="Request a withdrawal when you're ready to cash out."
            />
          ) : (
            <ul className="divide-y">
              {data?.withdrawals.map((wd) => (
                <li key={wd.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {money(Number(wd.amount))}{" "}
                      <span className="text-muted-foreground text-xs">
                        (net {money(Number(wd.net_amount))})
                      </span>
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {wd.method} · {dateTime(wd.created_at)}
                    </p>
                    {wd.rejection_reason ? (
                      <p className="text-destructive mt-1 text-xs">{wd.rejection_reason}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={wd.status} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
