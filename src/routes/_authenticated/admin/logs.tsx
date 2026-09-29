import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, LoadingRows, EmptyState } from "@/components/finora/primitives";
import { adminListLogs } from "@/lib/admin.functions";
import { dateTime, titleCase } from "@/lib/format";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({
    meta: [
      { title: "Audit logs — FINORA admin" },
      {
        name: "description",
        content: "Every administrative action recorded with actor, target and metadata.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const fn = useServerFn(adminListLogs);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-logs"], queryFn: () => fn() });

  const rows = (data ?? []).filter((l) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      l.action.toLowerCase().includes(q) ||
      (l.target_type ?? "").toLowerCase().includes(q) ||
      (l.admin?.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminShell area="logs">
      <PageHeader title="Audit logs" description="A permanent record of administrative activity." />

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search action, target or administrator"
        className="mb-4 max-w-sm"
        aria-label="Search audit logs"
      />

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No activity recorded" />
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Administrator</th>
                <th className="px-4 py-3 text-left font-medium">Target</th>
                <th className="px-4 py-3 text-left font-medium">Details</th>
                <th className="px-4 py-3 text-right font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-border/70 divide-y align-top">
              {rows.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium">{titleCase(l.action)}</td>
                  <td className="px-4 py-3">
                    <p>{l.admin?.full_name || "—"}</p>
                    <p className="text-muted-foreground text-xs">{l.admin?.email}</p>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {l.target_type ? titleCase(l.target_type) : "—"}
                  </td>
                  <td className="text-muted-foreground max-w-xs px-4 py-3 text-xs break-words">
                    {Object.keys((l.metadata ?? {}) as Record<string, unknown>).length
                      ? JSON.stringify(l.metadata).slice(0, 180)
                      : "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-right text-xs">
                    {dateTime(l.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
