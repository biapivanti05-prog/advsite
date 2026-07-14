import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  tone = "brand",
}: {
  value: number;
  className?: string;
  tone?: "brand" | "good" | "warning" | "critical";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const toneClass = {
    brand: "bg-brand-500",
    good: "bg-good",
    warning: "bg-warning",
    critical: "bg-critical",
  }[tone];

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-black/[0.06]", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", toneClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
