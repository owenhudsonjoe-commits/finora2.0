import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ImageIcon,
  X,
  CreditCard,
  Wallet,
} from "lucide-react";
import { AppShell, dashboardQuery } from "@/components/finora/app-shell";
import { PageHeader } from "@/components/finora/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { money } from "@/lib/format";
import { getPublicPlans, type PublicPlan } from "@/lib/public.functions";
import { investInPlan, submitDeposit, getWalletData } from "@/lib/finora.functions";
import { supabase } from "@/integrations/supabase/client";
import { PaymentQRCode } from "@/components/finora/payment-qr";

export const Route = createFileRoute("/_authenticated/invest")({
  head: () => ({
    meta: [
      { title: "Activate Plan — FINORA" },
      {
        name: "description",
        content: "Scan QR code to pay and activate your 60-day FINORA investment plan directly.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Activate Plan — FINORA" },
      {
        property: "og:description",
        content: "Direct plan activation with QR code payment and proof verification.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { plan?: string; planId?: string } => ({
    plan: typeof search["plan"] === "string" ? search["plan"] : undefined,
    planId: typeof search["planId"] === "string" ? search["planId"] : undefined,
  }),
  component: InvestPage,
});

async function fileToDataOrPath(file: File): Promise<string> {
  try {
    const { data: session } = await supabase.auth.getUser();
    const uid = session.user?.id;
    if (uid) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${uid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { upsert: false });
      if (!error) return path;
    }
  } catch (err) {
    console.warn("Storage upload failed, falling back to data URL", err);
  }

  // Fallback to base64 Data URL so screenshot upload is never blocked
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function InvestPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<PublicPlan | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"qr" | "wallet">("qr");

  // Screenshot form state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [txnId, setTxnId] = useState("");
  const [senderInfo, setSenderInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["public-plans"],
    queryFn: () => getPublicPlans(),
  });

  const { data: dash } = useQuery(dashboardQuery);
  const available = Number(dash?.wallet?.available ?? 0);

  const { data: walletData } = useQuery({
    queryKey: ["wallet-data"],
    queryFn: () => getWalletData(),
  });

  const depositCfg = (walletData?.config?.["deposit"] ?? {}) as Record<
    string,
    string | number | boolean | null
  >;

  // Auto-open plan if query param provided
  useEffect(() => {
    if (plans && plans.length > 0 && !selected) {
      if (search.plan) {
        const found = plans.find((p) => p.slug === search.plan || p.id === search.plan);
        if (found) setSelected(found);
      } else if (search.planId) {
        const found = plans.find((p) => p.id === search.planId);
        if (found) setSelected(found);
      }
    }
  }, [plans, search.plan, search.planId, selected]);

  // Handle image file selection with live preview
  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  // Direct QR Code payment submission
  const submitPlanPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Please select a plan to activate.");
      if (!file) throw new Error("Please upload a screenshot of your payment receipt.");
      if (!agreed) throw new Error("Please confirm the terms to activate your plan.");

      setSubmitting(true);
      const screenshotPath = await fileToDataOrPath(file);
      const reference = txnId.trim()
        ? senderInfo.trim()
          ? `${txnId.trim()} (${senderInfo.trim()})`
          : txnId.trim()
        : senderInfo.trim() || `Plan-${selected.name}-${Date.now().toString().slice(-6)}`;

      const res = await submitDeposit({
        data: {
          amount: Number(selected.investment_amount),
          externalTxnId: reference,
          screenshotPath,
          planId: selected.id,
        },
      });

      if (!res.ok) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      toast.success(
        `Payment proof submitted for ${selected?.name}! Admin will review and activate your plan shortly.`,
      );
      setSelected(null);
      setFile(null);
      setPreviewUrl(null);
      setTxnId("");
      setSenderInfo("");
      setAgreed(false);
      queryClient.invalidateQueries();
      navigate({ to: "/investments" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit plan payment proof.");
    },
    onSettled: () => setSubmitting(false),
  });

  // Optional wallet balance direct investment mutation
  const walletInvestMutation = useMutation({
    mutationFn: (planId: string) => investInPlan({ data: { planId, agreed: true } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Investment activated immediately! Daily earning cycle started.");
      setSelected(null);
      setAgreed(false);
      queryClient.invalidateQueries();
      navigate({ to: "/investments" });
    },
    onError: () => toast.error("Could not activate investment with wallet balance."),
  });

  return (
    <AppShell>
      <PageHeader
        title="Activate Investment Plan"
        description="Choose a plan below. You can activate directly by scanning the payment QR code and submitting your payment screenshot—no separate wallet pre-deposit needed!"
      />

      {/* Overview Banner */}
      <div className="surface-card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Fixed Term</p>
            <p className="text-base font-semibold">60 Days Term · Double Projected Returns</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Available Wallet
            </p>
            <p className="num text-lg font-semibold">{money(available)}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/wallet/deposit">Manual deposit</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-muted h-64 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => {
            const totalProjected = Number(plan.daily_earning) * plan.duration_days;
            const canPayWithWallet = available >= Number(plan.investment_amount);

            return (
              <div
                key={plan.id}
                className="surface-card group relative flex flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                {plan.featured ? (
                  <span className="bg-accent text-accent-foreground absolute -top-2.5 right-6 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase">
                    Popular
                  </span>
                ) : null}

                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{plan.name}</h2>
                    <p className="text-xs text-muted-foreground">{plan.risk_level} Risk</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {plan.duration_days} Days
                  </span>
                </div>

                <div className="mt-4 rounded-lg bg-muted/30 p-3">
                  <span className="text-[0.68rem] uppercase tracking-wider text-muted-foreground">
                    Required Allocation
                  </span>
                  <p className="num text-2xl font-bold text-foreground">
                    {money(Number(plan.investment_amount), plan.currency)}
                  </p>
                </div>

                <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Daily Earning</dt>
                    <dd className="num font-semibold text-emerald-600 dark:text-emerald-400">
                      {money(Number(plan.daily_earning), plan.currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="num font-medium">{plan.duration_days} Days</dd>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2">
                    <dt className="font-medium text-foreground">Total Return (2x)</dt>
                    <dd className="num font-bold text-foreground">
                      {money(totalProjected, plan.currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <dt>Platform Fees</dt>
                    <dd className="num">
                      {Number(plan.fees) > 0
                        ? money(Number(plan.fees), plan.currency)
                        : "None (0%)"}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  Direct QR code payment & screenshot upload
                </p>

                <div className="mt-5 pt-2">
                  <Button
                    className="w-full font-semibold shadow-sm"
                    onClick={() => {
                      setSelected(plan);
                      setAgreed(false);
                      setFile(null);
                      setPreviewUrl(null);
                      setTxnId("");
                      setSenderInfo("");
                      setPaymentMode("qr");
                    }}
                  >
                    Activate Plan <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  {canPayWithWallet ? (
                    <p className="text-center text-[0.7rem] text-muted-foreground mt-1.5">
                      Available wallet balance can also be used
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Plan Activation & Payment Dialog */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(o) => {
          if (!o && !submitting) {
            setSelected(null);
            handleFileChange(null);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Activate {selected?.name} Plan</DialogTitle>
            <DialogDescription>
              Direct plan payment gateway. Scan the QR code, pay the exact amount, and upload your
              payment screenshot below for admin approval.
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-5 pt-2">
              {/* Plan Financial Summary */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-[0.68rem] uppercase tracking-wider text-muted-foreground block">
                    Plan Amount
                  </span>
                  <span className="num text-base font-bold text-primary">
                    {money(Number(selected.investment_amount), selected.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[0.68rem] uppercase tracking-wider text-muted-foreground block">
                    Daily Earning
                  </span>
                  <span className="num text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {money(Number(selected.daily_earning), selected.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[0.68rem] uppercase tracking-wider text-muted-foreground block">
                    Duration
                  </span>
                  <span className="num text-base font-bold text-foreground">
                    {selected.duration_days} Days
                  </span>
                </div>
                <div>
                  <span className="text-[0.68rem] uppercase tracking-wider text-muted-foreground block">
                    Total Return
                  </span>
                  <span className="num text-base font-bold text-foreground">
                    {money(
                      Number(selected.daily_earning) * selected.duration_days,
                      selected.currency,
                    )}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selector if user has enough wallet balance */}
              {available >= Number(selected.investment_amount) ? (
                <div className="flex rounded-lg bg-muted p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("qr")}
                    className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
                      paymentMode === "qr"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <CreditCard className="inline mr-1.5 h-3.5 w-3.5" />
                    Pay via QR Code & Screenshot
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("wallet")}
                    className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
                      paymentMode === "wallet"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Wallet className="inline mr-1.5 h-3.5 w-3.5" />
                    Pay from Wallet Balance ({money(available)})
                  </button>
                </div>
              ) : null}

              {paymentMode === "qr" ? (
                <>
                  {/* Payment QR Code Box */}
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Step 1: Scan & Transfer
                    </p>
                    <PaymentQRCode
                      qrUrl={depositCfg["qr_url"] ? String(depositCfg["qr_url"]) : null}
                      amount={Number(selected.investment_amount)}
                      currency={selected.currency}
                      accountTitle={String(
                        depositCfg["account_name"] ||
                          depositCfg["account_title"] ||
                          "FINORA Official",
                      )}
                      accountNumber={String(depositCfg["account_number"] || "0300-1234567")}
                      method={String(
                        depositCfg["method"] || "Easypaisa / JazzCash / Bank Transfer",
                      )}
                      bankName={depositCfg["bank_name"] ? String(depositCfg["bank_name"]) : null}
                      instructions={
                        depositCfg["instructions"] ? String(depositCfg["instructions"]) : null
                      }
                      compact
                    />
                  </section>

                  {/* Screenshot & Proof Upload Section */}
                  <section className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Step 2: Upload Payment Screenshot (Receipt Proof)
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Please upload the screenshot below the payment so the administrator can
                        verify and activate your plan.
                      </p>
                    </div>

                    {/* Screenshot File Picker / Preview */}
                    <div className="space-y-2">
                      <Label htmlFor="plan-proof">
                        Payment Screenshot / Receipt Image{" "}
                        <span className="text-destructive">*</span>
                      </Label>

                      {previewUrl ? (
                        <div className="relative rounded-lg border border-border p-2 bg-muted/30 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={previewUrl}
                              alt="Payment Screenshot Preview"
                              className="h-16 w-16 object-cover rounded-md border border-border shrink-0"
                            />
                            <div className="min-w-0 text-xs">
                              <p className="font-semibold truncate">{file?.name}</p>
                              <p className="text-muted-foreground">
                                {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                              </p>
                              <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="h-3 w-3" /> Ready to submit
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:bg-destructive/10"
                            onClick={() => handleFileChange(null)}
                          >
                            <X className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/80 p-5 text-center hover:border-primary/50 transition-colors">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-medium">Click to select payment screenshot</p>
                          <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                            Supports PNG, JPG, JPEG, WEBP or PDF receipt
                          </p>
                          <input
                            id="plan-proof"
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="mt-3 text-xs"
                            onClick={() => document.getElementById("plan-proof")?.click()}
                          >
                            <Upload className="mr-1.5 h-3.5 w-3.5" /> Choose Screenshot
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Transaction Reference / ID */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="txn-id" className="text-xs">
                          Transaction ID / TID / Ref No.
                        </Label>
                        <Input
                          id="txn-id"
                          placeholder="e.g. TID from SMS receipt"
                          value={txnId}
                          onChange={(e) => setTxnId(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sender-info" className="text-xs">
                          Sender Name or Mobile (Optional)
                        </Label>
                        <Input
                          id="sender-info"
                          placeholder="Sender title or mobile number"
                          value={senderInfo}
                          onChange={(e) => setSenderInfo(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                /* Wallet balance payment flow */
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Wallet Balance Payment</span>
                    <span className="num font-bold text-primary">{money(available)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your available balance of {money(available)} will be used to activate the{" "}
                    {selected.name} plan immediately.
                  </p>
                </div>
              )}

              {/* Terms Checkbox */}
              <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                <label className="flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer select-none">
                  <Checkbox
                    checked={agreed}
                    onCheckedChange={(c) => setAgreed(Boolean(c))}
                    className="mt-0.5"
                  />
                  <span>
                    I confirm that I have transferred{" "}
                    <strong>{money(Number(selected.investment_amount), selected.currency)}</strong>{" "}
                    and agree to the <strong>60-day plan terms</strong>. I understand the plan will
                    become active once verified by the administrator.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    submitting ||
                    submitPlanPaymentMutation.isPending ||
                    walletInvestMutation.isPending
                  }
                  onClick={() => {
                    setSelected(null);
                    handleFileChange(null);
                  }}
                >
                  Cancel
                </Button>

                {paymentMode === "qr" ? (
                  <Button
                    type="button"
                    disabled={!file || !agreed || submitting || submitPlanPaymentMutation.isPending}
                    onClick={() => submitPlanPaymentMutation.mutate()}
                    className="font-semibold"
                  >
                    {submitting || submitPlanPaymentMutation.isPending ? (
                      <>
                        <Clock className="mr-1.5 h-4 w-4 animate-spin" /> Submitting Proof...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-1.5 h-4 w-4" /> Submit Proof & Activate Plan
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={!agreed || walletInvestMutation.isPending}
                    onClick={() => walletInvestMutation.mutate(selected.id)}
                    className="font-semibold"
                  >
                    {walletInvestMutation.isPending ? "Activating..." : "Confirm & Activate Now"}
                  </Button>
                )}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
