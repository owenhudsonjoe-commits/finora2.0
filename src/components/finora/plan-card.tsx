import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicPlan } from "@/lib/public.functions";

export function PlanCard({
  plan,
  ctaTo = "/plans/$slug",
}: {
  plan: PublicPlan;
  ctaTo?: "/plans/$slug";
}) {
  const duration = plan.duration_days || 60;
  const totalReturn = Number(plan.daily_earning) * duration;
  const netGain = totalReturn - Number(plan.investment_amount);
  const breakEven =
    Number(plan.daily_earning) > 0
      ? Math.ceil(Number(plan.investment_amount) / Number(plan.daily_earning))
      : 30;

  return (
    <article
      className={cn(
        "surface-card group relative flex flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border-border/80",
        plan.featured && "border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-md",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[0.68rem] font-semibold tracking-wider uppercase text-muted-foreground">
            {plan.risk_level} Risk Tier
          </span>
          <h3 className="text-xl font-bold text-foreground mt-0.5">{plan.name}</h3>
        </div>
        {plan.featured ? (
          <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
            Recommended
          </span>
        ) : (
          <span className="rounded bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground uppercase">
            60-Day Lock
          </span>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-muted/40 p-4 border border-border/50">
        <span className="text-[0.68rem] uppercase tracking-wider text-muted-foreground block font-medium">
          Required Allocation
        </span>
        <p className="num mt-0.5 text-3xl font-extrabold text-foreground">
          {money(Number(plan.investment_amount), plan.currency)}
        </p>
        <span className="text-[0.7rem] text-muted-foreground mt-0.5 block">
          One-time capital commitment
        </span>
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-border/60 pt-4 text-xs">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground font-medium">Daily Accrual</dt>
          <dd className="num font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            +{money(Number(plan.daily_earning), plan.currency)}/day
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Contract Duration</dt>
          <dd className="num font-medium">{duration} Days</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Break-Even Point</dt>
          <dd className="num font-semibold text-sky-600 dark:text-sky-400">
            Day {breakEven} (100% Recouped)
          </dd>
        </div>
        <div className="flex items-center justify-between border-t border-border/40 pt-2">
          <dt className="font-semibold text-foreground">Total Maturity Payout</dt>
          <dd className="num font-bold text-foreground text-sm">
            {money(totalReturn, plan.currency)}
          </dd>
        </div>
        <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
          <dt>Net Profit Surplus</dt>
          <dd className="num font-semibold text-emerald-600 dark:text-emerald-400">
            +{money(netGain, plan.currency)} (+100%)
          </dd>
        </div>
      </dl>

      <div className="mt-5 pt-1 border-t border-border/40 text-[0.72rem] text-muted-foreground flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span>Terms snapshotted permanently at activation</span>
      </div>

      <div className="mt-5 flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
          <Link to={ctaTo} params={{ slug: plan.slug }}>
            View Terms
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="flex-1 text-xs font-semibold bg-primary text-primary-foreground shadow-sm"
        >
          <Link to="/invest" search={{ plan: plan.slug }}>
            Activate Plan <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
