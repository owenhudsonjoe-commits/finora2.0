import { useState, useId } from "react";
import { Link } from "@tanstack/react-router";
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  DollarSign,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import type { PublicPlan } from "@/lib/public.functions";

interface YieldSimulatorProps {
  plans: PublicPlan[] | undefined;
  defaultPlanSlug?: string;
  className?: string;
}

export function YieldSimulator({ plans, defaultPlanSlug, className = "" }: YieldSimulatorProps) {
  const chartId = useId();
  const availablePlans = plans && plans.length > 0 ? plans : [];

  const [selectedSlug, setSelectedSlug] = useState<string>(
    defaultPlanSlug ?? availablePlans[1]?.slug ?? availablePlans[0]?.slug ?? "starter",
  );
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const activePlan =
    availablePlans.find((p) => p.slug === selectedSlug) ?? availablePlans[0] ?? null;

  const duration = activePlan?.duration_days ?? 60;
  const principal = Number(activePlan?.investment_amount ?? 0);
  const dailyEarning = Number(activePlan?.daily_earning ?? 0);
  const totalReturn = dailyEarning * duration;
  const netProfit = totalReturn - principal;
  const returnPercentage = principal > 0 ? Math.round((netProfit / principal) * 100) : 100;
  const breakEvenDay = dailyEarning > 0 ? Math.ceil(principal / dailyEarning) : 30;

  // Active projection point (either scrubbed day or maturity day 60)
  const currentDay = hoveredDay !== null ? hoveredDay : duration;
  const currentAccumulated = dailyEarning * currentDay;
  const currentNet = currentAccumulated - principal;
  const isBreakEvenReached = currentDay >= breakEvenDay;

  // Generate chart coordinates for SVG path
  const svgWidth = 560;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  // Key milestones
  const milestones = [
    { day: 0, label: "Day 0", desc: "Commitment" },
    { day: 15, label: "Day 15", desc: "50% Recovered" },
    { day: breakEvenDay, label: `Day ${breakEvenDay}`, desc: "Break-Even (100%)" },
    { day: 45, label: "Day 45", desc: "+50% Profit" },
    { day: duration, label: `Day ${duration}`, desc: "Full Maturity (200%)" },
  ];

  // Helper to map (day, amount) to SVG (x, y)
  const getX = (day: number) => paddingX + (day / duration) * chartW;
  const getY = (amount: number) => {
    const maxVal = totalReturn > 0 ? totalReturn * 1.05 : 1000;
    return paddingY + chartH - (amount / maxVal) * chartH;
  };

  // Build the SVG line and area
  const points = [];
  for (let d = 0; d <= duration; d += 2) {
    const amt = dailyEarning * d;
    points.push(`${getX(d)},${getY(amt)}`);
  }
  const linePath = points.length > 0 ? `M ${points.join(" L ")}` : "";
  const areaPath =
    points.length > 0 ? `${linePath} L ${getX(duration)},${getY(0)} L ${getX(0)},${getY(0)} Z` : "";

  const breakEvenX = getX(breakEvenDay);
  const principalY = getY(principal);
  const currentPointX = getX(currentDay);
  const currentPointY = getY(currentAccumulated);

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Simulator Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-emerald-400">
              Institutional Calculator
            </p>
          </div>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Investment Yield & Accrual Simulator
          </h3>
          <p className="mt-1.5 text-xs text-slate-400 max-w-xl">
            Select an allocation tier to simulate the fixed 60-day daily earning trajectory,
            milestone break-even points, and audited total capital recovery.
          </p>
        </div>

        {activePlan && (
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold shadow-lg shadow-emerald-500/20"
            >
              <Link to="/invest" search={{ plan: activePlan.slug }}>
                Activate {activePlan.name} Plan <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Main Simulator Body */}
      <div className="p-6 sm:p-8 space-y-8">
        {/* Step 1: Select Plan Tier */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Select Investment Plan Tier
            </span>
            <span className="text-xs text-slate-400">
              {availablePlans.length} Calibrated Offerings
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {availablePlans.map((plan) => {
              const isSelected = plan.slug === selectedSlug;
              const planDaily = Number(plan.daily_earning);
              const planAmt = Number(plan.investment_amount);
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedSlug(plan.slug);
                    setHoveredDay(null);
                  }}
                  className={`group relative flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50 shadow-md"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-2 right-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[0.6rem] font-semibold text-emerald-300 uppercase">
                      Popular
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? "text-emerald-400" : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {plan.name}
                  </span>
                  <span className="num mt-1 text-base font-bold text-white tracking-tight">
                    {money(planAmt, plan.currency)}
                  </span>
                  <span className="text-[0.68rem] text-slate-400 mt-1">
                    +{money(planDaily, plan.currency)} / day
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Key Financial Metric Cards */}
        {activePlan && (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4">
              <span className="text-[0.7rem] uppercase tracking-wider text-slate-400 block font-medium">
                Initial Capital Allocation
              </span>
              <p className="num mt-1 text-2xl font-bold text-white">
                {money(principal, activePlan.currency)}
              </p>
              <p className="text-[0.7rem] text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> Fixed commitment snapshot
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4">
              <span className="text-[0.7rem] uppercase tracking-wider text-slate-400 block font-medium">
                Daily Accrual Credit
              </span>
              <p className="num mt-1 text-2xl font-bold text-emerald-400">
                +{money(dailyEarning, activePlan.currency)}
              </p>
              <p className="text-[0.7rem] text-slate-500 mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" /> Credited every 24 hours
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4">
              <span className="text-[0.7rem] uppercase tracking-wider text-slate-400 block font-medium">
                Capital Break-Even Point
              </span>
              <p className="num mt-1 text-2xl font-bold text-sky-400">
                Day {breakEvenDay}
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  ({Math.round((breakEvenDay / duration) * 100)}% of term)
                </span>
              </p>
              <p className="text-[0.7rem] text-slate-500 mt-1">100% principal recouped</p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <span className="text-[0.7rem] uppercase tracking-wider text-emerald-300 block font-medium">
                Total 60-Day Maturity
              </span>
              <p className="num mt-1 text-2xl font-bold text-emerald-300">
                {money(totalReturn, activePlan.currency)}
              </p>
              <p className="text-[0.7rem] text-emerald-400/90 mt-1 font-medium">
                +{money(netProfit, activePlan.currency)} net gain (+{returnPercentage}%)
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Interactive 60-Day Yield Curve & Projection Chart */}
        {activePlan && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  60-Day Yield Accrual Horizon & Capital Milestones
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hover or scrub along the curve to inspect projected capital returns at any day.
                </p>
              </div>

              {/* Scrubber Stat Pill */}
              <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs">
                <span className="text-slate-400">Inspecting:</span>
                <span className="num font-semibold text-white">Day {currentDay} of 60</span>
                <span className="text-slate-500">·</span>
                <span className="num font-bold text-emerald-400">
                  {money(currentAccumulated, activePlan.currency)}
                </span>
                <span
                  className={`text-[0.65rem] px-1.5 py-0.5 rounded font-medium ${
                    isBreakEvenReached
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isBreakEvenReached ? "Pure Profit Phase" : "Recovery Phase"}
                </span>
              </div>
            </div>

            {/* Interactive SVG Chart */}
            <div className="relative w-full overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/80 p-2 sm:p-4">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-48 sm:h-56 select-none"
                onMouseLeave={() => setHoveredDay(null)}
              >
                <defs>
                  <linearGradient id={`${chartId}-area-grad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.0" />
                  </linearGradient>

                  <linearGradient id={`${chartId}-line-grad`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(56, 189, 248)" />
                    <stop offset="50%" stopColor="rgb(16, 185, 129)" />
                    <stop offset="100%" stopColor="rgb(52, 211, 153)" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0.25, 0.5, 0.75, 1].map((frac, idx) => {
                  const yVal = paddingY + chartH * (1 - frac);
                  const amtVal = totalReturn * frac;
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingX}
                        y1={yVal}
                        x2={svgWidth - paddingX}
                        y2={yVal}
                        stroke="rgba(51, 65, 85, 0.35)"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 6}
                        y={yVal + 3}
                        fill="rgb(100, 116, 139)"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {money(amtVal, activePlan.currency)}
                      </text>
                    </g>
                  );
                })}

                {/* Break-even Vertical Reference Line */}
                <line
                  x1={breakEvenX}
                  y1={paddingY}
                  x2={breakEvenX}
                  y2={paddingY + chartH}
                  stroke="rgba(56, 189, 248, 0.5)"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <text
                  x={breakEvenX}
                  y={paddingY - 8}
                  fill="rgb(56, 189, 248)"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Day {breakEvenDay}: Break-Even
                </text>

                {/* Principal Baseline */}
                <line
                  x1={paddingX}
                  y1={principalY}
                  x2={svgWidth - paddingX}
                  y2={principalY}
                  stroke="rgba(244, 63, 94, 0.35)"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  x={svgWidth - paddingX + 5}
                  y={principalY + 3}
                  fill="rgb(244, 63, 94)"
                  fontSize="8"
                  textAnchor="start"
                >
                  Principal
                </text>

                {/* Area and Line Path */}
                <path d={areaPath} fill={`url(#${chartId}-area-grad)`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke={`url(#${chartId}-line-grad)`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Milestone Node Dots */}
                {milestones.map((m) => {
                  const mX = getX(m.day);
                  const mY = getY(dailyEarning * m.day);
                  return (
                    <g key={m.day}>
                      <circle
                        cx={mX}
                        cy={mY}
                        r="4"
                        fill="rgb(15, 23, 42)"
                        stroke="rgb(16, 185, 129)"
                        strokeWidth="2"
                      />
                      <text
                        x={mX}
                        y={paddingY + chartH + 15}
                        fill="rgb(148, 163, 184)"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {m.label}
                      </text>
                    </g>
                  );
                })}

                {/* Current Hover Point */}
                <circle
                  cx={currentPointX}
                  cy={currentPointY}
                  r="6"
                  fill="rgb(16, 185, 129)"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />

                {/* Transparent Interactive Overlay Columns for Scrubbing */}
                {Array.from({ length: 61 }).map((_, d) => {
                  const xStart = getX(Math.max(0, d - 0.5));
                  const xEnd = getX(Math.min(duration, d + 0.5));
                  return (
                    <rect
                      key={d}
                      x={xStart}
                      y={paddingY}
                      width={Math.max(4, xEnd - xStart)}
                      height={chartH}
                      fill="transparent"
                      className="cursor-pointer hover:fill-white/5 transition-colors"
                      onMouseEnter={() => setHoveredDay(d)}
                      onClick={() => setHoveredDay(d)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Step 4: Milestones Schedule Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <span className="text-[0.68rem] text-slate-400 font-mono">STAGE 01 · DAY 1</span>
                <p className="text-xs font-semibold text-white mt-1">First Automated Credit</p>
                <p className="text-[0.7rem] text-emerald-400 num mt-0.5">
                  +{money(dailyEarning, activePlan.currency)} to ledger
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <span className="text-[0.68rem] text-slate-400 font-mono">STAGE 02 · DAY 15</span>
                <p className="text-xs font-semibold text-white mt-1">50% Capital Recouped</p>
                <p className="text-[0.7rem] text-sky-400 num mt-0.5">
                  {money(dailyEarning * 15, activePlan.currency)} available
                </p>
              </div>

              <div className="rounded-lg border border-sky-500/40 bg-sky-950/20 p-3">
                <span className="text-[0.68rem] text-sky-300 font-mono font-semibold">
                  STAGE 03 · DAY {breakEvenDay}
                </span>
                <p className="text-xs font-semibold text-white mt-1">100% Break-Even</p>
                <p className="text-[0.7rem] text-sky-300 num mt-0.5">
                  {money(principal, activePlan.currency)} (Zero Risk Thereafter)
                </p>
              </div>

              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3">
                <span className="text-[0.68rem] text-emerald-300 font-mono font-semibold">
                  STAGE 04 · DAY {duration}
                </span>
                <p className="text-xs font-semibold text-white mt-1">Term Maturity (2x)</p>
                <p className="text-[0.7rem] text-emerald-300 num mt-0.5">
                  {money(totalReturn, activePlan.currency)} (+{returnPercentage}% Gain)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Direct Action & Reassurance Footer */}
        {activePlan && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Plan terms are permanently locked at activation. QR payment screenshot verified by
                compliance.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                asChild
                variant="outline"
                className="flex-1 sm:flex-initial border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <Link to="/plans/$slug" params={{ slug: activePlan.slug }}>
                  View Full Plan Terms
                </Link>
              </Button>
              <Button
                asChild
                className="flex-1 sm:flex-initial bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/20"
              >
                <Link to="/invest" search={{ plan: activePlan.slug }}>
                  Activate Now via QR Code <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
