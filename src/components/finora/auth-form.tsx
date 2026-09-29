import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, ShieldCheck, AlertCircle, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ensureAccount } from "@/lib/finora.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinoraLogo } from "./logo";

function passwordIssue(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    return "Password must include both letters and numbers.";
  return null;
}

export function AuthForm({ mode, redirect }: { mode: "login" | "signup"; redirect?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    referral: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errorNotice) setErrorNotice(null);
  };

  async function afterSignIn() {
    try {
      await ensureAccount();
    } catch {
      /* profile creation is retried on the dashboard */
    }
    if (redirect) {
      navigate({ to: redirect });
    } else {
      navigate({ to: "/dashboard" });
    }
  }

  async function handleResendEmail(): Promise<void> {
    const targetEmail = form.email.trim();
    if (!targetEmail) {
      toast.error("Please enter your email address first.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Verification link resent to ${targetEmail}. Please check your inbox.`);
      }
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrorNotice(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        if (form.fullName.trim().length < 2) {
          toast.error("Enter your full name.");
          return;
        }
        if (form.phone.trim().length < 7) {
          toast.error("Enter a valid phone number.");
          return;
        }
        const issue = passwordIssue(form.password);
        if (issue) {
          toast.error(issue);
          return;
        }
        if (form.password !== form.confirm) {
          toast.error("Passwords do not match.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: form.fullName.trim(),
              phone: form.phone.trim(),
              referral_code: form.referral.trim().toUpperCase(),
            },
          },
        });

        if (error) {
          setErrorNotice(error.message);
          toast.error(error.message);
          return;
        }

        // If email confirmation is not required or auto-confirmed, sign in immediately
        if (data.session) {
          toast.success("Account created successfully!");
          await afterSignIn();
          return;
        }

        // Try direct sign in in case project auto-confirms
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (!signInError && signInData.session) {
          toast.success("Account created and verified!");
          await afterSignIn();
          return;
        }

        // If identities is 0, user already existed
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setErrorNotice("already_registered");
          toast.info("An account with this email already exists. Please sign in.");
          return;
        }

        setSent(true);
      } else {
        // LOGIN MODE
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("not confirmed") || msg.includes("email_not_confirmed")) {
            setErrorNotice("email_not_confirmed");
            toast.error("Email address has not been confirmed yet.");
          } else if (msg.includes("invalid login credentials")) {
            setErrorNotice("invalid_credentials");
            toast.error("Invalid login credentials. Check your password or create an account.");
          } else {
            setErrorNotice(error.message);
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          toast.success("Signed in successfully.");
          await afterSignIn();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(): Promise<void> {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in is unavailable right now.");
      return;
    }
    if (result.redirected) return;
    await afterSignIn();
  }

  if (sent) {
    return (
      <div className="surface-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Confirm your email</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          We sent an account activation link to{" "}
          <strong className="text-foreground">{form.email}</strong>. Open it to verify your FINORA
          account, then sign in.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={resending}
            onClick={handleResendEmail}
            className="w-full text-xs"
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Resending email…
              </>
            ) : (
              <>
                <Mail className="mr-1.5 h-3.5 w-3.5" /> Resend activation link
              </>
            )}
          </Button>
          <Button asChild className="w-full">
            <Link to="/login" search={redirect ? { redirect } : undefined}>
              Return to Sign In
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card p-8">
      <div className="mb-7 text-center">
        <Link to="/" className="inline-block">
          <FinoraLogo />
        </Link>
        <h1 className="mt-5 text-xl font-semibold">
          {mode === "signup" ? "Create your FINORA account" : "Sign in to FINORA"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === "signup"
            ? "A few details and your portfolio is ready."
            : "Access your portfolio and wallet."}
        </p>
      </div>

      {redirect?.startsWith("/admin") ? (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>
            Administrator access requested. Sign in to proceed directly to the{" "}
            <strong className="underline">/admin</strong> control centre.
          </span>
        </div>
      ) : null}

      {/* ERROR / GUIDANCE NOTICES */}
      {errorNotice === "invalid_credentials" && mode === "login" && (
        <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-200">
                Account not found or password incorrect
              </p>
              <p className="mt-1 text-slate-300">
                If you have not registered an account with{" "}
                <strong className="text-white">{form.email || "this email"}</strong> yet, you can
                create one in seconds.
              </p>
              <div className="mt-2.5">
                <Link
                  to="/signup"
                  search={redirect ? { redirect } : undefined}
                  className="inline-flex items-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                >
                  Create account now <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorNotice === "email_not_confirmed" && (
        <div className="mb-5 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-300">
          <div className="flex items-start gap-2.5">
            <Mail className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
            <div className="flex-1">
              <p className="font-semibold text-blue-200">Email confirmation pending</p>
              <p className="mt-1 text-slate-300">
                A verification link was previously sent to your email. Check your inbox and spam
                folder.
              </p>
              <button
                type="button"
                disabled={resending}
                onClick={handleResendEmail}
                className="mt-2.5 inline-flex items-center text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
              >
                {resending ? "Sending…" : "Resend confirmation email →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorNotice === "already_registered" && (
        <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-200">Email is already registered</p>
              <p className="mt-1 text-slate-300">
                An account with this email already exists. Please switch to sign in.
              </p>
              <div className="mt-2">
                <Link
                  to="/login"
                  search={redirect ? { redirect } : undefined}
                  className="inline-flex items-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                >
                  Sign in to existing account →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorNotice &&
        errorNotice !== "invalid_credentials" &&
        errorNotice !== "email_not_confirmed" &&
        errorNotice !== "already_registered" && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorNotice}</span>
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={set("fullName")}
              autoComplete="name"
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              autoComplete="tel"
              placeholder="+92 300 1234567"
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" ? (
              <Link
                to="/forgot-password"
                className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
              >
                Forgot password?
              </Link>
            ) : null}
          </div>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={set("password")}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            required
          />
        </div>

        {mode === "signup" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral">Referral code (optional)</Label>
              <Input
                id="referral"
                value={form.referral}
                onChange={set("referral")}
                placeholder="FINXXXXXX"
              />
            </div>
          </>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="text-muted-foreground my-5 flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        OR
        <span className="bg-border h-px flex-1" />
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
        Continue with Google
      </Button>

      <div className="text-muted-foreground mt-6 space-y-2 text-center text-sm">
        {mode === "login" ? (
          <p>
            New to FINORA?{" "}
            <Link
              to="/signup"
              search={redirect ? { redirect } : undefined}
              className="text-foreground font-medium underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        ) : (
          <p>
            Already registered?{" "}
            <Link
              to="/login"
              search={redirect ? { redirect } : undefined}
              className="text-foreground font-medium underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
