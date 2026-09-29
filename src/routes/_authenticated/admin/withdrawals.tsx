import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, StatusBadge, LoadingRows, EmptyState } from "@/components/finora/primitives";
import { adminListWithdrawals, adminSetWithdrawalStatus } from "@/lib/admin.functions";
import { money, dateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FILTERS = ["pending", "under_review", "approved", "paid", "rejected", "all"] as const;

const NEXT: Record<string, string[]> = {
  pending: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["paid", "rejected"],
};

export const Route = createFileRoute("/_authenticated/admin/withdrawals")({
  head: () => ({
    meta: [
      { title: "Withdrawals — FINORA admin" },
      {
        name: "description",
        content: "Process payout requests through the withdrawal status workflow.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WithdrawalsPage,
});

function WithdrawalsPage() {
  const list = useServerFn(adminListWithdrawals);
  const setStatus = useServerFn(adminSetWithdrawalStatus);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [reject, setReject] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: () => list(),
    refetchInterval: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (v: { id: string; status: string; reason: string }) => setStatus({ data: v }),
    onSuccess: async (res) => {
      if (res && typeof res === "object" && "ok" in res && res.ok === false) {
        toast.error((res as { message?: string }).message ?? "The request could not be updated.");
        return;
      }
      toast.success("Withdrawal updated.");
      setReject(null);
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: () => toast.error("The request could not be updated."),
  });

  const rows = (data ?? []).filter((w) => filter === "all" || w.status === filter);

  return (
    <AdminShell area="withdrawals">
      <PageHeader
        title="Withdrawals"
        description="Move payout requests through review, approval and settlement."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <LoadingRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing in this queue" />
      ) : (
        <div className="space-y-3">
          {rows.map((w) => (
            <div
              key={w.id}
              className="surface-card flex flex-wrap items-start justify-between gap-4 p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{money(w.amount)}</p>
                  <StatusBadge status={w.status} />
                  <span className="text-muted-foreground text-xs">
                    fee {money(w.fee)} · net {money(w.net_amount)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {w.user?.full_name || "Unknown"} · {w.user?.email}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {w.method} · {w.account_title} · {w.account_number}
                  {w.bank_name ? ` · ${w.bank_name}` : ""}
                  {w.iban ? ` · ${w.iban}` : ""}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Requested {dateTime(w.created_at)}
                </p>
                {w.rejection_reason ? (
                  <p className="text-destructive mt-2 text-xs">Reason: {w.rejection_reason}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {(NEXT[w.status] ?? []).map((s) =>
                  s === "rejected" ? (
                    <Button key={s} size="sm" variant="outline" onClick={() => setReject(w.id)}>
                      Reject
                    </Button>
                  ) : (
                    <Button
                      key={s}
                      size="sm"
                      variant={s === "paid" ? "default" : "secondary"}
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ id: w.id, status: s, reason: "" })}
                    >
                      Mark {s.replace(/_/g, " ")}
                    </Button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!reject} onOpenChange={(o) => !o && setReject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject withdrawal</DialogTitle>
            <DialogDescription>
              The reserved amount is returned to the member's available balance and they are
              notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReject(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending || reason.trim().length < 3}
              onClick={() => mutation.mutate({ id: reject!, status: "rejected", reason })}
            >
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
