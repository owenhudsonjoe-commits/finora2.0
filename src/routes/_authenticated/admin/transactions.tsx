import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, StatusBadge, LoadingRows, EmptyState } from "@/components/finora/primitives";
import { adminListTransactions } from "@/lib/admin.functions";
import { money, dateTime, titleCase } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TYPES = [
  "all",
  "deposit",
  "withdrawal",
  "investment",
  "return",
  "referral_commission",
  "fee",
  "adjustment",
];
const PAGE = 25;

export const Route = createFileRoute("/_authenticated/admin/transactions")({
  head: () => ({
    meta: [
      { title: "Ledger — FINORA admin" },
      { name: "description", content: "Immutable record of every money movement on the platform." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const fn = useServerFn(adminListTransactions);
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({ queryKey: ["admin-transactions"], queryFn: () => fn() });

  const rows = (data ?? []).filter((t) => {
    if (type !== "all" && t.type !== type) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.reference.toLowerCase().includes(q) ||
      (t.user?.email ?? "").toLowerCase().includes(q) ||
      (t.user?.full_name ?? "").toLowerCase().includes(q)
    );
  });
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <AdminShell area="transactions">
      <PageHeader title="Ledger" description="Every credit and debit recorded by the platform." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search reference or member"
          className="max-w-xs"
          aria-label="Search ledger"
        />
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={type === t ? "default" : "outline"}
              onClick={() => {
                setType(t);
                setPage(0);
              }}
            >
              {t === "all" ? "All" : titleCase(t)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : view.length === 0 ? (
        <EmptyState title="No ledger entries" description="Nothing matches the current filters." />
      ) : (
        <>
          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Reference</th>
                  <th className="px-4 py-3 text-left font-medium">Member</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-border/70 divide-y">
                {view.map((t) => (
                  <tr key={t.id}>
                    <td className="num px-4 py-3">{t.reference}</td>
                    <td className="px-4 py-3">
                      <p>{t.user?.full_name || "—"}</p>
                      <p className="text-muted-foreground text-xs">{t.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">{titleCase(t.type)}</td>
                    <td className="num px-4 py-3 text-right">{money(t.amount, t.currency)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-right text-xs">
                      {dateTime(t.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {page + 1} of {pages} · {rows.length} entries
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
