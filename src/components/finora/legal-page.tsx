import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "./public-layout";
import { getSiteContent } from "@/lib/public.functions";

export const siteContentQuery = {
  queryKey: ["site-content"] as const,
  queryFn: () => getSiteContent(),
};

export function LegalPage({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const { data, isLoading } = useQuery(siteContentQuery);
  const page = data?.content[slug];
  const sections = Object.entries(page?.body ?? {});

  return (
    <PublicLayout>
      <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">{page?.title ?? fallbackTitle}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Last updated by the FINORA compliance team.
        </p>

        {isLoading ? (
          <div className="mt-10 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-4 w-full animate-pulse rounded" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <p className="text-muted-foreground mt-10 text-sm">
            This document is being updated. Please check back soon.
          </p>
        ) : (
          <div className="mt-10 space-y-8">
            {sections.map(([heading, text]) => (
              <section key={heading}>
                <h2 className="text-lg font-semibold">
                  {heading.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed whitespace-pre-line">
                  {String(text)}
                </p>
              </section>
            ))}
          </div>
        )}
      </article>
    </PublicLayout>
  );
}
