import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Upload, ImageIcon, X, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/finora/app-shell";
import { PageHeader } from "@/components/finora/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { submitDeposit } from "@/lib/finora.functions";
import { money } from "@/lib/format";
import { walletQuery } from "./wallet.index";
import { PaymentQRCode } from "@/components/finora/payment-qr";

export const Route = createFileRoute("/_authenticated/wallet/deposit")({
  head: () => ({
    meta: [
      { title: "Deposit funds — FINORA" },
      {
        name: "description",
        content: "Submit a deposit with payment proof and QR code to fund your FINORA wallet.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Deposit funds — FINORA" },
      { property: "og:description", content: "Fund your wallet with verified payment proof." },
    ],
  }),
  component: DepositPage,
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

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function DepositPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery(walletQuery);
  const cfg = (data?.config["deposit"] ?? {}) as Record<string, string | number | boolean | null>;

  const [amount, setAmount] = useState("");
  const [txnId, setTxnId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (selected: File | null) => {
    setFile(selected);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a valid amount.");
      let path: string | null = null;
      if (file) {
        path = await fileToDataOrPath(file);
      }
      return submitDeposit({
        data: { amount: value, externalTxnId: txnId.trim(), screenshotPath: path, planId: null },
      });
    },
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Deposit submitted. You'll be notified once verified by administrator.");
      queryClient.invalidateQueries();
      navigate({ to: "/wallet" });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  const min = Number(cfg["min"] ?? 0);
  const max = Number(cfg["max"] ?? 0);

  return (
    <AppShell>
      <Link
        to="/wallet"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Wallet
      </Link>
      <PageHeader
        title="Deposit funds"
        description="Transfer using the official QR code or account details below, then submit your payment screenshot for administrator verification."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Payment QR Code and Instructions */}
        <section className="space-y-4">
          <PaymentQRCode
            qrUrl={cfg["qr_url"] ? String(cfg["qr_url"]) : null}
            amount={Number(amount) || null}
            accountTitle={String(cfg["account_name"] || cfg["account_title"] || "FINORA Official")}
            accountNumber={String(cfg["account_number"] || "0300-1234567")}
            method={String(cfg["method"] || "Easypaisa / JazzCash / Bank")}
            bankName={cfg["bank_name"] ? String(cfg["bank_name"]) : null}
            instructions={cfg["instructions"] ? String(cfg["instructions"]) : null}
          />

          <div className="surface-card p-4 rounded-xl text-xs space-y-2 text-muted-foreground">
            <p className="font-semibold text-foreground">Deposit Limits:</p>
            <p>
              Minimum deposit: {money(min)} · Maximum deposit: {max ? money(max) : "No maximum"}
            </p>
            <p>
              Looking to subscribe to an investment plan? You can also{" "}
              <Link to="/invest" className="text-primary font-semibold underline">
                activate plans directly
              </Link>{" "}
              without an advance wallet deposit.
            </p>
          </div>
        </section>

        {/* Deposit Submission Form */}
        <section className="surface-card p-6 rounded-xl border border-border/70 space-y-4">
          <div>
            <h2 className="font-semibold text-base">Submit Payment Proof</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter the amount transferred and attach your receipt screenshot below.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setUploading(true);
              mutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount Transferred (PKR) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txn">
                Transaction ID / Reference (TID) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="txn"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="From your receipt or SMS"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">
                Payment Screenshot <span className="text-destructive">*</span>
              </Label>

              {previewUrl ? (
                <div className="relative rounded-lg border border-border p-2 bg-muted/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={previewUrl}
                      alt="Receipt Preview"
                      className="h-16 w-16 object-cover rounded-md border border-border shrink-0"
                    />
                    <div className="min-w-0 text-xs">
                      <p className="font-semibold truncate">{file?.name}</p>
                      <p className="text-muted-foreground">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Attached
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
                  <p className="text-xs font-medium">Select payment screenshot / receipt</p>
                  <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                    Supports PNG, JPG, JPEG, WEBP or PDF
                  </p>
                  <input
                    id="proof"
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
                    onClick={() => document.getElementById("proof")?.click()}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Choose Screenshot
                  </Button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={mutation.isPending || uploading || !file || !amount}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              {mutation.isPending || uploading
                ? "Submitting..."
                : "Submit Deposit for Verification"}
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
