import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, StatusBadge, LoadingRows, EmptyState } from "@/components/finora/primitives";
import { adminListTickets, adminReplyTicket } from "@/lib/admin.functions";
import { dateTime, titleCase } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STATUSES = ["open", "in_progress", "waiting_user", "resolved", "closed"] as const;

export const Route = createFileRoute("/_authenticated/admin/support")({
  head: () => ({
    meta: [
      { title: "Support — FINORA admin" },
      {
        name: "description",
        content: "Respond to member support tickets and manage their status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const list = useServerFn(adminListTickets);
  const reply = useServerFn(adminReplyTicket);
  const queryClient = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: () => list(),
    refetchInterval: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (v: { ticketId: string; message: string; status: string }) => reply({ data: v }),
    onSuccess: async () => {
      toast.success("Ticket updated.");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: () => toast.error("The ticket could not be updated."),
  });

  const tickets = data?.tickets ?? [];
  const selected = tickets.find((t) => t.id === active) ?? tickets[0] ?? null;
  const thread = (data?.messages ?? []).filter((m) => m.ticket_id === selected?.id);

  return (
    <AdminShell area="support">
      <PageHeader
        title="Support"
        description="Member conversations and their current handling status."
      />

      {isLoading ? (
        <LoadingRows rows={5} />
      ) : tickets.length === 0 ? (
        <EmptyState title="No tickets" description="Member questions will appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="surface-card max-h-[70vh] overflow-y-auto p-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "w-full rounded-md px-3 py-3 text-left transition-colors",
                  selected?.id === t.id ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <p className="truncate text-sm font-medium">{t.subject}</p>
                <p className="text-muted-foreground truncate text-xs">{t.user?.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <span className="text-muted-foreground text-[0.68rem]">
                    {titleCase(t.category)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="surface-card flex flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{selected.subject}</h2>
                  <p className="text-muted-foreground text-xs">
                    {selected.user?.full_name} · {selected.user?.email} · opened{" "}
                    {dateTime(selected.created_at)}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="mt-5 max-h-[45vh] flex-1 space-y-3 overflow-y-auto">
                {thread.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No messages in this ticket yet.</p>
                ) : (
                  thread.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[85%] rounded-lg px-4 py-3 text-sm",
                        m.is_admin ? "bg-primary text-primary-foreground ml-auto" : "bg-muted",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.message}</p>
                      <p
                        className={cn(
                          "mt-1 text-[0.68rem]",
                          m.is_admin ? "text-primary-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {m.is_admin ? "FINORA support" : "Member"} · {dateTime(m.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-border/70 mt-5 border-t pt-4">
                <Textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a reply…"
                  aria-label="Reply message"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={mutation.isPending || !message.trim()}
                    onClick={() =>
                      mutation.mutate({ ticketId: selected.id, message, status: "in_progress" })
                    }
                  >
                    Send reply
                  </Button>
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      disabled={mutation.isPending || selected.status === s}
                      onClick={() =>
                        mutation.mutate({ ticketId: selected.id, message: "", status: s })
                      }
                    >
                      {titleCase(s)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}
