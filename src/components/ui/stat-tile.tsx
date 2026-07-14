import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "good" | "warning" | "critical" | "brand";
}) {
  const toneClass = {
    neutral: "text-ink",
    good: "text-good",
    warning: "text-warning",
    critical: "text-critical",
    brand: "text-brand-600",
  }[tone];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        {icon && <span className="text-ink-muted">{icon}</span>}
      </div>
      <div className={cn("mt-2 font-display text-2xl font-semibold tabular-nums", toneClass)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}
