"use client";

import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { quickUpdateStatus } from "@/server/actions/tasks";
import Link from "next/link";
import type { Task, TaskStatus } from "@prisma/client";

const COLUMNS: TaskStatus[] = [
  "NOT_STARTED", "RESEARCHING", "AWAITING_QUOTE", "NEGOTIATING", "HIRED", "IN_PROGRESS", "BLOCKED", "DONE",
];

type TaskWithAssignee = Task & { assignee: { name: string } | null };

export function KanbanBoard({ tasks }: { tasks: TaskWithAssignee[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div key={col} className="w-72 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-ink">{TASK_STATUS_LABELS[col]}</h3>
              <span className="text-xs text-ink-muted">{colTasks.length}</span>
            </div>
            <div className="max-h-[calc(100vh-260px)] min-h-24 space-y-2 overflow-y-auto rounded-xl bg-black/[0.02] p-2 scrollbar-thin">
              {colTasks.map((t) => (
                <div key={t.id} className="rounded-lg border border-border bg-surface-raised p-3 shadow-sm">
                  <Link href={`/tarefas/${t.id}`} className="text-sm font-medium text-ink hover:text-brand-600">
                    {t.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-muted">{t.category ?? "Sem categoria"}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-ink-muted">{formatDate(t.dueDate)}</span>
                    <span className="text-[11px] font-medium text-brand-600">{TASK_PRIORITY_LABELS[t.priority]}</span>
                  </div>
                  <form action={quickUpdateStatus.bind(null, t.id)} className="mt-2">
                    <select
                      name="status"
                      defaultValue={t.status}
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      className="w-full rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-ink"
                    >
                      {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </form>
                </div>
              ))}
              {colTasks.length === 0 && <p className="px-2 py-4 text-center text-xs text-ink-muted">Vazio</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
