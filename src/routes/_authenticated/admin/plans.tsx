import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, StatusBadge, LoadingRows, EmptyState } from "@/components/finora/primitives";
import { adminListPlans, adminSavePlan } from "@/lib/admin.functions";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PlanForm = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  investment_amount: string;
  min_investment: string;
  max_investment: string;
  daily_earning: string;
  duration_days: string;
  fees: string;
  risk_level: string;
  terms: string;
  disclosure: string;
  status: "active" | "disabled" | "archived";
  featured: boolean;
  display_order: string;
};

const EMPTY: PlanForm = {
  id: null,
  name: "",
  slug: "",
  description: "",
  investment_amount: "0",
  min_investment: "0",
  max_investment: "0",
  daily_earning: "0",
  duration_days: "60",
  fees: "0",
  risk_level: "Medium",
  terms: "",
  disclosure: "",
  status: "active",
  featured: false,
  display_order: "0",
};

export const Route = createFileRoute("/_authenticated/admin/plans")({
  head: () => ({
    meta: [
      { title: "Plans — FINORA admin" },
      {
        name: "description",
        content: "Create and maintain the investment plans offered on the platform.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const list = useServerFn(adminListPlans);
  const save = useServerFn(adminSavePlan);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlanForm | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-plans"], queryFn: () => list() });

  const mutation = useMutation({
    mutationFn: (f: PlanForm) =>
      save({
        data: {
          id: f.id,
          name: f.name,
          slug: f.slug,
          description: f.description,
          investment_amount: Number(f.investment_amount),
          min_investment: Number(f.min_investment),
          max_investment: Number(f.max_investment),
          daily_earning: Number(f.daily_earning),
          duration_days: Number(f.duration_days),
          fees: Number(f.fees),
          risk_level: f.risk_level,
          terms: f.terms,
          disclosure: f.disclosure,
          status: f.status,
          featured: f.featured,
          display_order: Number(f.display_order),
        },
      }),
    onSuccess: async (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Plan saved. Existing investments keep their original terms.");
      setForm(null);
      await queryClient.invalidateQueries();
    },
    onError: () => toast.error("The plan could not be saved. Check the values and try again."),
  });

  const set = (key: keyof PlanForm, value: string | boolean) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <AdminShell area="plans">
      <PageHeader
        title="Investment plans"
        description="Plans are stored in the database. Editing a plan never changes investments already purchased."
        actions={<Button onClick={() => setForm(EMPTY)}>New plan</Button>}
      />

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="No plans configured"
          description="Create your first plan to open investing."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((p) => (
            <div key={p.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-muted-foreground text-xs">/{p.slug}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <dl className="mt-4 space-y-1 text-sm">
                <Row label="Investment" value={money(p.investment_amount)} />
                <Row label="Daily earning" value={money(p.daily_earning)} />
                <Row label="Duration" value={`${p.duration_days} days`} />
                <Row label="Fees" value={money(p.fees)} />
                <Row label="Risk" value={p.risk_level} />
              </dl>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() =>
                  setForm({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    description: p.description,
                    investment_amount: String(p.investment_amount),
                    min_investment: String(p.min_investment),
                    max_investment: String(p.max_investment),
                    daily_earning: String(p.daily_earning),
                    duration_days: String(p.duration_days),
                    fees: String(p.fees),
                    risk_level: p.risk_level,
                    terms: p.terms,
                    disclosure: p.disclosure,
                    status: p.status as PlanForm["status"],
                    featured: p.featured,
                    display_order: String(p.display_order),
                  })
                }
              >
                Edit plan
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit plan" : "New plan"}</DialogTitle>
            <DialogDescription>
              Changes apply to new investments only. Investments already purchased keep their locked
              terms.
            </DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => set("name", v)} />
              <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} />
              <Field
                label="Investment amount"
                value={form.investment_amount}
                onChange={(v) => set("investment_amount", v)}
              />
              <Field
                label="Daily earning"
                value={form.daily_earning}
                onChange={(v) => set("daily_earning", v)}
              />
              <Field
                label="Minimum"
                value={form.min_investment}
                onChange={(v) => set("min_investment", v)}
              />
              <Field
                label="Maximum"
                value={form.max_investment}
                onChange={(v) => set("max_investment", v)}
              />
              <Field
                label="Duration (days)"
                value={form.duration_days}
                onChange={(v) => set("duration_days", v)}
              />
              <Field label="Fees" value={form.fees} onChange={(v) => set("fees", v)} />
              <Field
                label="Risk level"
                value={form.risk_level}
                onChange={(v) => set("risk_level", v)}
              />
              <Field
                label="Display order"
                value={form.display_order}
                onChange={(v) => set("display_order", v)}
              />
              <div className="sm:col-span-2">
                <Label htmlFor="plan-desc">Description</Label>
                <Textarea
                  id="plan-desc"
                  className="mt-1"
                  rows={2}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="plan-terms">Terms</Label>
                <Textarea
                  id="plan-terms"
                  className="mt-1"
                  rows={3}
                  value={form.terms}
                  onChange={(e) => set("terms", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="plan-disc">Risk disclosure</Label>
                <Textarea
                  id="plan-disc"
                  className="mt-1"
                  rows={3}
                  value={form.disclosure}
                  onChange={(e) => set("disclosure", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="plan-featured"
                  checked={form.featured}
                  onCheckedChange={(v) => set("featured", v)}
                />
                <Label htmlFor="plan-featured">Featured</Label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["active", "disabled", "archived"] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={form.status === s ? "default" : "outline"}
                    onClick={() => set("status", s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button disabled={mutation.isPending} onClick={() => form && mutation.mutate(form)}>
              {mutation.isPending ? "Saving…" : "Save plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="num font-medium">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
