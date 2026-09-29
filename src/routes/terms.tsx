import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/finora/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — FINORA" },
      {
        name: "description",
        content: "The terms that govern the use of FINORA accounts, wallets and investment plans.",
      },
      { property: "og:title", content: "Terms & Conditions — FINORA" },
      {
        property: "og:description",
        content: "Terms governing FINORA accounts and investment plans.",
      },
    ],
  }),
  component: () => <LegalPage slug="terms" fallbackTitle="Terms & Conditions" />,
});
