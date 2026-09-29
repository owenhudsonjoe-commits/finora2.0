import { cn } from "@/lib/utils";

export function FinoraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} role="img" aria-label="FINORA">
      <defs>
        <linearGradient id="finora-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.63 0.135 162)" />
          <stop offset="100%" stopColor="oklch(0.72 0.12 186)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="10" fill="currentColor" />
      <path d="M13 28V12h14v4.4H17.9v3.3h7.6v4.3h-7.6V28z" fill="url(#finora-mark)" />
      <rect
        x="25.4"
        y="24.2"
        width="3.6"
        height="3.8"
        rx="1"
        fill="url(#finora-mark)"
        opacity="0.65"
      />
    </svg>
  );
}

export function FinoraLogo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <FinoraMark className={cn("text-primary", markClassName)} />
      <span className={cn("text-[1.05rem] font-bold tracking-[0.18em] uppercase", wordClassName)}>
        Finora
      </span>
    </span>
  );
}
