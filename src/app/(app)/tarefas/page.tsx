import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, DueBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";
import { Plus, LayoutGrid, List as ListIcon } from "lucide-react";
import Link from "next/link";
import type { Prisma, TaskStatus, TaskPriority } from "@prisma/client";
import { KanbanBoard } from "./kanban-board";

const STATUS_ORDER: TaskStatus[] = [
  "NOT_STARTED", "RESEARCHING", "AWAITING_DECISION", "AWAITING_QUOTE", "NEGOTIATING",
  "AWAITING_THIRD_PARTY", "HIRED", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELED",
];

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

const PAGE_SIZE = 30;

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; priority?: string; category?: string; q?: string; filter?: string; page?: string }>;
}) {
  const membership = await getCurrentMembership();
  const params = await searchParams;
  const view = params.view === "kanban" ? "kanban" : "list";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.TaskWhereInput = { weddingId: membership.weddingId };
  if (params.status) where.status = params.status as TaskStatus;
  if (params.priority) where.priority = params.priority as TaskPriority;
  if (params.category) where.category = params.category;
  if (params.q) where.title = { contains: params.q };
  if (params.filter === "overdue") {
    where.dueDate = { lt: new Date() };
    where.status = { notIn: ["DONE", "CANCELED"] };
  }
  if (!params.status && params.filter !== "all" && params.filter !== "overdue") {
    where.status = { notIn: ["CANCELED"] };
  }

  const [tasks, totalCount, categories] = await Promise.all([
    db.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }],
      include: { assignee: { select: { name: true } } },
      take: view === "kanban" ? 600 : PAGE_SIZE,
      skip: view === "kanban" ? 0 : (page - 1) * PAGE_SIZE,
    }),
    db.task.count({ where }),
    db.task.findMany({
      where: { weddingId: membership.weddingId, category: { not: null } },
      distinct: ["category"],
      select: { category: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const baseQuery = new URLSearchParams();
  if (params.status) baseQuery.set("status", params.status);
  if (params.priority) baseQuery.set("priority", params.priority);
  if (params.category) baseQuery.set("category", params.category);
  if (params.q) baseQuery.set("q", params.q);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Tarefas</h1>
          <p className="text-sm text-ink-muted">{totalCount} tarefa(s) encontrada(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border-strong p-0.5">
            <Link
              href={`/tarefas?${new URLSearchParams({ ...Object.fromEntries(baseQuery), view: "list" })}`}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${view === "list" ? "bg-brand-50 text-brand-700" : "text-ink-secondary"}`}
            >
              <ListIcon size={15} /> Lista
            </Link>
            <Link
              href={`/tarefas?${new URLSearchParams({ ...Object.fromEntries(baseQuery), view: "kanban" })}`}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${view === "kanban" ? "bg-brand-50 text-brand-700" : "text-ink-secondary"}`}
            >
              <LayoutGrid size={15} /> Kanban
            </Link>
          </div>
          <ButtonLink href="/tarefas/nova" size="md">
            <Plus size={16} /> Nova tarefa
          </ButtonLink>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <input type="hidden" name="view" value={view} />
            <div className="min-w-[180px] flex-1">
              <Input name="q" placeholder="Buscar por título…" defaultValue={params.q} />
            </div>
            <Select name="status" defaultValue={params.status ?? ""} className="w-auto">
              <option value="">Todos os status</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
              ))}
            </Select>
            <Select name="priority" defaultValue={params.priority ?? ""} className="w-auto">
              <option value="">Todas as prioridades</option>
              {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
            <Select name="category" defaultValue={params.category ?? ""} className="w-auto">
              <option value="">Todas as categorias</option>
              {categories.map((c) => c.category && (
                <option key={c.category} value={c.category}>{c.category}</option>
              ))}
            </Select>
            <button type="submit" className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-ink hover:bg-brand-50">
              Filtrar
            </button>
          </form>
        </CardContent>
      </Card>

      {view === "kanban" ? (
        <KanbanBoard tasks={tasks} />
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {tasks.length === 0 && <p className="p-8 text-center text-sm text-ink-muted">Nenhuma tarefa encontrada.</p>}
            {tasks.map((t) => (
              <Link
                key={t.id}
                href={`/tarefas/${t.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-brand-50/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                  <p className="text-xs text-ink-muted">
                    {t.category ?? "Sem categoria"} {t.assignee?.name && `· ${t.assignee.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                  <Badge tone="brand">{TASK_STATUS_LABELS[t.status]}</Badge>
                  <DueBadge status={dueStatus(t.dueDate, t.status)} />
                  <span className="hidden w-20 text-right text-xs text-ink-muted sm:inline">{formatDate(t.dueDate)}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {view === "list" && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Link
            href={`/tarefas?${new URLSearchParams({ ...Object.fromEntries(baseQuery), view, page: String(page - 1) })}`}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-border-strong px-3 py-1.5 text-sm ${page <= 1 ? "pointer-events-none opacity-40" : "text-ink hover:bg-brand-50"}`}
          >
            Anterior
          </Link>
          <span className="text-sm text-ink-muted">Página {page} de {totalPages}</span>
          <Link
            href={`/tarefas?${new URLSearchParams({ ...Object.fromEntries(baseQuery), view, page: String(page + 1) })}`}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-border-strong px-3 py-1.5 text-sm ${page >= totalPages ? "pointer-events-none opacity-40" : "text-ink hover:bg-brand-50"}`}
          >
            Próxima
          </Link>
        </div>
      )}
    </div>
  );
}
