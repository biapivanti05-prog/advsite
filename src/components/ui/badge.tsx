import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import type { ReactNode } from "react";

const toneStyles = {
  neutral: "bg-black/5 text-ink-secondary",
  brand: "bg-brand-50 text-brand-600",
  good: "bg-good-bg text-good",
  warning: "bg-warning-bg text-warning",
  serious: "bg-serious-bg text-serious",
  critical: "bg-critical-bg text-critical",
  info: "bg-info-bg text-info",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: keyof typeof toneStyles;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneStyles[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Rótulo de prazo com ícone — nunca só a cor, conforme diretriz de acessibilidade. */
export function DueBadge({ status }: { status: "overdue" | "today" | "soon" | "ok" | "done" }) {
  const config = {
    overdue: { tone: "critical" as const, icon: <XCircle size={13} />, label: "Atrasada" },
    today: { tone: "warning" as const, icon: <Clock size={13} />, label: "Hoje" },
    soon: { tone: "info" as const, icon: <Clock size={13} />, label: "Próxima" },
    ok: { tone: "neutral" as const, icon: <Circle size={13} />, label: "No prazo" },
    done: { tone: "good" as const, icon: <CheckCircle2 size={13} />, label: "Concluída" },
  }[status];

  return (
    <Badge tone={config.tone} icon={config.icon}>
      {config.label}
    </Badge>
  );
}

export function RiskBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }) {
  const config = {
    LOW: { tone: "good" as const, label: "Baixo" },
    MEDIUM: { tone: "warning" as const, label: "Médio" },
    HIGH: { tone: "serious" as const, label: "Alto" },
    CRITICAL: { tone: "critical" as const, label: "Crítico" },
  }[level];
  return (
    <Badge tone={config.tone} icon={<AlertTriangle size={13} />}>
      {config.label}
    </Badge>
  );
}
