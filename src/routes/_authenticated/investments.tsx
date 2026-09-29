import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, ExternalLink, ShieldAlert, ArrowRight, ImageIcon } from "lucide-react";
import { AppShell } from "@/components/finora/app-shell";
import { PageHeader, StatusBadge, EmptyState, LoadingRows } from "@/components/finora/primitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { money, dateOnly, dateTime } from "@/lib/format";
import { getInvestments } from "@/lib/finora.functions";

export const Route = createFileRoute("/_authenticated/investments")({
  head: () => ({
    meta: [
      { title: "My investments — FINORA" },
      {
        name: "description",
        content: "Track every FINORA investment, its locked terms, pending approvals and progress.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "My investments — FINORA" },
      { property: "og:description", content: "Track your investments and their locked terms." },
    ],
  }),
  component: InvestmentsPage,
});

function progressOf(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e <= s) return 0;
  return Math.min(100, Math.max(0, ((Date.now() - s) / (e - s)) * 100));
}

function InvestmentsPage() {
  const [proofDialogUrl, setProofDialogUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["investments"],
    queryFn: () => getInvestments(),
  });

  const investments = Array.isArray(data) ? data : (data?.investments ?? []);
  const pendingActivations = Array.isArray(data) ? [] : (data?.pendingActivations ?? []);

  const hasAny = investments.length > 0 || pendingActivations.length > 0;

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="My investments"
          description="Track your locked 60-day investments, pending plan activations, and daily returns."
        />
        <Button asChild>
          <Link to="/invest">
            Activate New Plan <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-6">
          <LoadingRows rows={5} />
        </div>
      ) : !hasAny ? (
        <div className="mt-6">
          <EmptyState
            title="You have no investments"
            description="Choose a plan to activate directly via QR code payment and start earning daily returns."
            action={
              <Button asChild size="sm">
                <Link to="/invest">Browse plans</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Pending Plan Activations Section */}
          {pendingActivations.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Pending Plan Activations ({pendingActivations.length})
                </h2>
              </div>

              <div className="grid gap-3">
                {pendingActivations.map((dep) => (
                  <div
                    key={dep.id}
                    className="surface-card border-amber-500/30 bg-amber-500/[0.02] p-5 rounded-xl border flex flex-wrap items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base">
                          {dep.plan?.name ? `${dep.plan.name} Plan` : "Investment Plan"}
                        </span>
                        <StatusBadge status={dep.status} />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Submitted: {dateTime(dep.created_at)} · Payment:{" "}
                        {dep.payment_method || "QR Transfer"}
                        {dep.external_txn_id ? ` · Ref: ${dep.external_txn_id}` : ""}
                      </p>

                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        Awaiting administrator review. Once approved, your 60-day term and daily
                        earnings begin.
                      </p>

                      {dep.rejection_reason ? (
                        <p className="text-xs text-destructive flex items-center gap-1.5 pt-1">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                          Rejection Reason: {dep.rejection_reason}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <p className="num text-xl font-bold text-foreground">
                        {money(Number(dep.amount))}
                      </p>

                      {dep.screenshot_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => setProofDialogUrl(dep.screenshot_url)}
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-primary" /> View Submitted Proof
                        </Button>
                      ) : (
                        <span className="text-[0.7rem] text-muted-foreground">Proof uploaded</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Active and Completed Investments */}
          {investments.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Active & Matured Portfolios ({investments.length})
              </h2>

              <div className="space-y-4">
                {investments.map((inv) => {
                  const pct = progressOf(inv.start_date, inv.end_date);
                  return (
                    <article
                      key={inv.id}
                      className="surface-card p-5 rounded-xl border border-border/70"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-base">{inv.plan_name}</h2>
                            <StatusBadge status={inv.status} />
                          </div>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {inv.start_date ? `Started ${dateOnly(inv.start_date)}` : "Not started"}
                            {inv.end_date ? ` · Matures ${dateOnly(inv.end_date)}` : ""}
                          </p>
                        </div>
                        <p className="num text-lg font-semibold">{money(Number(inv.amount))}</p>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                        <Cell
                          label="Daily earning"
                          value={money(Number(inv.daily_earning))}
                          tone="success"
                        />
                        <Cell label="Duration" value={`${inv.duration_days} days`} />
                        <Cell label="Earned so far" value={money(Number(inv.total_earned))} />
                        <Cell
                          label="Fees"
                          value={Number(inv.fees) > 0 ? money(Number(inv.fees)) : "None"}
                        />
                      </dl>

                      {inv.status === "active" ? (
                        <div className="mt-5">
                          <div className="text-muted-foreground mb-1.5 flex justify-between text-xs">
                            <span>Term progress (60 Days Term)</span>
                            <span className="num font-semibold">{Math.round(pct)}%</span>
                          </div>
                          <Progress value={pct} />
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {/* User's Payment Proof Screenshot Lightbox */}
      <Dialog open={Boolean(proofDialogUrl)} onOpenChange={(o) => !o && setProofDialogUrl(null)}>
        <DialogContent className="sm:max-w-xl text-center">
          <DialogHeader>
            <DialogTitle>Submitted Payment Screenshot</DialogTitle>
            <DialogDescription>
              Receipt proof on file for administrator verification
            </DialogDescription>
          </DialogHeader>
          <div className="my-3 flex justify-center overflow-hidden rounded-xl border border-border bg-black/5 p-2">
            {proofDialogUrl ? (
              <img
                src={proofDialogUrl}
                alt="Submitted Proof"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            ) : null}
          </div>
          <div className="flex justify-between items-center">
            {proofDialogUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open(proofDialogUrl, "_blank")}
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open full image
              </Button>
            ) : (
              <span />
            )}
            <Button size="sm" onClick={() => setProofDialogUrl(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">{label}</dt>
      <dd
        className={`num mt-0.5 font-medium ${tone === "success" ? "text-success font-semibold text-emerald-600 dark:text-emerald-400" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
