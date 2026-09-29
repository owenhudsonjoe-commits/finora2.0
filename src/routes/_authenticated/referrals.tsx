import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Users, Coins, UserCheck } from "lucide-react";
import { AppShell } from "@/components/finora/app-shell";
import { PageHeader, StatCard, EmptyState, LoadingRows } from "@/components/finora/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money, dateTime } from "@/lib/format";
import { getReferralData } from "@/lib/finora.functions";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — FINORA" },
      {
        name: "description",
        content: "Share your FINORA referral code and track commissions you have earned.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Referrals — FINORA" },
      { property: "og:description", content: "Share your code and track commissions." },
    ],
  }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: () => getReferralData(),
  });
  const link =
    typeof window !== "undefined" && data?.referralCode
      ? `${window.location.origin}/signup?ref=${data.referralCode}`
      : "";
  const rate = data?.settings["commission_percent"];

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <AppShell>
      <PageHeader
        title="Referrals"
        description="Invite others to FINORA. When a referred member makes a qualifying investment, your commission is credited to your wallet."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total referrals"
          value={data?.totalReferrals ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Investing referrals"
          value={data?.activeReferrals ?? 0}
          icon={<UserCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Commission earned"
          value={money(data?.earnings ?? 0)}
          icon={<Coins className="h-4 w-4" />}
          tone="accent"
        />
      </div>

      <section className="surface-card mt-6 p-6">
        <h2 className="font-semibold">Your referral code</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-2">
            <Input readOnly value={data?.referralCode ?? ""} className="num" />
            <Button
              variant="outline"
              size="icon"
              aria-label="Copy code"
              onClick={() => copy(data?.referralCode ?? "")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={link} />
            <Button variant="outline" size="icon" aria-label="Copy link" onClick={() => copy(link)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {rate ? (
          <p className="text-muted-foreground mt-4 text-xs">
            Current commission rate: {String(rate)}% of a referred member's qualifying investment.
            Rates can change for future referrals.
          </p>
        ) : null}
      </section>

      <section className="surface-card mt-6 p-5">
        <h2 className="mb-4 font-semibold">Commission history</h2>
        {isLoading ? (
          <LoadingRows />
        ) : (data?.history ?? []).length === 0 ? (
          <EmptyState
            title="No commissions yet"
            description="Commissions appear here once a referred member invests."
          />
        ) : (
          <ul className="divide-y">
            {data?.history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{h.name}</p>
                  <p className="text-muted-foreground text-xs">{dateTime(h.created_at)}</p>
                </div>
                <p className="num text-success text-sm font-semibold">{money(h.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
