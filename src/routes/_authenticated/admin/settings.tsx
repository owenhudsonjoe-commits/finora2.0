import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { QrCode, Upload, Check } from "lucide-react";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, LoadingRows, EmptyState } from "@/components/finora/primitives";
import { adminGetSettings, adminSaveSetting } from "@/lib/admin.functions";
import { titleCase } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import defaultQrImage from "@/assets/deposit-qr.jpg";

type Config = Record<string, Record<string, string | number | boolean | null>>;

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FINORA admin" },
      {
        name: "description",
        content:
          "Platform configuration: payment channels, QR code, limits, fees and contact details.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const get = useServerFn(adminGetSettings);
  const save = useServerFn(adminSaveSetting);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Config>({});

  const { data, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: () => get() });

  useEffect(() => {
    if (data) setDraft(data as Config);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (key: string) => save({ data: { key, value: draft[key]! } }),
    onSuccess: async () => {
      toast.success("Settings saved successfully.");
      await queryClient.invalidateQueries();
    },
    onError: () => toast.error("Settings could not be saved."),
  });

  const handleQrUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setDraft((d) => ({
        ...d,
        deposit: {
          ...d.deposit,
          qr_url: dataUrl,
        },
      }));
      toast.success("QR code loaded! Click 'Save Deposit' to publish it.");
    };
    reader.readAsDataURL(file);
  };

  const keys = Object.keys(draft).sort();

  return (
    <AdminShell area="settings">
      <PageHeader
        title="Platform settings"
        description="Configure official payment channels, QR code, account details, limits and platform variables."
      />

      {isLoading ? (
        <LoadingRows rows={5} />
      ) : keys.length === 0 ? (
        <EmptyState title="No settings configured" />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {keys.map((key) => {
            const isDeposit = key === "deposit";
            const currentQr =
              draft.deposit?.qr_url && String(draft.deposit.qr_url).trim().length > 0
                ? String(draft.deposit.qr_url)
                : defaultQrImage;

            return (
              <div key={key} className="surface-card p-6 rounded-xl border border-border/80">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h2 className="text-base font-bold">{titleCase(key)} Settings</h2>
                  {isDeposit ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Payment Gateway
                    </span>
                  ) : null}
                </div>

                {/* If Deposit settings, render dedicated QR code manager */}
                {isDeposit ? (
                  <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-primary" />
                      Active Deposit QR Code
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="h-32 w-32 shrink-0 rounded-lg border-2 border-border bg-white p-2 shadow-sm">
                        <img
                          src={currentQr}
                          alt="Current QR Code"
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="space-y-2 text-xs w-full">
                        <p className="text-muted-foreground">
                          This QR code is shown to all users on the direct plan activation and
                          wallet deposit pages.
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <input
                            id="qr-file-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleQrUpload(f);
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="text-xs"
                            onClick={() => document.getElementById("qr-file-input")?.click()}
                          >
                            <Upload className="mr-1 h-3.5 w-3.5" /> Upload Custom QR
                          </Button>
                          {draft.deposit?.qr_url ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-xs text-muted-foreground"
                              onClick={() =>
                                setDraft((d) => ({
                                  ...d,
                                  deposit: { ...d.deposit, qr_url: "" },
                                }))
                              }
                            >
                              Reset to Default
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  {Object.entries(draft[key] ?? {}).map(([field, value]) => (
                    <div key={field}>
                      <Label htmlFor={`${key}-${field}`} className="text-xs">
                        {titleCase(field)}
                      </Label>
                      <Input
                        id={`${key}-${field}`}
                        className="mt-1 text-sm"
                        value={value === null ? "" : String(value)}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            [key]: {
                              ...d[key],
                              [field]:
                                typeof value === "number" ? Number(e.target.value) : e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="mt-5 font-semibold"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(key)}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Save {titleCase(key)}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
