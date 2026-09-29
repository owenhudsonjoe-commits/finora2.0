import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { AppShell, dashboardQuery } from "@/components/finora/app-shell";
import { PageHeader } from "@/components/finora/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { updateProfile } from "@/lib/finora.functions";
import { dateOnly } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & security — FINORA" },
      {
        name: "description",
        content: "Update your FINORA profile details and change your password.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Profile & security — FINORA" },
      { property: "og:description", content: "Manage your details and password." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery(dashboardQuery);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (data?.profile) setFullName(data.profile.full_name ?? "");
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: () => updateProfile({ data: { fullName: fullName.trim(), phone: phone.trim() } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("We couldn't save your changes."),
  });

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error("New password must be at least 8 characters and include letters and numbers.");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      ...({ current_password: currentPassword } as object),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password changed.");
    setCurrentPassword("");
    setNewPassword("");
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <AppShell>
      <PageHeader
        title="Profile & security"
        description="Keep your details current so payouts and alerts reach you."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-6">
          <h2 className="font-semibold">Your details</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={data?.profile?.email ?? ""} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03xx xxxxxxx"
              />
            </div>
            <Button type="submit" disabled={save.isPending}>
              Save changes
            </Button>
          </form>

          <dl className="text-muted-foreground mt-6 space-y-2 border-t pt-4 text-xs">
            <div className="flex justify-between">
              <dt>Referral code</dt>
              <dd className="num text-foreground font-medium">{data?.profile?.referral_code}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Member since</dt>
              <dd className="num">
                {data?.profile?.created_at ? dateOnly(data.profile.created_at) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Account status</dt>
              <dd className="capitalize">{data?.profile?.status ?? "active"}</dd>
            </div>
          </dl>
        </section>

        <section className="surface-card h-fit p-6">
          <h2 className="font-semibold">Change password</h2>
          <form className="mt-4 space-y-4" onSubmit={changePassword}>
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" variant="outline">
              Update password
            </Button>
          </form>

          <div className="mt-6 border-t pt-4">
            <Button variant="ghost" onClick={signOut} className="text-destructive">
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
