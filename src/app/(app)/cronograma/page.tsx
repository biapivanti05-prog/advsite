import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge, DueBadge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";
import { formatDate, formatDateLong } from "@/lib/utils";
import Link from "next/link";
import { CalendarRange } from "lucide-react";

function dueStatus(dueDate: Date | null, status: string): "overdue" | "today" | "soon" | "ok" | "done" {
  if (status === "DONE") return "done";
  if (!dueDate) return "ok";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(startToday.getTime() + 86400000 - 1);
  if (dueDate < startToday) return "overdue";
  if (dueDate <= endToday) return "today";
  if (dueDate.getTime() - endToday.getTime() <= 7 * 86400000) return "soon";
  return "ok";
}

export default async function CronogramaPage() {
  const membership = await getCurrentMembership();

  const phases = await db.timelinePhase.findMany({
    where: { weddingId: membership.weddingId },
    orderBy: { order: "asc" },
    include: {
      tasks: {
        orderBy: { dueDate: "asc" },
        select: { id: true, title: true, status: true, priority: true, dueDate: true },
      },
    },
  });

  const wedding = membership.wedding;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Cronograma regressivo</h1>
          <p className="text-sm text-ink-muted">
            {formatDateLong(wedding.planningStart)} → {formatDateLong(wedding.weddingDate)}
          </p>
        </div>
        <CalendarRange size={22} className="text-brand-500" />
      </div>

      <div className="space-y-3">
        {phases.map((phase) => {
          const total = phase.tasks.length;
          const done = phase.tasks.filter((t) => t.status === "DONE").length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <details key={phase.id} className="group rounded-2xl border border-border bg-surface" open={pct < 100 && phase.order <= 2}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold text-ink">{phase.name}</p>
                  <p className="text-xs text-ink-muted">{done}/{total} tarefas concluídas</p>
                </div>
                <div className="hidden w-40 sm:block">
                  <Progress value={pct} tone={pct === 100 ? "good" : "brand"} />
                </div>
                <Badge tone={pct === 100 ? "good" : "neutral"}>{pct}%</Badge>
              </summary>
              <div className="divide-y divide-border border-t border-border">
                {phase.tasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tarefas/${t.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm hover:bg-brand-50/40"
                  >
                    <span className={t.status === "DONE" ? "text-ink-muted line-through" : "text-ink"}>{t.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="hidden text-xs text-ink-muted sm:inline">{TASK_PRIORITY_LABELS[t.priority]}</span>
                      <DueBadge status={dueStatus(t.dueDate, t.status)} />
                      <span className="w-20 text-right text-xs text-ink-muted">{formatDate(t.dueDate)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
