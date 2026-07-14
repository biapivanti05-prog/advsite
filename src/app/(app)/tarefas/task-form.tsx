import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";
import type { Task } from "@prisma/client";

function toDateInput(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function TaskForm({
  task,
  members,
  categories,
  action,
  parentTaskId,
}: {
  task?: Task;
  members: { id: string; name: string }[];
  categories: string[];
  action: (formData: FormData) => void;
  parentTaskId?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {parentTaskId && <input type="hidden" name="parentTaskId" value={parentTaskId} />}

      <Field label="Título">
        <Input name="title" required defaultValue={task?.title} placeholder="Ex: Contratar fotógrafo" />
      </Field>

      <Field label="Descrição">
        <Textarea name="description" defaultValue={task?.description ?? ""} rows={3} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Categoria">
          <Input name="category" defaultValue={task?.category ?? ""} list="categories" placeholder="Ex: Fotografia" />
          <datalist id="categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Field>
        <Field label="Responsável">
          <Select name="assigneeId" defaultValue={task?.assigneeId ?? ""}>
            <option value="">Sem responsável</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          <Select name="status" defaultValue={task?.status ?? "NOT_STARTED"}>
            {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Prioridade">
          <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
            {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Prazo recomendado">
          <Input type="date" name="dueDate" defaultValue={toDateInput(task?.dueDate)} />
        </Field>
        <Field label="Prazo máximo">
          <Input type="date" name="maxDueDate" defaultValue={toDateInput(task?.maxDueDate)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Custo estimado (R$)">
          <Input name="estimatedCost" defaultValue={task?.estimatedCost ?? ""} inputMode="decimal" placeholder="0,00" />
        </Field>
        <Field label="Custo real (R$)">
          <Input name="actualCost" defaultValue={task?.actualCost ?? ""} inputMode="decimal" placeholder="0,00" />
        </Field>
      </div>

      <Field label="Observações">
        <Textarea name="notes" defaultValue={task?.notes ?? ""} rows={2} />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{task ? "Salvar alterações" : "Criar tarefa"}</Button>
        <ButtonLink href={task ? `/tarefas/${task.id}` : "/tarefas"} variant="ghost">Cancelar</ButtonLink>
      </div>
    </form>
  );
}
