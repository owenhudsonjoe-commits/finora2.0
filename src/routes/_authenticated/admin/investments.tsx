import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle,
  XCircle,
  ImageIcon,
  Sparkles,
  ExternalLink,
  User,
  Hash,
} from "lucide-react";
import { AdminShell } from "@/components/finora/admin-shell";
import {
  PageHeader,
  StatusBadge,
  LoadingRows,
  EmptyState,
  StatCard,
} from "@/components/finora/primitives";
import { adminListInvestments, adminDecideDeposit } from "@/lib/admin.functions";
import { money, dateOnly, dateTime } from "@/lib/format";
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

type AdminInvestmentItem = {
  id: string;
  user_id: string;
  plan_name: string;
  amount: number | string;
  daily_earning: number | string;
  total_earned: number | string;
  duration_days: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
    phone?: string | null;
  } | null;
};

type PendingActivationItem = {
  id: string;
  user_id: string;
  amount: number | string;
  payment_method: string | null;
  external_txn_id: string | null;
  screenshot_path: string | null;
  screenshot_url?: string | null;
  status: string;
  plan_id: string | null;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
    phone?: string | null;
  } | null;
  plan?: {
    id: string;
    name: string;
    duration_days: number;
    daily_earning: number;
    investment_amount: number;
  } | null;
};

const FILTERS = ["all", "active", "pending_activation", "completed", "cancelled"] as const;

