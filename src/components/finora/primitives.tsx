import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { titleCase } from "@/lib/format";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <p className="text-accent mb-3 text-xs font-semibold tracking-[0.22em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-semibold text-balance sm:text-3xl">{title}</h2>
      {description ? (
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "accent" | "primary";
}) {
  return (
    <div
      className={cn(
        "surface-card p-5 transition-shadow hover:shadow-[var(--shadow-lift)]",
        tone === "primary" && "bg-primary text-primary-foreground border-transparent",
        tone === "accent" && "border-accent/30 bg-accent/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-muted-foreground text-xs font-medium tracking-wide uppercase",
            tone === "primary" && "text-primary-foreground/70",
          )}
        >
          {label}
        </p>
        {icon ? (
          <span className={cn("text-accent", tone === "primary" && "text-primary-foreground/80")}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="num mt-3 text-2xl font-semibold">{value}</p>
      {hint ? (
        <p
          className={cn(
            "text-muted-foreground mt-1 text-xs",
            tone === "primary" && "text-primary-foreground/70",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const TONES: Record<string, string> = {
  completed: "bg-success/12 text-success border-success/25",
  approved: "bg-success/12 text-success border-success/25",
  active: "bg-success/12 text-success border-success/25",
  paid: "bg-success/12 text-success border-success/25",
  resolved: "bg-success/12 text-success border-success/25",
  pending: "bg-warning/15 text-warning-foreground border-warning/35",
  pending_verification: "bg-warning/15 text-warning-foreground border-warning/35",
  processing: "bg-warning/15 text-warning-foreground border-warning/35",
  under_review: "bg-warning/15 text-warning-foreground border-warning/35",
  submitted: "bg-warning/15 text-warning-foreground border-warning/35",
  in_progress: "bg-warning/15 text-warning-foreground border-warning/35",
  waiting_user: "bg-warning/15 text-warning-foreground border-warning/35",
  open: "bg-accent/12 text-accent border-accent/25",
  rejected: "bg-destructive/10 text-destructive border-destructive/25",
  cancelled: "bg-destructive/10 text-destructive border-destructive/25",
  suspended: "bg-destructive/10 text-destructive border-destructive/25",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {titleCase(status)}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border/70 flex flex-col items-center rounded-lg border border-dashed px-6 py-14 text-center">
      {icon ? <div className="text-muted-foreground/60 mb-3">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
