import { createFileRoute } from "@tanstack/react-router";
import { AuthForm, AuthShell } from "@/components/finora/auth-form";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Sign in — FINORA" },
      {
        name: "description",
        content: "Sign in to your FINORA account to manage your portfolio and wallet.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign in — FINORA" },
      { property: "og:description", content: "Access your FINORA portfolio and wallet." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return (
    <AuthShell>
      <AuthForm mode="login" redirect={redirect} />
    </AuthShell>
  );
}
