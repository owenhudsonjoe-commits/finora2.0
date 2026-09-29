import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/finora/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FINORA" },
      {
        name: "description",
        content: "How FINORA collects, stores and protects your personal and financial data.",
      },
      { property: "og:title", content: "Privacy Policy — FINORA" },
      {
        property: "og:description",
        content: "How FINORA protects your personal and financial data.",
      },
    ],
  }),
  component: () => <LegalPage slug="privacy" fallbackTitle="Privacy Policy" />,
});
