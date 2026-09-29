import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/finora/public-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How do FINORA investment plans work?",
    a: "You choose a plan, confirm its terms, and the plan amount is moved from your wallet into an active investment. The plan's daily earning and duration are locked to that investment for its whole life.",
  },
  {
    q: "What happens if an admin changes a plan later?",
    a: "Nothing changes for you. Each investment keeps a snapshot of the amount, daily earning, duration, fees and terms that applied when you invested.",
  },
  {
    q: "How do I add funds?",
    a: "Open Wallet, choose Deposit, follow the payment instructions shown for the active method, then upload your payment proof. A reviewer verifies the payment before your wallet is credited.",
  },
  {
    q: "How long do withdrawals take?",
    a: "Withdrawal requests move through review and approval before payout. Typical processing happens within the window published in your wallet, and every status change is visible in your activity feed.",
  },
  {
    q: "Is there a withdrawal fee?",
    a: "A fee may apply depending on the platform settings in force when you request the withdrawal. The exact fee and the net amount are shown before you confirm.",
  },
  {
    q: "How does the referral programme work?",
    a: "You get a personal referral code. When someone signs up with it and makes a qualifying investment, a commission is credited to your wallet and recorded in your ledger.",
  },
  {
    q: "Is my payment proof visible to other users?",
    a: "No. Proof files are stored privately and can only be opened by you and authorised reviewers through short-lived signed links.",
  },
  {
    q: "Are returns guaranteed?",
    a: "No. Earnings follow the terms configured for each plan and depend on FINORA meeting its obligations. Investing carries risk, including the possible loss of the amount invested.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — FINORA" },
      {
        name: "description",
        content: "Answers about FINORA plans, deposits, withdrawals, referrals and risk.",
      },
      { property: "og:title", content: "FINORA FAQ" },
      {
        property: "og:description",
        content: "Plans, deposits, withdrawals, referrals and risk, explained.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">Support</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Can't find what you need? Open a support ticket from your dashboard and our team will
          respond.
        </p>

        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-sm font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </PublicLayout>
  );
}
