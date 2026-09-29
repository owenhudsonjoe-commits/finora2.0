import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PublicLayout } from "@/components/finora/public-layout";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { plansQuery } from "./plans.index";

export const Route = createFileRoute("/plans/$slug")({
  loader: async ({ context, params }) => {
    const plans = await context.queryClient.ensureQueryData(plansQuery);
    const plan = plans.find((p) => p.slug === params.slug);
    if (!plan) throw notFound();
    return { plan };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Plan unavailable — FINORA" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.plan.name} plan — FINORA`;
    const description = `${loaderData.plan.name}: ${money(loaderData.plan.investment_amount, loaderData.plan.currency)} allocation, ${money(loaderData.plan.daily_earning, loaderData.plan.currency)} daily earning over ${loaderData.plan.duration_days} days.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PlanDetail,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">This plan isn't available</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          It may have been closed to new investments.
        </p>
        <Button asChild className="mt-6">
          <Link to="/plans">See open plans</Link>
        </Button>
      </div>
    </PublicLayout>
  ),
});

function PlanDetail() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const { data: plans } = useQuery(plansQuery);
  const plan = plans?.find((p) => p.slug === slug) ?? loaderData.plan;
  const total = plan.daily_earning * plan.duration_days;

  return (
    <PublicLayout>
      <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <Link
          to="/plans"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> All plans
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">{plan.name}</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">{plan.description}</p>

        <div className="surface-card mt-8 grid gap-6 p-7 sm:grid-cols-2">
          <Figure label="Allocation" value={money(plan.investment_amount, plan.currency)} />
          <Figure
            label="Daily earning"
            value={money(plan.daily_earning, plan.currency)}
            tone="success"
          />
          <Figure label="Duration" value={`${plan.duration_days} days`} />
          <Figure label="Total projected earnings" value={money(total, plan.currency)} />
          <Figure label="Fees" value={plan.fees > 0 ? money(plan.fees, plan.currency) : "None"} />
          <Figure label="Risk level" value={plan.risk_level} />
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Plan terms</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed whitespace-pre-line">
            {plan.terms}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Risk disclosure</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed whitespace-pre-line">
            {plan.disclosure}
          </p>
        </section>

        <div className="surface-card mt-10 flex flex-wrap items-center justify-between gap-4 p-7">
          <div>
            <p className="text-base font-semibold">Ready to activate {plan.name}?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pay directly via QR code and start your 60-day daily earning term.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/invest" search={{ plan: plan.slug }}>
                Activate Plan Now
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </article>
    </PublicLayout>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p className={`num mt-1 text-xl font-semibold ${tone === "success" ? "text-success" : ""}`}>
        {value}
      </p>
    </div>
  );
}