export const Route = createFileRoute("/_authenticated/admin/investments")({
  head: () => ({
    meta: [
      { title: "Investments — FINORA admin" },
      {
        name: "description",
        content:
          "Monitor active 60-day investments, pending plan activations, and approve subscriptions.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvestmentsPage,
});

function InvestmentsPage() {
  const fn = useServerFn(adminListInvestments);
  const decide = useServerFn(adminDecideDeposit);
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [inspectProof, setInspectProof] = useState<PendingActivationItem | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-investments"],
    queryFn: () => fn(),
    refetchInterval: 15_000,
  });

  const mutation = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject"; reason: string }) =>
      decide({ data: v }),
    onSuccess: async (_, variables) => {
      if (variables.action === "approve") {
        toast.success("Plan activated! The 60-day earning cycle has started for the user.");
      } else {
        toast.success("Plan activation request rejected.");
      }
      setRejectId(null);
      setRejectReason("");
      setInspectProof(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-investments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
    },
    onError: () => toast.error("Could not complete the action."),
  });

  const allInvestments: AdminInvestmentItem[] = Array.isArray(data)
    ? (data as AdminInvestmentItem[])
    : ((data?.investments as AdminInvestmentItem[]) ?? []);
  const pendingActivations: PendingActivationItem[] = Array.isArray(data)
    ? []
    : ((data?.pendingActivations as PendingActivationItem[]) ?? []);

  const rows = allInvestments.filter((i: AdminInvestmentItem) => {
    if (filter === "all") return true;
    if (filter === "pending_activation") return false;
    return i.status === filter;
  });

  const totalActive = allInvestments
    .filter((i: AdminInvestmentItem) => i.status === "active")
    .reduce((s: number, i: AdminInvestmentItem) => s + Number(i.amount), 0);
  const totalEarned = allInvestments.reduce(
    (s: number, i: AdminInvestmentItem) => s + Number(i.total_earned),
    0,
  );

  return (
    <AdminShell area="investments">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Investments"
          description="Each investment runs on a 60-day term. Verify pending plan activations and approve members directly."
        />
        {pendingActivations.length > 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <Clock className="h-4 w-4 animate-spin text-amber-500" />
            <span>
              {pendingActivations.length} Pending Plan Activation
              {pendingActivations.length > 1 ? "s" : ""}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mb-5 mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active capital" value={money(totalActive)} />
        <StatCard label="Earnings credited" value={money(totalEarned)} />
        <StatCard
          label="Active Portfolios"
          value={allInvestments.filter((i: AdminInvestmentItem) => i.status === "active").length}
        />
      </div>

      {/* Pending Plan Activations Box */}
      {pendingActivations.length > 0 && (filter === "all" || filter === "pending_activation") ? (
        <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/[0.02] p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Pending Plan Activations ({pendingActivations.length})
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Requires Administrator Verification
            </span>
          </div>

          <div className="space-y-3">
            {pendingActivations.map((dep: PendingActivationItem) => (
              <div
                key={dep.id}
                className="surface-card rounded-lg border border-border/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">
                      {dep.plan?.name || "Direct Plan Subscription"}
                    </span>
                    <span className="num font-semibold text-primary">
                      {money(Number(dep.amount))}
                    </span>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-amber-600 dark:text-amber-400 uppercase">
                      60-Day Term
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {dep.user?.full_name || "Member"} ({dep.user?.email})
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      Ref: <strong>{dep.external_txn_id || "None"}</strong>
                    </span>
                    <span>Submitted: {dateTime(dep.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {dep.screenshot_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setInspectProof(dep)}
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-primary" /> View Proof
                    </Button>
                  ) : null}

                  <Button
                    size="sm"
                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: dep.id, action: "approve", reason: "" })}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve & Activate
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                    disabled={mutation.isPending}
                    onClick={() => {
                      setRejectId(dep.id);
                      setRejectReason("");
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Filter Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="text-xs"
          >
            {f === "all"
              ? "All Investments"
              : f === "pending_activation"
                ? `Pending Activations (${pendingActivations.length})`
                : f.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : rows.length === 0 && filter !== "pending_activation" ? (
        <EmptyState title="No investments" description="No investment records match this filter." />
      ) : filter === "pending_activation" && pendingActivations.length === 0 ? (
        <EmptyState
          title="No pending activations"
          description="All submitted plan activations have been reviewed."
        />
      ) : (
        <div className="surface-card overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Daily Return</th>
                <th className="px-4 py-3 text-right font-medium">Total Earned</th>
                <th className="px-4 py-3 text-center font-medium">60-Day Term</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-border/70 divide-y">
              {rows.map((i: AdminInvestmentItem) => (
                <tr key={i.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{i.user?.full_name || "—"}</p>
                    <p className="text-muted-foreground text-xs">{i.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{i.plan_name}</p>
                    <p className="text-muted-foreground text-xs">{i.duration_days} days term</p>
                  </td>
                  <td className="num px-4 py-3 text-right font-semibold">{money(i.amount)}</td>
                  <td className="num px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                    {money(i.daily_earning)}
                  </td>
                  <td className="num px-4 py-3 text-right font-bold text-foreground">
                    {money(i.total_earned)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-center text-xs">
                    {dateOnly(i.start_date)} → {dateOnly(i.end_date)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={i.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Screenshot Dialog */}
      <Dialog open={Boolean(inspectProof)} onOpenChange={(o) => !o && setInspectProof(null)}>
        <DialogContent className="sm:max-w-xl text-center">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
            <DialogDescription>
              {inspectProof?.plan?.name} Plan · {money(inspectProof?.amount)} · Ref:{" "}
              {inspectProof?.external_txn_id || "N/A"}
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 flex justify-center overflow-hidden rounded-xl border border-border bg-black/5 p-2">
            {inspectProof?.screenshot_url ? (
              <img
                src={inspectProof.screenshot_url}
                alt="Proof"
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
            ) : null}
          </div>

          <div className="flex justify-between items-center pt-2">
            {inspectProof?.screenshot_url ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open(inspectProof.screenshot_url, "_blank")}
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open Full Image
              </Button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setInspectProof(null)}>
                Close
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  mutation.mutate({ id: inspectProof.id, action: "approve", reason: "" });
                }}
              >
                Approve & Activate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={Boolean(rejectId)} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Plan Activation</DialogTitle>
            <DialogDescription>
              Provide a clear reason for the member (e.g. receipt unverified or fake).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="e.g. Payment receipt could not be verified in official bank statement."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending || rejectReason.trim().length < 3}
              onClick={() =>
                mutation.mutate({ id: rejectId!, action: "reject", reason: rejectReason })
              }
            >
              {mutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
