import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, LoadingRows, EmptyState } from "@/components/finora/primitives";
import { adminGetContent, adminSaveContent } from "@/lib/admin.functions";
import { titleCase } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Page = { slug: string; title: string; body: Record<string, string> };

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({
    meta: [
      { title: "Content — FINORA admin" },
      { name: "description", content: "Edit the public pages served across the FINORA website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  const get = useServerFn(adminGetContent);
  const save = useServerFn(adminSaveContent);
  const queryClient = useQueryClient();
  const [pages, setPages] = useState<Page[]>([]);
  const [active, setActive] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-content"], queryFn: () => get() });

  useEffect(() => {
    if (data) {
      setPages(data);
      setActive((a) => a ?? data[0]?.slug ?? null);
    }
  }, [data]);

  const current = pages.find((p) => p.slug === active) ?? null;

  const mutation = useMutation({
    mutationFn: (p: Page) => save({ data: p }),
    onSuccess: async (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Page saved.");
      await queryClient.invalidateQueries();
    },
    onError: () => toast.error("The page could not be saved."),
  });

  const update = (field: string, value: string) =>
    setPages((all) =>
      all.map((p) => (p.slug === active ? { ...p, body: { ...p.body, [field]: value } } : p)),
    );

  return (
    <AdminShell area="content">
      <PageHeader
        title="Site content"
        description="Text shown on the public pages is stored in the database."
      />

      {isLoading ? (
        <LoadingRows rows={5} />
      ) : pages.length === 0 ? (
        <EmptyState title="No content pages" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="surface-card p-2">
            {pages.map((p) => (
              <button
                key={p.slug}
                onClick={() => setActive(p.slug)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  active === p.slug ? "bg-muted font-medium" : "hover:bg-muted/60",
                )}
              >
                {p.title || titleCase(p.slug)}
              </button>
            ))}
          </div>

          {current ? (
            <div className="surface-card space-y-4 p-5">
              <div>
                <Label htmlFor="c-title">Page title</Label>
                <Input
                  id="c-title"
                  className="mt-1"
                  value={current.title}
                  onChange={(e) =>
                    setPages((all) =>
                      all.map((p) =>
                        p.slug === current.slug ? { ...p, title: e.target.value } : p,
                      ),
                    )
                  }
                />
              </div>
              {Object.entries(current.body).map(([field, value]) => (
                <div key={field}>
                  <Label htmlFor={`c-${field}`}>{titleCase(field)}</Label>
                  <Textarea
                    id={`c-${field}`}
                    className="mt-1"
                    rows={value.length > 200 ? 8 : 3}
                    value={value}
                    onChange={(e) => update(field, e.target.value)}
                  />
                </div>
              ))}
              <Button disabled={mutation.isPending} onClick={() => mutation.mutate(current)}>
                {mutation.isPending ? "Saving…" : "Save page"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}
