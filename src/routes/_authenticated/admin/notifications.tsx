import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader } from "@/components/finora/primitives";
import { adminSendNotification } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const GROUPS = [
  { value: "all", label: "All members" },
  { value: "active_investors", label: "Active investors" },
  { value: "pending_deposits", label: "Members with pending deposits" },
  { value: "pending_withdrawals", label: "Members with pending withdrawals" },
] as const;

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Broadcasts — FINORA admin" },
      { name: "description", content: "Send in-app announcements to member segments." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BroadcastPage,
});

function BroadcastPage() {
  const send = useServerFn(adminSendNotification);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [group, setGroup] = useState<(typeof GROUPS)[number]["value"]>("all");

  const mutation = useMutation({
    mutationFn: () => send({ data: { title, message, link, group } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(`Sent to ${res.recipients} members.`);
      setTitle("");
      setMessage("");
      setLink("");
    },
    onError: () => toast.error("The broadcast could not be sent."),
  });

  return (
    <AdminShell area="notifications">
      <PageHeader
        title="Broadcasts"
        description="Announcements appear in each member's notification centre."
      />

      <div className="surface-card max-w-2xl space-y-4 p-6">
        <div>
          <Label>Audience</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <Button
                key={g.value}
                type="button"
                size="sm"
                variant={group === g.value ? "default" : "outline"}
                onClick={() => setGroup(g.value)}
              >
                {g.label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="b-title">Title</Label>
          <Input
            id="b-title"
            className="mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="b-message">Message</Label>
          <Textarea
            id="b-message"
            className="mt-1"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="b-link">Link (optional)</Label>
          <Input
            id="b-link"
            className="mt-1"
            placeholder="/wallet"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <Button
          disabled={mutation.isPending || title.trim().length < 2 || message.trim().length < 2}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Sending…" : "Send broadcast"}
        </Button>
      </div>
    </AdminShell>
  );
}
