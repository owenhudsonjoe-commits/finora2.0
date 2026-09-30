import { useState, useEffect, type ReactNode, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { FinoraLogo } from "@/components/finora/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { verifyAdminPasscodeOnly } from "@/lib/admin-auth.functions";
import { verifyAdminUsername } from "@/lib/admin.functions";

const ADMIN_STORAGE_KEY = "finora_admin_gate_unlocked";
const DEFAULT_PASSCODE = "umairi455";

export function AdminSecurityGate({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [passcodeInput, setPasscodeInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const verifyPasscodeFn = useServerFn(verifyAdminPasscodeOnly);
  const verifyAdminUsernameFn = useServerFn(verifyAdminUsername);
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    async function checkLockState() {
      try {
        const stored =
          sessionStorage.getItem(ADMIN_STORAGE_KEY) || localStorage.getItem(ADMIN_STORAGE_KEY);
        if (stored && stored.toLowerCase() === DEFAULT_PASSCODE) {
          setIsUnlocked(true);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    }

    checkLockState();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleVerifyPasscode = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = passcodeInput.trim();

    if (!trimmed) {
      setErrorMsg("Please enter your administrator security passcode.");
      return;
    }

    setIsPending(true);
    try {
      // 1. Verify passcode on server
      const res = await verifyPasscodeFn({ data: { passcode: trimmed } });
      if (!res.ok) {
        setErrorMsg(res.message || "Invalid administrator security passcode. Access denied.");
        toast.error("Access denied: Incorrect security passcode.");
        return;
      }

      // 2. If a user is already signed in on Supabase, also promote them to super_admin in the DB
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await verifyAdminUsernameFn({ data: { username: trimmed } });
        }
      } catch {
        // Non-blocking
      }

      // 3. Mark admin gate unlocked in sessionStorage and localStorage
      sessionStorage.setItem(ADMIN_STORAGE_KEY, DEFAULT_PASSCODE);
      localStorage.setItem(ADMIN_STORAGE_KEY, DEFAULT_PASSCODE);
      await queryClient.invalidateQueries();
      setIsUnlocked(true);
      toast.success("Security passcode verified. Administrator portal unlocked.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify security passcode.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleLockSession = () => {
    try {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setIsUnlocked(false);
    setPasscodeInput("");
    toast.info("Administrator session locked.");
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Checking Administrator Security…
          </span>
        </div>
      </div>
    );
  }

  // If already unlocked with correct passcode, render the full admin dashboard and tools immediately
  if (isUnlocked) {
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
              Administrator Security Gate
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Please enter your secret administrator security passcode to access the control panel.
            </p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-security-passcode"
                className="text-xs font-medium text-slate-300"
              >
                Security Passcode
              </Label>
              <div className="relative">
                <Input
                  id="admin-security-passcode"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  autoFocus
                  placeholder="Enter security passcode"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  disabled={isPending}
                  className="border-slate-700 bg-slate-950/80 font-mono text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  Unlock Admin Portal <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-xs text-slate-400 transition-colors hover:text-slate-200"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to Customer Dashboard
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[0.7rem] text-slate-500">
          AUDIT ID: FIN-SEC-GATE · ATOMIC PLATFORM GOVERNANCE
        </p>
      </div>
    </div>
  );
}
