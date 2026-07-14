import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";
import { formatBRL, formatDate } from "@/lib/utils";
import { addChecklistItem, deleteChecklistItem, deleteTask, toggleChecklistItem, addComment } from "@/server/actions/tasks";
import { CheckSquare, Square, Trash2, Plus, Pencil } from "lucide-react";
import Link from "next/link";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership();
  const { id } = await params;

  const task = await db.task.findFirst({
    where: { id, weddingId: membership.weddingId },
    include: {
      assignee: true,
      createdBy: true,
      checklistItems: { orderBy: { order: "asc" } },
      comments: { orderBy: { createdAt: "asc" }, include: { user: true } },
      subtasks: true,
      parent: true,
      vendor: true,
    },
  });
  if (!task) notFound();

  const checklistDone = task.checklistItems.filter((c) => c.done).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {task.parent && (
        <Link href={`/tarefas/${task.parent.id}`} className="text-sm text-brand-600 hover:underline">
          ← {task.parent.title}
        </Link>
      )}

      <Card>
        <CardHeader>
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge tone="brand">{TASK_STATUS_LABELS[task.status]}</Badge>
              <Badge tone="neutral">{TASK_PRIORITY_LABELS[task.priority]}</Badge>
              {task.category && <Badge tone="neutral">{task.category}</Badge>}
            </div>
            <CardTitle className="text-xl">{task.title}</CardTitle>
            {task.description && <p className="mt-2 text-sm text-ink-secondary">{task.description}</p>}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <ButtonLink href={`/tarefas/${task.id}/editar`} variant="secondary" size="sm"><Pencil size={14} /></ButtonLink>
            <form action={deleteTask.bind(null, task.id)}>
              <Button variant="danger" size="sm" type="submit"><Trash2 size={14} /></Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-ink-muted">Responsável</dt><dd className="text-ink">{task.assignee?.name ?? "—"}</dd></div>
            <div><dt className="text-ink-muted">Prazo recomendado</dt><dd className="text-ink">{formatDate(task.dueDate)}</dd></div>
            <div><dt className="text-ink-muted">Prazo máximo</dt><dd className="text-ink">{formatDate(task.maxDueDate)}</dd></div>
            <div><dt className="text-ink-muted">Custo estimado</dt><dd className="text-ink">{formatBRL(task.estimatedCost)}</dd></div>
            <div><dt className="text-ink-muted">Custo real</dt><dd className="text-ink">{formatBRL(task.actualCost)}</dd></div>
            <div><dt className="text-ink-muted">Fornecedor</dt><dd className="text-ink">{task.vendor?.companyName ?? "—"}</dd></div>
          </dl>
          {task.notes && (
            <div className="mt-4 rounded-lg bg-black/[0.03] p-3 text-sm text-ink-secondary">{task.notes}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist {task.checklistItems.length > 0 && `(${checklistDone}/${task.checklistItems.length})`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {task.checklistItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <form action={toggleChecklistItem.bind(null, task.id, item.id, !item.done)}>
                <button type="submit" className="text-ink-secondary hover:text-brand-600">
                  {item.done ? <CheckSquare size={17} className="text-good" /> : <Square size={17} />}
                </button>
              </form>
              <span className={`flex-1 text-sm ${item.done ? "text-ink-muted line-through" : "text-ink"}`}>{item.label}</span>
              <form action={deleteChecklistItem.bind(null, task.id, item.id)}>
                <button type="submit" className="text-ink-muted hover:text-critical"><Trash2 size={14} /></button>
              </form>
            </div>
          ))}
          <form action={addChecklistItem.bind(null, task.id)} className="flex gap-2 pt-2">
            <Input name="label" placeholder="Adicionar item…" required />
            <Button type="submit" size="sm" variant="secondary"><Plus size={15} /></Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subtarefas ({task.subtasks.length})</CardTitle>
          <ButtonLink href={`/tarefas/nova?parentTaskId=${task.id}`} size="sm" variant="secondary">
            <Plus size={14} /> Subtarefa
          </ButtonLink>
        </CardHeader>
        <CardContent className="space-y-2">
          {task.subtasks.length === 0 && <p className="text-sm text-ink-muted">Nenhuma subtarefa.</p>}
          {task.subtasks.map((s) => (
            <Link key={s.id} href={`/tarefas/${s.id}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-brand-50/40">
              <span className="text-sm text-ink">{s.title}</span>
              <Badge tone="neutral">{TASK_STATUS_LABELS[s.status]}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Comentários</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {task.comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-black/[0.03] p-3">
              <p className="text-sm text-ink">{c.body}</p>
              <p className="mt-1 text-xs text-ink-muted">{c.user?.name} · {formatDate(c.createdAt)}</p>
            </div>
          ))}
          <form action={addComment.bind(null, task.id)} className="flex gap-2">
            <Input name="body" placeholder="Escrever um comentário…" required />
            <Button type="submit" size="sm" variant="secondary">Enviar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
