import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { AppShell } from "@/components/finora/app-shell";
import { PageHeader, EmptyState, LoadingRows } from "@/components/finora/primitives";
import { dateTime } from "@/lib/format";
import { getNotifications, markNotificationsRead } from "@/lib/finora.functions";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — FINORA" },
      {
        name: "description",
        content: "Account alerts for deposits, withdrawals, investments and support replies.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Notifications — FINORA" },
      { property: "og:description", content: "Alerts for every account event." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
  });

  useEffect(() => {
    if (data?.some((n) => !n.read)) {
      markNotificationsRead()
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.length]);

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        description="Everything that happened on your account, newest first."
      />

      <div className="surface-card mt-6 p-5">
        {isLoading ? (
          <LoadingRows rows={6} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState title="Nothing yet" description="Account alerts will show up here." />
        ) : (
          <ul className="divide-y">
            {data?.map((n) => (
              <li key={n.id} className="flex gap-3 py-4">
                <span className={`mt-0.5 ${n.read ? "text-muted-foreground" : "text-accent"}`}>
                  <BellRing className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm">{n.message}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{dateTime(n.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
