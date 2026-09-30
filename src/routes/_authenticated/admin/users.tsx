import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CheckCircle2,
  Ban,
  Trash2,
  Sliders,
  ShieldAlert,
  Check,
  RefreshCw,
  Eye,
} from "lucide-react";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, StatusBadge, LoadingRows, EmptyState } from "@/components/finora/primitives";
import {
  adminListUsers,
  adminSetUserStatus,
  adminAdjustBalance,
  adminApproveUser,
  adminDeleteUser,
  adminGetUserDetail,
} from "@/lib/admin.functions";
import { money, dateOnly } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & Accounts — FINORA admin" },
      {
        name: "description",
        content: "Review platform accounts, approve, deactivate, or remove members.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsersPage,
});

export function UsersPage() {
  const list = useServerFn(adminListUsers);
  const setStatus = useServerFn(adminSetUserStatus);
  const approveUser = useServerFn(adminApproveUser);
  const deleteUser = useServerFn(adminDeleteUser);
  const adjust = useServerFn(adminAdjustBalance);
  const getUserDetail = useServerFn(adminGetUserDetail);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended">(
    "all",
  );
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const userDetailQuery = useQuery({
    queryKey: ["admin-user-detail", inspectUserId],
    queryFn: () => (inspectUserId ? getUserDetail({ data: { id: inspectUserId } }) : null),
    enabled: Boolean(inspectUserId),
  });

  const statusMutation = useMutation({
    mutationFn: (v: { id: string; status: "active" | "suspended" | "pending" | "deactivated" }) =>
      setStatus({ data: v }),
    onSuccess: async () => {
      toast.success("Account status updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("The status could not be updated."),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveUser({ data: { id } }),
    onSuccess: async () => {
      toast.success("Account approved and activated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Account approval failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser({ data: { id } }),
    onSuccess: async () => {
      toast.success("Account permanently removed from platform.");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Could not remove account."),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjust({ data: { userId: target!.id, amount: Number(amount), direction, reason } }),
    onSuccess: async (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Balance adjusted and recorded in the ledger.");
      setTarget(null);
      setAmount("");
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("The adjustment could not be applied."),
  });

  const rows = (data ?? []).filter((u) => {
    if (statusFilter !== "all") {
      if (statusFilter === "suspended" && u.status !== "suspended" && u.status !== "deactivated") {
        return false;
      }
      if (statusFilter !== "suspended" && u.status !== statusFilter) {
        return false;
      }
    }

    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      (u.phone ?? "").includes(q) ||
      u.referral_code?.toLowerCase().includes(q)
    );
  });

  const pendingCount = (data ?? []).filter((u) => u.status === "pending").length;

  return (
    <AdminShell area="users">
      <PageHeader
        title="Member Accounts & Management"
        description="Approve new accounts, deactivate or remove users, and inspect member balances."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone or referral code…"
          className="max-w-sm"
          aria-label="Search users"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
          >
            All Accounts ({data?.length ?? 0})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
          >
            Active
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            className={pendingCount > 0 ? "border-amber-500/50 text-amber-500" : ""}
          >
            Pending Approval {pendingCount > 0 ? `(${pendingCount})` : ""}
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "suspended" ? "default" : "outline"}
            onClick={() => setStatusFilter("suspended")}
          >
            Deactivated
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No users found"
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your search or status filter."
              : "No registered users in the platform yet."
          }
        />
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-right font-medium">Available</th>
                <th className="px-4 py-3 text-right font-medium">Invested</th>
                <th className="px-4 py-3 text-center font-medium">Referrals</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Account Controls</th>
              </tr>
            </thead>
            <tbody className="divide-border/70 divide-y">
              {rows.map((u) => {
                const isApproved = u.status === "active";
                const isSuspended = u.status === "suspended" || u.status === "deactivated";

                return (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div
                        onClick={() => setInspectUserId(u.id)}
                        className="cursor-pointer group"
                        title="Click to view full user profile & financial history"
                      >
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {u.full_name || "Unnamed"}
                          <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {u.email} {u.phone ? `· ${u.phone}` : ""} · joined{" "}
                          {dateOnly(u.created_at)}
                        </p>
                        <p className="font-mono text-[0.7rem] text-muted-foreground">
                          Ref: {u.referral_code}
                        </p>
                      </div>
                    </td>
                    <td className="num px-4 py-3 text-right font-mono font-medium">
                      {money(u.wallet?.available ?? 0)}
                    </td>
                    <td className="num px-4 py-3 text-right font-mono text-muted-foreground">
                      {money(u.invested)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">{u.referralCount}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* APPROVE ACTION */}
                        {!isApproved && (
                          <Button
                            size="sm"
                            variant="default"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(u.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-8 px-2.5 text-xs"
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> Approve
                          </Button>
                        )}

                        {/* ADJUST BALANCE */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTarget({ id: u.id, name: u.full_name || u.email })}
                          className="h-8 px-2 text-xs"
                        >
                          <Sliders className="mr-1 h-3.5 w-3.5" /> Adjust
                        </Button>

                        {/* DEACTIVATE / ACTIVATE */}
                        <Button
                          size="sm"
                          variant={isSuspended ? "secondary" : "ghost"}
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({
                              id: u.id,
                              status: isSuspended ? "active" : "deactivated",
                            })
                          }
                          className="h-8 px-2 text-xs"
                        >
                          {isSuspended ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" />{" "}
                              Activate
                            </>
                          ) : (
                            <>
                              <Ban className="mr-1 h-3.5 w-3.5 text-amber-500" /> Deactivate
                            </>
                          )}
                        </Button>

                        {/* REMOVE ACCOUNT */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setDeleteTarget({
                              id: u.id,
                              name: u.full_name || "Member",
                              email: u.email,
                            })
                          }
                          className="h-8 px-2 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* BALANCE ADJUSTMENT DIALOG */}
      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Member Balance</DialogTitle>
            <DialogDescription>
              Manual balance adjustments are written to the ledger, credited/debited from the member
              wallet, and logged in audit logs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">Target: {target?.name}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={direction === "credit" ? "default" : "outline"}
                size="sm"
                onClick={() => setDirection("credit")}
              >
                Credit (Add Funds)
              </Button>
              <Button
                type="button"
                variant={direction === "debit" ? "default" : "outline"}
                size="sm"
                onClick={() => setDirection("debit")}
              >
                Debit (Deduct Funds)
              </Button>
            </div>
            <div>
              <Label htmlFor="adj-amount">Amount (PKR)</Label>
              <Input
                id="adj-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="adj-reason">Reason</Label>
              <Textarea
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Administrative adjustment description…"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                adjustMutation.isPending || !(Number(amount) > 0) || reason.trim().length < 3
              }
              onClick={() => adjustMutation.mutate()}
            >
              {adjustMutation.isPending ? "Applying…" : "Apply adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REMOVE ACCOUNT CONFIRMATION DIALOG */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">Remove Member Account</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to remove{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong> (
              <span className="font-mono">{deleteTarget?.email}</span>)? This will remove their
              profile and records from the active platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Removing…" : "Yes, Remove Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
