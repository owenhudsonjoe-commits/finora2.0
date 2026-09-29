import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  LineChart,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Layers,
  Coins,
  ChevronRight,
  FileCheck,
  Scale,
  Calendar,
  Wallet,
} from "lucide-react";
import { PublicLayout } from "@/components/finora/public-layout";
import { PlanCard } from "@/components/finora/plan-card";
import { SectionHeading } from "@/components/finora/primitives";
import { YieldSimulator } from "@/components/finora/yield-simulator";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getPublicPlans, type PublicPlan } from "@/lib/public.functions";
import { money } from "@/lib/format";

const plansQuery = { queryKey: ["public-plans"] as const, queryFn: () => getPublicPlans() };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FINORA — Institutional-Grade Wealth Plans & Audited Ledger" },
      {
        name: "description",
        content:
          "FINORA provides calibrated 60-day investment plans with automated daily return settlements, direct QR payment verification, and line-by-line auditable ledger integrity.",
      },
      {
        property: "og:title",
        content: "FINORA — Institutional Precision for Personal Wealth",
      },
      {
        property: "og:description",
        content: "Calibrated 60-day investment tiers with audited daily earnings settlements.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(plansQuery),
  component: HomePage,
});

const METRICS = [
  {
    label: "Settlement Architecture",
    value: "100% Atomic",
    desc: "PostgreSQL transactional consistency",
  },
  {
    label: "Accrual Horizon",
    value: "60 Days Fixed",
    desc: "Guaranteed 100% net profit yield",
  },
  {
    label: "Break-Even Point",
    value: "Day 30",
    desc: "100% principal recouped in wallet",
  },
  {
    label: "Distribution Cadence",
    value: "24-Hour Cycle",
    desc: "Automated daily credit to available balance",
  },
];

const FAQS = [
  {
    q: "How does the direct plan activation and QR payment work?",
    a: "You no longer need to make a separate wallet deposit first. You can select any of our six investment tiers, scan the official payment QR code via your banking or mobile wallet app (Easypaisa, JazzCash, or Bank Transfer), and upload your payment screenshot. Our compliance officers verify incoming funds against your receipt and activate your 60-day earning term immediately.",
  },
  {
    q: "How are daily earnings calculated and credited?",
    a: "Daily earnings are calculated on the exact plan allocation agreed upon at activation. For instance, an allocation of Rs. 5,400 generates Rs. 180 every 24 hours. Over the 60-day duration, you receive Rs. 10,800 in total gross cashflow (100% principal recovery + 100% net surplus). Every credit is recorded as an immutable transaction in your personal ledger.",
  },
  {
    q: "When do I reach the capital break-even point?",
    a: "Because daily earnings are credited directly to your available wallet balance every 24 hours, you recoup 50% of your committed capital by Day 15, and 100% by Day 30. From Day 31 through Day 60, all daily distributions represent pure net surplus profit.",
  },
  {
    q: "Can plan terms or rates change after I invest?",
    a: "Never. FINORA snapshots the plan terms at the exact second your payment proof is confirmed. Even if administrators adjust platform offerings or tier configurations in the future, your active contract operates strictly under its original agreement until maturity.",
  },
  {
    q: "How and when can I withdraw my earnings?",
    a: "You can request a withdrawal whenever your available balance meets the minimum payout threshold. Payouts are reviewed against audited compliance standards and dispatched directly to your designated bank account or mobile wallet.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Select Allocation Tier",
    body: "Review our calibrated tiers starting from Rs. 2,700 with fixed 60-day terms and clear daily earnings.",
    icon: Layers,
  },
  {
    step: "02",
    title: "Scan Payment QR & Transfer",
    body: "Directly transfer your exact tier allocation using your preferred mobile wallet or bank app.",
    icon: Coins,
  },
  {
    step: "03",
    title: "Upload Verification Receipt",
    body: "Attach your payment screenshot and transaction ID for swift review by our compliance team.",
    icon: FileCheck,
  },
  {
    step: "04",
    title: "Receive 24h Daily Accruals",
    body: "Your plan activates immediately upon approval, crediting your ledger every 24 hours until full 2.0x maturity.",
    icon: TrendingUp,
  },
];

