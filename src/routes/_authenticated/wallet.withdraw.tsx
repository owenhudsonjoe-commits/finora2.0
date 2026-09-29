import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/finora/app-shell";
import { PageHeader } from "@/components/finora/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitWithdrawal } from "@/lib/finora.functions";
import { money } from "@/lib/format";
import { walletQuery } from "./wallet.index";

const METHODS = ["Easypaisa", "JazzCash", "UPaisa", "Bank Account"] as const;
type Method = (typeof METHODS)[number];

export const Route = createFileRoute("/_authenticated/wallet/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw funds — FINORA" },
      { name: "description", content: "Request a withdrawal from your FINORA available balance." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Withdraw funds — FINORA" },
      { property: "og:description", content: "Request a payout from your available balance." },
    ],
  }),
  component: WithdrawPage,
});

function WithdrawPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery(walletQuery);
  const cfg = data?.config["withdrawal"] ?? {};
  const available = Number(data?.wallet?.available ?? 0);
  const feePercent = Number(cfg["fee_percent"] ?? 0);
  const min = Number(cfg["min"] ?? 0);

  const [method, setMethod] = useState<Method>("Easypaisa");
  const [amount, setAmount] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");

  const value = Number(amount) || 0;
  const fee = Math.round(value * (feePercent / 100) * 100) / 100;
  const net = Math.max(0, value - fee);

  const mutation = useMutation({
    mutationFn: () =>
      submitWithdrawal({
        data: {
          amount: value,
          method,
          accountTitle: accountTitle.trim(),
          accountNumber: accountNumber.trim(),
          bankName: method === "Bank Account" ? bankName.trim() : null,
          iban: method === "Bank Account" ? iban.trim() : null,
        },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Withdrawal requested. We'll update you as it is reviewed.");
      queryClient.invalidateQueries();
      navigate({ to: "/wallet" });
    },
    onError: () =>
      toast.error("We couldn't submit that request. Please check the details and try again."),
  });

  return (
    <AppShell>
      <Link
        to="/wallet"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Wallet
      </Link>
      <PageHeader
        title="Withdraw funds"
        description="Requests are reviewed before payout. The amount is held from your available balance as soon as you submit."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface-card p-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (value < min) {
                toast.error(`Minimum withdrawal is ${money(min)}.`);
                return;
              }
              if (value > available) {
                toast.error("Amount exceeds your available balance.");
                return;
              }
              mutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Payout method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">Available {money(available)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Account title</Label>
              <Input
                id="title"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">
                {method === "Bank Account" ? "Account number" : "Mobile account number"}
              </Label>
              <Input
                id="number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </div>

            {method === "Bank Account" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bank">Bank name</Label>
                  <Input
                    id="bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN (optional)</Label>
                  <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />
                </div>
              </>
            ) : null}

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              Request withdrawal
            </Button>
          </form>
        </section>

        <aside className="surface-card h-fit p-6">
          <h2 className="font-semibold">Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Requested</dt>
              <dd className="num font-medium">{money(value)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Processing fee{feePercent ? ` (${feePercent}%)` : ""}
              </dt>
              <dd className="num font-medium">{money(fee)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3">
              <dt className="font-medium">You receive</dt>
              <dd className="num text-success font-semibold">{money(net)}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
            Minimum withdrawal {money(min)}. Requests move through review and approval before
            payout; you'll see each status change in your wallet and notifications.
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
