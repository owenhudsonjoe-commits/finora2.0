import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/finora/auth-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinoraLogo } from "@/components/finora/logo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — FINORA" },
      { name: "description", content: "Request a password reset link for your FINORA account." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reset your password — FINORA" },
      { property: "og:description", content: "Request a password reset link." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("We couldn't send the reset link. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell>
      <div className="surface-card p-8">
        <div className="mb-6 text-center">
          <Link to="/">
            <FinoraLogo />
          </Link>
          <h1 className="mt-5 text-xl font-semibold">Forgot your password?</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter your account email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <p className="text-muted-foreground text-center text-sm">
            If an account exists for <span className="text-foreground font-medium">{email}</span>, a
            reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-muted-foreground mt-6 text-center text-sm">
          <Link to="/login" className="hover:text-foreground underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
