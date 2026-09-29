import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/finora/app-shell";
import { PageHeader, StatusBadge, EmptyState, LoadingRows } from "@/components/finora/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dateTime } from "@/lib/format";
import { getTickets, createTicket, replyToTicket } from "@/lib/finora.functions";

const CATEGORIES = ["general", "deposit", "withdrawal", "investment", "account"];

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support — FINORA" },
      {
        name: "description",
        content: "Open a support ticket and track replies from the FINORA team.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Support — FINORA" },
      { property: "og:description", content: "Open a ticket and track replies." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tickets"], queryFn: () => getTickets() });
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: () =>
      createTicket({ data: { subject: subject.trim(), category, message: message.trim() } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Ticket created. Our team will reply shortly.");
      setSubject("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: () => toast.error("We couldn't create that ticket."),
  });

  const reply = useMutation({
    mutationFn: (vars: { ticketId: string; message: string }) => replyToTicket({ data: vars }),
    onSuccess: (res, vars) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setReplies((r) => ({ ...r, [vars.ticketId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: () => toast.error("We couldn't send that reply."),
  });

  return (
    <AppShell>
      <PageHeader
        title="Support"
        description="Ask us anything about your account, deposits, payouts or plans."
      />

      <section className="surface-card mt-6 p-6">
        <h2 className="font-semibold">Open a new ticket</h2>
        <form
          className="mt-4 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (subject.trim().length < 3 || message.trim().length < 5) {
              toast.error("Add a subject and a short description.");
              return;
            }
            create.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">How can we help?</Label>
            <Textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={create.isPending} className="justify-self-start">
            Create ticket
          </Button>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-semibold">Your tickets</h2>
        {isLoading ? (
          <LoadingRows rows={3} />
        ) : (data?.tickets ?? []).length === 0 ? (
          <EmptyState
            title="No tickets yet"
            description="When you contact us, the conversation appears here."
          />
        ) : (
          data?.tickets.map((t) => {
            const thread = (data.messages ?? []).filter((m) => m.ticket_id === t.id);
            return (
              <article key={t.id} className="surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{t.subject}</h3>
                    <p className="text-muted-foreground text-xs">
                      {t.category} · opened {dateTime(t.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <ul className="mt-4 space-y-3">
                  {thread.map((m) => (
                    <li
                      key={m.id}
                      className={`rounded-lg p-3 text-sm ${m.is_admin ? "bg-accent/10" : "bg-muted/60"}`}
                    >
                      <p className="text-muted-foreground mb-1 text-xs font-medium">
                        {m.is_admin ? "FINORA support" : "You"} · {dateTime(m.created_at)}
                      </p>
                      <p className="whitespace-pre-line">{m.message}</p>
                    </li>
                  ))}
                </ul>

                {t.status !== "closed" ? (
                  <form
                    className="mt-4 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const text = (replies[t.id] ?? "").trim();
                      if (!text) return;
                      reply.mutate({ ticketId: t.id, message: text });
                    }}
                  >
                    <Input
                      value={replies[t.id] ?? ""}
                      onChange={(e) => setReplies((r) => ({ ...r, [t.id]: e.target.value }))}
                      placeholder="Write a reply…"
                    />
                    <Button type="submit" disabled={reply.isPending}>
                      Send
                    </Button>
                  </form>
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
