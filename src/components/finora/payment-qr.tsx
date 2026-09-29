import { useState } from "react";
import { QrCode, Copy, Check, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import defaultQrImage from "@/assets/deposit-qr.jpg";

export interface PaymentQRProps {
  qrUrl?: string | null;
  amount?: number | null;
  currency?: string;
  accountTitle?: string | null;
  accountNumber?: string | null;
  method?: string | null;
  bankName?: string | null;
  instructions?: string | null;
  compact?: boolean;
}

export function PaymentQRCode({
  qrUrl,
  amount,
  currency = "PKR",
  accountTitle,
  accountNumber,
  method = "Easypaisa / JazzCash / Bank",
  bankName,
  instructions,
  compact = false,
}: PaymentQRProps) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const imageSrc = qrUrl && qrUrl.trim().length > 0 ? qrUrl : defaultQrImage;

  const copyNumber = () => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success("Account number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Official Payment Gateway
            </p>
            <p className="text-sm font-semibold">{method}</p>
          </div>
        </div>
        {amount ? (
          <div className="text-right">
            <span className="text-[0.68rem] uppercase tracking-wider text-muted-foreground">
              Amount to Pay
            </span>
            <p className="num text-base font-bold text-primary">
              {currency} {amount.toLocaleString()}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
        {/* QR Code Graphic Box */}
        <div className="relative group shrink-0">
          <div
            onClick={() => setPreviewOpen(true)}
            className="cursor-pointer overflow-hidden rounded-xl border-2 border-border bg-white p-2.5 shadow-sm transition-transform duration-200 group-hover:scale-[1.02] group-hover:border-primary/60"
            title="Click to view full size QR code"
          >
            <img
              src={imageSrc}
              alt="FINORA Deposit Payment QR Code"
              className={compact ? "h-36 w-36 object-contain" : "h-44 w-44 object-contain"}
            />
          </div>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="absolute bottom-2 right-2 rounded-md bg-black/75 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
            title="Enlarge QR Code"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Payment Account Details */}
        <div className="flex-1 min-w-0 space-y-2.5 text-sm w-full">
          {accountTitle ? (
            <div className="rounded-lg bg-muted/40 p-2.5">
              <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground block">
                Account Title
              </span>
              <p className="font-semibold text-foreground break-words">{accountTitle}</p>
            </div>
          ) : null}

          {accountNumber ? (
            <div className="rounded-lg bg-muted/40 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  Account / Wallet / IBAN
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs text-primary hover:text-primary/90"
                  onClick={copyNumber}
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3 text-emerald-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" /> Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="num text-base font-bold tracking-wider text-foreground select-all mt-0.5">
                {accountNumber}
              </p>
            </div>
          ) : null}

          {bankName ? (
            <div className="rounded-lg bg-muted/40 p-2.5">
              <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground block">
                Bank / Provider
              </span>
              <p className="font-medium text-foreground">{bankName}</p>
            </div>
          ) : null}

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Verified official deposit channel. Instant admin review.</span>
          </div>
        </div>
      </div>

      {instructions ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground border-t border-border/50 pt-2.5 whitespace-pre-line">
          {instructions}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground border-t border-border/50 pt-2.5">
          Scan this QR code in your banking or wallet app (Easypaisa / JazzCash / SadaPay / Nayapay
          / Any Bank) to transfer. Take a screenshot of the receipt and upload below.
        </p>
      )}

      {/* Enlarged QR Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Scan QR Code to Pay</DialogTitle>
            <DialogDescription>
              Scan using any mobile banking or payment wallet application
            </DialogDescription>
          </DialogHeader>
          <div className="my-3 flex flex-col items-center justify-center">
            <div className="rounded-2xl border-4 border-primary/20 bg-white p-4 shadow-lg">
              <img
                src={imageSrc}
                alt="Deposit QR Code Full Size"
                className="h-64 w-64 object-contain"
              />
            </div>
            {amount ? (
              <p className="mt-4 num text-xl font-bold text-primary">
                Pay Exactly: {currency} {amount.toLocaleString()}
              </p>
            ) : null}
            {accountNumber ? (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-sm font-semibold">{accountNumber}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={copyNumber}>
                  {copied ? "Copied" : "Copy Account"}
                </Button>
              </div>
            ) : null}
          </div>
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement("a");
                link.href = imageSrc;
                link.download = "finora-payment-qr.jpg";
                link.click();
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download QR
            </Button>
            <Button type="button" size="sm" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
