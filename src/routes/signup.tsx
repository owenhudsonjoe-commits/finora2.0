import { createFileRoute } from "@tanstack/react-router";
import { AuthForm, AuthShell } from "@/components/finora/auth-form";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Create account — FINORA" },
      {
        name: "description",
        content: "Open a FINORA account and start investing with transparent plan terms.",
      },
      { property: "og:title", content: "Create account — FINORA" },
      { property: "og:description", content: "Open a FINORA account in minutes." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { redirect } = Route.useSearch();
  return (
    <AuthShell>
      <AuthForm mode="signup" redirect={redirect} />
    </AuthShell>
  );
}
