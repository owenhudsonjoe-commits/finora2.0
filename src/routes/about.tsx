import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ScrollText, Lock, LineChart } from "lucide-react";
import { PublicLayout } from "@/components/finora/public-layout";
import { siteContentQuery } from "@/components/finora/legal-page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About FINORA — Transparent investment infrastructure" },
      {
        name: "description",
        content:
          "FINORA is an investment platform built on fixed plan terms, verified deposits and a fully auditable ledger.",
      },
      { property: "og:title", content: "About FINORA" },
      {
        property: "og:description",
        content: "Transparent plan terms, verified deposits, auditable ledger.",
      },
    ],
  }),
  component: AboutPage,
});

const PILLARS = [
  {
    icon: ScrollText,
    title: "Fixed terms, recorded forever",
    body: "Every investment stores its own copy of the plan terms at the moment it is created. Later plan edits never alter an existing investment.",
  },
  {
    icon: ShieldCheck,
    title: "Server-verified money movement",
    body: "Balances change only through audited server routines with atomic database transactions. Nothing about your wallet can be altered from the browser.",
  },
  {
    icon: Lock,
    title: "Private payment evidence",
    body: "Deposit proofs are stored in private storage. Only you and authorised reviewers can open them, and every access is permission-checked.",
  },
  {
    icon: LineChart,
    title: "A real, readable ledger",
    body: "Deposits, investments, earnings, referrals, fees and withdrawals each produce a referenced ledger entry you can reconcile line by line.",
  },
];

function AboutPage() {
  const { data } = useQuery(siteContentQuery);
  const page = data?.content["about"];

  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">About us</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {page?.title ?? "Investment infrastructure built for trust"}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
          {String(
            page?.body["intro"] ??
              "FINORA gives individual investors a disciplined way to allocate capital into clearly defined plans, with the same operational controls used by regulated financial operations teams.",
          )}
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="surface-card p-6">
              <p.icon className="text-accent h-5 w-5" />
              <h2 className="mt-4 font-semibold">{p.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        {page?.body["mission"] ? (
          <div className="surface-card mt-10 p-7">
            <h2 className="font-semibold">Our approach</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed whitespace-pre-line">
              {String(page.body["mission"])}
            </p>
          </div>
        ) : null}

        <p className="text-muted-foreground mt-10 text-xs leading-relaxed">
          Investing involves risk, including possible loss of the amount invested. Plan earnings
          reflect the terms configured for each plan and depend on FINORA meeting its obligations;
          they are not guaranteed and are not insured by any government scheme.
        </p>
      </section>
    </PublicLayout>
  );
}