function HomePage() {
  const initialPlans = Route.useLoaderData();
  const { data: plans } = useQuery({
    ...plansQuery,
    initialData: initialPlans,
  });

  const [filterCategory, setFilterCategory] = useState<"all" | "low" | "medium" | "high">("all");

  const filteredPlans = plans?.filter((p) => {
    if (filterCategory === "all") return true;
    if (filterCategory === "low") return p.risk_level.toLowerCase() === "low";
    if (filterCategory === "medium") return p.risk_level.toLowerCase() === "medium";
    if (filterCategory === "high") return p.risk_level.toLowerCase() === "high";
    return true;
  });

  return (
    <PublicLayout>
      {/* HERO SECTION — Institutional Financial Architecture */}
      <section className="relative overflow-hidden bg-slate-950 text-slate-100 pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-800">
        {/* Subtle Ambient Depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_-15%,rgba(16,185,129,0.18),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415512_1px,transparent_1px),linear-gradient(to_bottom,#33415512_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Left Column: Value Proposition & Institutional Trust */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Audited Ledger · Direct QR Activation · Fixed 60-Day Terms</span>
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
                Institutional capital discipline for personal wealth
              </h1>

              <p className="mt-6 text-base text-slate-300 leading-relaxed max-w-xl text-balance">
                FINORA provides six calibrated investment tiers with locked terms, verified payment
                clearing, and an immutable transaction ledger that reconciles every rupee with
                mathematical precision.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold shadow-lg shadow-emerald-500/20 px-6"
                >
                  <Link to="/signup">
                    Open an Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white"
                >
                  <Link to="/invest">Direct Plan Activation</Link>
                </Button>
              </div>

              {/* Institutional Trust Assurances */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-800/90 pt-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Atomic balance settlement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Immutable contract terms</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Zero hidden management fees</span>
                </div>
              </div>
            </div>

            {/* Right Column: Executive Terminal Overview Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                      Executive Portfolio Terminal
                    </span>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[0.68rem] font-mono text-slate-300">
                    SLA: 24H SETTLEMENT
                  </span>
                </div>

                {/* Core Specifications Grid */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-[0.68rem] uppercase tracking-wider text-slate-400 block">
                      Contract Term
                    </span>
                    <p className="num mt-1 text-xl font-bold text-white">60 Days</p>
                    <span className="text-[0.65rem] text-slate-500">Fixed duration lock</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-[0.68rem] uppercase tracking-wider text-slate-400 block">
                      Total Payout
                    </span>
                    <p className="num mt-1 text-xl font-bold text-emerald-400">200% Gross</p>
                    <span className="text-[0.65rem] text-emerald-400/80 font-medium">
                      +100% Net Profit
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-[0.68rem] uppercase tracking-wider text-slate-400 block">
                      Break-Even Point
                    </span>
                    <p className="num mt-1 text-xl font-bold text-sky-400">Day 30</p>
                    <span className="text-[0.65rem] text-slate-500">100% capital recouped</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-[0.68rem] uppercase tracking-wider text-slate-400 block">
                      Deposit Method
                    </span>
                    <p className="mt-1 text-base font-bold text-white">Direct QR Code</p>
                    <span className="text-[0.65rem] text-slate-500">Verified via screenshot</span>
                  </div>
                </div>

                {/* Live Tier Preview Quick Pick */}
                <div className="mt-5 rounded-xl border border-slate-800/90 bg-slate-950/90 p-4">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-semibold text-slate-300">Quick Plan Selection:</span>
                    <Link
                      to="/plans"
                      className="text-emerald-400 hover:text-emerald-300 text-[0.72rem]"
                    >
                      Compare all 6 tiers →
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {plans?.slice(0, 3).map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{plan.name}</span>
                          <span className="text-slate-400 ml-2">
                            {money(plan.investment_amount, plan.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="num text-emerald-400 font-semibold">
                            +{money(plan.daily_earning, plan.currency)}/day
                          </span>
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[0.7rem] text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Link to="/invest" search={{ plan: plan.slug }}>
                              Activate
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="mt-5">
                  <Button
                    asChild
                    className="w-full bg-slate-100 text-slate-950 hover:bg-white font-semibold"
                  >
                    <a href="#simulator">
                      Launch Full Yield Simulator <ChevronRight className="ml-1.5 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS STRIP */}
      <section className="border-b bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label} className="border-l-2 border-accent pl-4">
                <p className="num text-2xl font-bold tracking-tight text-foreground">{m.value}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEDICATED FULL-WIDTH YIELD SIMULATOR SECTION */}
      <section id="simulator" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Financial Projections"
          title="Interactive 60-Day Yield & Break-Even Simulator"
          description="Explore your projected earnings trajectory across our calibrated tiers. See the exact day you recoup 100% of your principal and transition into pure net surplus cashflow."
        />

        <div className="mt-10">
          <YieldSimulator plans={plans} />
        </div>
      </section>

      {/* ARCHITECTURAL GOVERNANCE & INTEGRITY BENTO GRID */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Institutional Governance"
            title="Operational discipline, built into the code"
            description="Every deposit, yield distribution, and balance mutation is protected by bank-grade architectural controls."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Contract Snapshot Immutability */}
            <div className="surface-card relative overflow-hidden p-8 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    Terms permanently locked at commitment
                  </h3>
                  <p className="text-xs text-muted-foreground">Immutable contract snapshot</p>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed max-w-xl">
                When you activate an allocation, its 60-day duration, daily earnings rate, currency,
                and risk profile are permanently snapshotted into your investment record. Future
                administrative adjustments will never retroactively diminish your agreed returns.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Legally Binding Terms
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Zero Retroactive Alterations
                </span>
              </div>
            </div>

            {/* Card 2: Server-Authoritative Settlement */}
            <div className="surface-card p-8">
              <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400 w-fit">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold">Server-authoritative money movement</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Balances change solely through transactional database routines. Client-side code
                cannot directly debit or credit accounts.
              </p>
            </div>

            {/* Card 3: Encrypted Proof Vault */}
            <div className="surface-card p-8">
              <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 w-fit">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold">Compliant payment proof vault</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Payment screenshots and transfer receipts are stored in secure storage buckets,
                accessible exclusively to compliance reviewers.
              </p>
            </div>

            {/* Card 4: Auditable Double-Entry Ledger */}
            <div className="surface-card p-8 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400">
                  <LineChart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    Continuous line-by-line reconcilable ledger
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Complete double-entry accounting trail
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed max-w-xl">
                Every balance change creates a corresponding transaction row with a unique reference
                hash, category, amount, and timestamp. You can reconcile your wallet balance down to
                the exact rupee at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PUBLISHED TIERS & COMPARISON TABLE */}
      <section className="border-t bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <SectionHeading
                eyebrow="Published Tiers"
                title="Six calibrated investment plans"
                description="Allocation, daily earning, duration, fees and risk level — clearly stated before you commit."
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-background border rounded-lg self-start md:self-end">
              {(
                [
                  { id: "all", label: "All Tiers" },
                  { id: "low", label: "Low Risk" },
                  { id: "medium", label: "Medium Risk" },
                  { id: "high", label: "High Yield" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCategory(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterCategory === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans?.map((plan: PublicPlan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Executive Comparison Table */}
          <div className="mt-14 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground">
                Tier Comparison & Financial Specifications
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                All offerings operate on a strict 60-day horizon with daily automated distribution.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/20 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Tier Name</th>
                    <th className="px-6 py-3.5 font-semibold">Principal Allocation</th>
                    <th className="px-6 py-3.5 font-semibold">Daily Accrual</th>
                    <th className="px-6 py-3.5 font-semibold">Break-Even Point</th>
                    <th className="px-6 py-3.5 font-semibold">Total Maturity (60d)</th>
                    <th className="px-6 py-3.5 font-semibold">Risk Rating</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Action</th>
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
                              Activate QR
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
        </div>
      </section>

      {/* OPERATIONAL FLOW (4 STEPS) */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Operational Flow"
          title="From plan selection to automated daily payout"
          description="A direct 4-stage pipeline designed for transparency and zero capital delay."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.step} className="surface-card relative flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="num text-2xl font-bold text-accent">{s.step}</span>
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQS ACCORDION */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Assurances & FAQs"
            title="Common inquiries regarding terms, QR clearing, and payouts"
          />

          <div className="mt-8">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left font-semibold">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-8 text-white sm:p-12 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_50%)]" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Institutional Wealth Architecture
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
                Ready to put your capital to work?
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Create your account, scan the payment QR code for your chosen tier, and activate
                your 60-day daily earning term in minutes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold shadow-lg shadow-emerald-500/20"
              >
                <Link to="/signup">Open an Account</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
              >
                <Link to="/invest">Direct Plan Activation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
