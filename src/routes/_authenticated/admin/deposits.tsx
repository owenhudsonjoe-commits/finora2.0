import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  ImageIcon,
  Sparkles,
  AlertCircle,
  Clock,
  User,
  Hash,
} from "lucide-react";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, StatusBadge, LoadingRows, EmptyState } from "@/components/finora/primitives";
import { adminListDeposits, adminDecideDeposit } from "@/lib/admin.functions";
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

type AdminDeposit = {
  id: string;
  user_id: string;
  amount: number | string;
  payment_method: string | null;
  external_txn_id: string | null;
  screenshot_path: string | null;
  screenshot_url?: string | null;
  status: string;
  plan_id: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  plan?: {
    id: string;
    name: string;
    duration_days: number;
    daily_earning: number;
    investment_amount: number;
    currency: string;
  } | null;
};

const FILTERS = ["pending_verification", "approved", "rejected", "all"] as const;

export const Route = createFileRoute("/_authenticated/admin/deposits")({
  head: () => ({
    meta: [
      { title: "Deposits & Plan Activations — FINORA admin" },
      {
        name: "description",
        content: "Verify payment proofs, approve deposits, and activate 60-day investment plans.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DepositsPage,
});

function DepositsPage() {
  const list = useServerFn(adminListDeposits);
  const decide = useServerFn(adminDecideDeposit);
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending_verification");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [inspectDeposit, setInspectDeposit] = useState<AdminDeposit | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<AdminDeposit | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-deposits"],
    queryFn: () => list(),
    refetchInterval: 15_000,
  });

  const mutation = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject"; reason: string }) =>
      decide({ data: v }),
    onSuccess: async (res, variables) => {
      if (res && typeof res === "object" && "ok" in res && res.ok === false) {
        toast.error((res as { message?: string }).message ?? "Operation failed.");
        return;
      }
      if (variables.action === "approve") {
        toast.success("Payment verified! Plan activated and user notified.");
      } else {
        toast.success("Deposit rejected and user notified with reason.");
      }
      setRejectId(null);
      setReason("");
      setConfirmApprove(null);
      setInspectDeposit(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-investments"] });
    },
    onError: () => toast.error("The operation could not be completed."),
  });

  const allDeposits: AdminDeposit[] = (data as AdminDeposit[]) ?? [];
  const rows = allDeposits.filter((d: AdminDeposit) => filter === "all" || d.status === filter);
  const pendingPlansCount = allDeposits.filter(
    (d: AdminDeposit) => d.status === "pending_verification" && d.plan_id,
  ).length;

  return (
    <AdminShell area="deposits">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Deposits & Plan Activations"
          description="Review payment proofs below. Approving a plan activation directly initiates the user's 60-day earning term."
        />
        {pendingPlansCount > 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <Clock className="h-4 w-4 animate-spin text-amber-500" />
            <span>
              {pendingPlansCount} Plan Activation{pendingPlansCount > 1 ? "s" : ""} Awaiting Review
            </span>
          </div>
        ) : null}
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f === "all"
              ? allDeposits.length
              : allDeposits.filter((d: AdminDeposit) => d.status === f).length;
          return (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="text-xs"
            >
              {f === "all" ? "All Deposits" : f.replace(/_/g, " ")} ({count})
            </Button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No requests to review"
          description="There are currently no deposits or plan activations with this status."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((d: AdminDeposit) => {
            const isPlanActivation = Boolean(d.plan_id);
            const isPending = d.status === "pending_verification" || d.status === "submitted";

            return (
              <div
                key={d.id}
                className={`surface-card rounded-xl border p-5 transition-all duration-150 ${
                  isPlanActivation && isPending
                    ? "border-primary/40 bg-primary/[0.02] shadow-sm"
                    : "border-border/70"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: User & Plan Details */}
                  <div className="space-y-2 min-w-0 flex-1">
                    {/* Plan Activation Header Tag */}
                    {isPlanActivation ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary border border-primary/20">
                          <Sparkles className="h-3 w-3" />
                          Plan Activation: {d.plan?.name || "Direct Plan Subscription"}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          60 Days Duration
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Wallet Balance Deposit
                      </span>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="num text-2xl font-bold text-foreground">
                        {money(d.amount)}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {d.user?.full_name || "Unknown Member"} ({d.user?.email || "No email"})
                      </span>
                      {d.user?.phone ? <span>Phone: {d.user.phone}</span> : null}
                      <span className="flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" />
                        Ref / TID: <strong>{d.external_txn_id || "None provided"}</strong>
                      </span>
                      <span>Channel: {d.payment_method || "QR Code"}</span>
                      <span>Submitted: {dateTime(d.created_at)}</span>
                    </div>

                    {d.rejection_reason ? (
                      <p className="text-xs text-destructive flex items-center gap-1 pt-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Rejection Reason: {d.rejection_reason}
                      </p>
                    ) : null}
                  </div>

                  {/* Middle: Screenshot Thumbnail */}
                  <div className="shrink-0 flex items-center gap-3">
                    {d.screenshot_url ? (
                      <div
                        onClick={() => setInspectDeposit(d)}
                        className="group relative cursor-pointer overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-1 bg-muted/20"
                        title="Click to view full screenshot"
                      >
                        <img
                          src={d.screenshot_url}
                          alt="Receipt Thumbnail"
                          className="h-16 w-20 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[0.65rem] font-medium">
                          View
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-16 w-20 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center p-1 text-[0.65rem] text-muted-foreground">
                        <ImageIcon className="h-4 w-4 mb-0.5" />
                        No Proof
                      </div>
                    )}

                    {d.screenshot_url ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => setInspectDeposit(d)}
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-primary" /> Inspect Proof
                      </Button>
                    ) : null}
                  </div>

                  {/* Right: Actions */}
                  {isPending ? (
                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                      <Button
                        size="sm"
                        disabled={mutation.isPending}
                        onClick={() => setConfirmApprove(d)}
                        className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle className="mr-1.5 h-4 w-4" />
                        {isPlanActivation ? "Approve & Activate Plan" : "Approve Deposit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mutation.isPending}
                        onClick={() => {
                          setRejectId(d.id);
                          setReason("");
                        }}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="mr-1.5 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <p>Processed</p>
                      {d.reviewed_at ? <p>{dateTime(d.reviewed_at)}</p> : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Inspection Lightbox Modal */}
      <Dialog open={Boolean(inspectDeposit)} onOpenChange={(o) => !o && setInspectDeposit(null)}>
        <DialogContent className="sm:max-w-2xl text-center max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Screenshot Verification</DialogTitle>
            <DialogDescription>
              {inspectDeposit?.user?.full_name} · {money(inspectDeposit?.amount)} · Ref:{" "}
              {inspectDeposit?.external_txn_id || "N/A"}
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 flex justify-center overflow-hidden rounded-xl border border-border bg-black/5 p-2">
            {inspectDeposit?.screenshot_url ? (
              <img
                src={inspectDeposit.screenshot_url}
                alt="Payment Receipt"
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
            ) : (
              <p className="py-12 text-sm text-muted-foreground">No screenshot uploaded</p>
            )}
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-border">
            {inspectDeposit?.screenshot_url ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open(inspectDeposit.screenshot_url, "_blank")}
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open Full Image
              </Button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setInspectDeposit(null)}>
                Close
              </Button>
              {inspectDeposit &&
              (inspectDeposit.status === "pending_verification" ||
                inspectDeposit.status === "submitted") ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setRejectId(inspectDeposit.id);
                      setInspectDeposit(null);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setConfirmApprove(inspectDeposit);
                      setInspectDeposit(null);
                    }}
                  >
                    {inspectDeposit.plan_id ? "Approve & Activate Plan" : "Approve Deposit"}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <Dialog open={Boolean(confirmApprove)} onOpenChange={(o) => !o && setConfirmApprove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmApprove?.plan_id
                ? "Approve & Activate Investment Plan"
                : "Confirm Deposit Approval"}
            </DialogTitle>
            <DialogDescription>
              {confirmApprove?.plan_id
                ? `Approving this payment will instantly activate the ${confirmApprove.plan?.name || "investment"} plan for ${confirmApprove?.user?.full_name || "the user"} for 60 days.`
                : `Are you sure you want to verify and credit ${money(confirmApprove?.amount)} to ${confirmApprove?.user?.full_name}?`}
            </DialogDescription>
          </DialogHeader>

          {confirmApprove?.plan_id ? (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2 text-xs">
              <p className="font-semibold text-sm text-foreground">Activation Effects:</p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>
                  Plan status becomes <strong>ACTIVE</strong> immediately
                </li>
                <li>
                  <strong>60-day term</strong> and daily earning accruals start now
                </li>
                <li>Financial transaction ledger is updated</li>
                <li>Referral commission is automatically credited if applicable</li>
                <li>Member receives instant notification of activation</li>
              </ul>
            </div>
          ) : null}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setConfirmApprove(null)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate({
                  id: confirmApprove.id,
                  action: "approve",
                  reason: "",
                })
              }
            >
              {mutation.isPending ? "Activating..." : "Yes, Approve & Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={Boolean(rejectId)} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payment Submission</DialogTitle>
            <DialogDescription>
              Provide a clear reason for the member (e.g. invalid receipt, incorrect amount, fake
              screenshot).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. Payment receipt could not be verified in official bank statement, or transaction ID is invalid."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending || reason.trim().length < 3}
              onClick={() => mutation.mutate({ id: rejectId!, action: "reject", reason })}
            >
              {mutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
