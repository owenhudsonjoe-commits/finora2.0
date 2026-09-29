import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/finora/legal-page";

export const Route = createFileRoute("/risk-disclosure")({
  head: () => ({
    meta: [
      { title: "Risk Disclosure — FINORA" },
      {
        name: "description",
        content: "Understand the risks that apply to every investment made through FINORA.",
      },
      { property: "og:title", content: "Risk Disclosure — FINORA" },
      { property: "og:description", content: "The risks that apply to every FINORA investment." },
    ],
  }),
  component: () => <LegalPage slug="risk-disclosure" fallbackTitle="Risk Disclosure" />,
});
