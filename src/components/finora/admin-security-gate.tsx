import { useState, useEffect, type ReactNode, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  LogIn,
  UserPlus,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { FinoraLogo } from "@/components/finora/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { verifyAdminUsername } from "@/lib/admin.functions";

const ADMIN_STORAGE_KEY = "finora_admin_gate_unlocked";
const DEFAULT_ADMIN_USERNAME = "umairi455";

export function AdminSecurityGate({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Authenticated unlock form state
  const [usernameInput, setUsernameInput] = useState<string>(DEFAULT_ADMIN_USERNAME);

  // Unauthenticated login/setup form state
  const [authTab, setAuthTab] = useState<"signin" | "setup">("signin");
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [fullNameInput, setFullNameInput] = useState<string>("");
  const [adminKeyInput, setAdminKeyInput] = useState<string>(DEFAULT_ADMIN_USERNAME);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const verifyFn = useServerFn(verifyAdminUsername);
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndLockState() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;

        const user = data?.user ?? null;
        setCurrentUser(user);

        const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY);
        if (user && stored && stored.toLowerCase() === DEFAULT_ADMIN_USERNAME) {
          setIsUnlocked(true);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    }

    checkAuthAndLockState();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handler for already-signed-in user entering the admin username
  const handleVerifySignedInUser = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = usernameInput.trim();

    if (!trimmed) {
      setErrorMsg("Please enter the administrator username.");
      return;
    }

    setIsPending(true);
    try {
      const res = await verifyFn({ data: { username: trimmed } });
      if (!res.ok) {
        setErrorMsg(res.message || "Invalid administrator username. Access denied.");
        toast.error("Access denied: Invalid administrator username.");
        return;
      }

      sessionStorage.setItem(ADMIN_STORAGE_KEY, DEFAULT_ADMIN_USERNAME);
      await queryClient.invalidateQueries();
      setIsUnlocked(true);
      toast.success("Administrator verified. Control centre unlocked.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to verify administrator credentials.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  // Handler for direct admin sign in
  const handleAdminSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const email = emailInput.trim();
    const password = passwordInput;
    const adminKey = adminKeyInput.trim();

    if (!email || !password) {
      setErrorMsg("Please enter both your administrator email and password.");
      return;
    }

    if (adminKey.toLowerCase() !== DEFAULT_ADMIN_USERNAME) {
      setErrorMsg(`Invalid administrator security code. Must be "${DEFAULT_ADMIN_USERNAME}".`);
      return;
    }

    setIsPending(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Invalid email or password.");
      }

      setCurrentUser(authData.user);

      // Verify and promote to super_admin
      const res = await verifyFn({ data: { username: adminKey } });
      if (!res.ok) {
        throw new Error(res.message || "Failed to elevate administrator privileges.");
      }

      sessionStorage.setItem(ADMIN_STORAGE_KEY, DEFAULT_ADMIN_USERNAME);
      await queryClient.invalidateQueries();
      setIsUnlocked(true);
      toast.success("Welcome back! Platform administrator verified.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in failed. Check your credentials.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  // Handler for direct administrator account setup / initialization
  const handleAdminSetup = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const fullName = fullNameInput.trim();
    const email = emailInput.trim();
    const password = passwordInput;
    const adminKey = adminKeyInput.trim();

    if (!fullName) {
      setErrorMsg("Please enter your administrator full name.");
      return;
    }

    if (!email || !password) {
      setErrorMsg("Please enter your administrator email and password.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (adminKey.toLowerCase() !== DEFAULT_ADMIN_USERNAME) {
      setErrorMsg(`Invalid administrator security code. Must be "${DEFAULT_ADMIN_USERNAME}".`);
      return;
    }

    setIsPending(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      let activeUser = signUpData.user;

      if (!signUpData.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!signInError && signInData.user) {
          activeUser = signInData.user;
        }
      }

      if (!activeUser) {
        throw new Error(
          "Confirmation email sent. Please confirm your email, then return here to sign in.",
        );
      }

      setCurrentUser(activeUser);

      // Verify and promote to super_admin
      const res = await verifyFn({ data: { username: adminKey } });
      if (!res.ok) {
        throw new Error(res.message || "Failed to grant administrator privileges.");
      }

      sessionStorage.setItem(ADMIN_STORAGE_KEY, DEFAULT_ADMIN_USERNAME);
      await queryClient.invalidateQueries();
      setIsUnlocked(true);
      toast.success("Administrator account created and platform unlocked.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to initialize administrator account.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleSignOutUser = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      setCurrentUser(null);
      setIsUnlocked(false);
      toast.info("Signed out of current account.");
    } catch {
      // Ignore
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Checking Administrator Environment…
          </span>
        </div>
      </div>
    );
  }

  // If already unlocked and user exists, render admin panels immediately
  if (isUnlocked && currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-center">
            <FinoraLogo />
          </div>

          <div className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner">
              <Lock className="h-6 w-6" />
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[0.7rem] font-medium text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ADMINISTRATOR GATEWAY</span>
            </div>

            <h1 className="mt-3 text-xl font-semibold tracking-tight text-white">
              Platform Administration & Setup
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Access to <span className="font-mono text-emerald-400">/admin</span> is dedicated to
              the platform owner. Sign in or initialize your administrator credentials below.
            </p>
          </div>

          {/* SCENARIO 1: User is already signed into an account in Supabase */}
          {currentUser ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Account:</span>
                  <span className="font-mono text-emerald-400">{currentUser.email}</span>
                </div>
              </div>

              <form onSubmit={handleVerifySignedInUser} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-username" className="text-xs font-medium text-slate-300">
                      Administrator Username / Passcode
                    </Label>
                    <span className="font-mono text-[0.65rem] text-emerald-400">
                      Default: {DEFAULT_ADMIN_USERNAME}
                    </span>
                  </div>
                  <Input
                    id="admin-username"
                    type="text"
                    autoComplete="off"
                    autoFocus
                    placeholder={DEFAULT_ADMIN_USERNAME}
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    disabled={isPending}
                    className="border-slate-700 bg-slate-950/80 font-mono text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500"
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-emerald-500 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      Verify & Open Admin <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={handleSignOutUser}
                  className="hover:text-slate-200 underline underline-offset-4"
                >
                  Sign in with different email
                </button>
                <Link to="/dashboard" className="hover:text-slate-200">
                  Investor Dashboard →
                </Link>
              </div>
            </div>
          ) : (
            /* SCENARIO 2: User is not yet signed in (direct /admin access) */
            <div className="mt-6">
              <Tabs
                value={authTab}
                onValueChange={(v) => {
                  setAuthTab(v as "signin" | "setup");
                  setErrorMsg(null);
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-950 border border-slate-800">
                  <TabsTrigger
                    value="signin"
                    className="text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950"
                  >
                    <LogIn className="mr-1.5 h-3.5 w-3.5" /> Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="setup"
                    className="text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950"
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Setup Admin
                  </TabsTrigger>
                </TabsList>

                {/* SIGN IN TAB */}
                <TabsContent value="signin" className="mt-4">
                  <form onSubmit={handleAdminSignIn} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-email" className="text-xs font-medium text-slate-300">
                        Admin Email
                      </Label>
                      <Input
                        id="admin-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        placeholder="admin@example.com"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        disabled={isPending}
                        className="border-slate-700 bg-slate-950/80 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="admin-password"
                        className="text-xs font-medium text-slate-300"
                      >
                        Password
                      </Label>
                      <Input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        disabled={isPending}
                        className="border-slate-700 bg-slate-950/80 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="admin-key-signin"
                          className="text-xs font-medium text-slate-300"
                        >
                          Admin Security Passcode
                        </Label>
                        <span className="font-mono text-[0.65rem] text-emerald-400">
                          Default: {DEFAULT_ADMIN_USERNAME}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          id="admin-key-signin"
                          type="text"
                          value={adminKeyInput}
                          onChange={(e) => {
                            setAdminKeyInput(e.target.value);
                            if (errorMsg) setErrorMsg(null);
                          }}
                          disabled={isPending}
                          className="border-slate-700 bg-slate-950/80 font-mono text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500 pr-9"
                        />
                        <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-emerald-500 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating…
                        </>
                      ) : (
                        <>
                          Sign In & Unlock Admin <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* SETUP ADMIN TAB */}
                <TabsContent value="setup" className="mt-4">
                  <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-xs text-emerald-300 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>
                      Initialize your platform owner account. This user will immediately receive
                      full Super Administrator authority.
                    </span>
                  </div>

                  <form onSubmit={handleAdminSetup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-name" className="text-xs font-medium text-slate-300">
                        Full Name
                      </Label>
                      <Input
                        id="admin-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Platform Administrator"
                        value={fullNameInput}
                        onChange={(e) => {
                          setFullNameInput(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        disabled={isPending}
                        className="border-slate-700 bg-slate-950/80 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="admin-email-setup"
                        className="text-xs font-medium text-slate-300"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="admin-email-setup"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@finora.io"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        disabled={isPending}
                        className="border-slate-700 bg-slate-950/80 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="admin-password-setup"
                        className="text-xs font-medium text-slate-300"
                      >
                        New Password (min 8 chars)
                      </Label>
                      <Input
                        id="admin-password-setup"
                        type="password"
                        autoComplete="new-password"
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        disabled={isPending}
                        className="border-slate-700 bg-slate-950/80 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="admin-key-setup"
                          className="text-xs font-medium text-slate-300"
                        >
                          Admin Security Passcode
                        </Label>
                        <span className="font-mono text-[0.65rem] text-emerald-400">
                          Required: {DEFAULT_ADMIN_USERNAME}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          id="admin-key-setup"
                          type="text"
                          value={adminKeyInput}
                          onChange={(e) => {
                            setAdminKeyInput(e.target.value);
                            if (errorMsg) setErrorMsg(null);
                          }}
                          disabled={isPending}
                          className="border-slate-700 bg-slate-950/80 font-mono text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500 pr-9"
                        />
                        <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-emerald-500 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing…
                        </>
                      ) : (
                        <>
                          Initialize Admin & Open System <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-slate-400 transition-colors hover:text-slate-200"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to Customer Sign In
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center font-mono text-[0.7rem] text-slate-500">
          AUDIT ID: FIN-SEC-GATE · ATOMIC PLATFORM GOVERNANCE
        </p>
      </div>
    </div>
  );
}
