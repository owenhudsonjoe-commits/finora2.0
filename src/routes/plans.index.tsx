import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/finora/public-layout";
import { PlanCard } from "@/components/finora/plan-card";
import { YieldSimulator } from "@/components/finora/yield-simulator";
import { Button } from "@/components/ui/button";
import { getPublicPlans } from "@/lib/public.functions";
import { money } from "@/lib/format";

export const plansQuery = {
  queryKey: ["public-plans"] as const,
  queryFn: () => getPublicPlans(),
};

export const Route = createFileRoute("/plans/")({
  head: () => ({
    meta: [
      { title: "Investment Plans & Yield Directory — FINORA" },
      {
        name: "description",
        content:
          "Compare calibrated 60-day investment plans with fixed daily earnings, transparent 30-day break-even milestones, and direct QR code payment.",
      },
      { property: "og:title", content: "FINORA Investment Plans & Yield Directory" },
      {
        property: "og:description",
        content: "Fixed 60-day plan terms, verified deposits, and transparent daily returns.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(plansQuery),
  component: PlansPage,
});

function PlansPage() {
  const initialPlans = Route.useLoaderData();
  const { data: plans, isLoading } = useQuery({
    ...plansQuery,
    initialData: initialPlans,
  });

  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Immutable 60-Day Terms · Audited Settlements</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Calibrated Investment Tiers
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            Every plan clearly publishes its required allocation, automated daily distribution rate,
            term duration, and break-even milestone. Terms are permanently locked at activation and
            cannot be altered retroactively.
          </p>
        </div>

        {/* Plan Cards Grid */}
        {isLoading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-muted h-80 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (plans?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground mt-12 text-sm">
            No plans are currently open for investment.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans?.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}

        {/* Interactive Yield Simulator on the Plans Page */}
        <div className="mt-20">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Simulate Tier Yields & Milestones</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Use our interactive calculator to project your daily return stream and 30-day
              break-even point.
            </p>
          </div>
          <YieldSimulator plans={plans} />
        </div>

        {/* Executive Comparison Table */}
        <div className="mt-16 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h3 className="text-base font-semibold text-foreground">
              Institutional Tier Comparison Matrix
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Side-by-side analysis of all active offerings with direct QR code payment access.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/20 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Plan Name</th>
                  <th className="px-6 py-3.5 font-semibold">Allocation</th>
                  <th className="px-6 py-3.5 font-semibold">Daily Accrual</th>
                  <th className="px-6 py-3.5 font-semibold">Break-Even Point</th>
                  <th className="px-6 py-3.5 font-semibold">Total Payout (60d)</th>
                  <th className="px-6 py-3.5 font-semibold">Risk Rating</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Direct Activation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {plans?.map((plan) => {
                  const totalRet = plan.daily_earning * plan.duration_days;
                  const breakEven =
                    plan.daily_earning > 0
                      ? Math.ceil(plan.investment_amount / plan.daily_earning)
                      : 30;
                  return (
                    <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{plan.name}</td>
                      <td className="px-6 py-4 num font-medium">
                        {money(plan.investment_amount, plan.currency)}
                      </td>
                      <td className="px-6 py-4 num font-semibold text-emerald-600 dark:text-emerald-400">
                        +{money(plan.daily_earning, plan.currency)}/day
                      </td>
                      <td className="px-6 py-4 num text-sky-600 dark:text-sky-400">
                        Day {breakEven} (50%)
                      </td>
                      <td className="px-6 py-4 num font-bold text-foreground">
                        {money(totalRet, plan.currency)} (+100% net)
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-muted px-2 py-0.5 font-medium text-foreground">
                          {plan.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild size="sm" className="h-7 text-xs font-semibold">
                          <Link to="/invest" search={{ plan: plan.slug }}>
                            Activate Plan <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-muted-foreground mt-12 text-xs leading-relaxed max-w-3xl">
          Investing involves risk, including possible delay or loss. Daily earnings reflect
          configured plan terms and automated ledger settlement schedules. All transfers are
          verified against verified deposit evidence prior to term activation.
        </p>
      </section>
    </PublicLayout>
  );
}
