"use server";

import { db } from "@/server/db";
import { getCurrentMembership, logChange } from "@/server/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { TaskPriority, TaskStatus } from "@prisma/client";

const taskSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.string().optional(),
  maxDueDate: z.string().optional(),
  estimatedCost: z.string().optional(),
  actualCost: z.string().optional(),
  notes: z.string().optional(),
  assigneeId: z.string().optional(),
  parentTaskId: z.string().optional(),
});

function parseMoney(v?: string) {
  if (!v) return undefined;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function parseDate(v?: string) {
  if (!v) return undefined;
  const d = new Date(v + "T12:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function createTask(formData: FormData) {
  const membership = await getCurrentMembership();
  const parsed = taskSchema.parse(Object.fromEntries(formData));

  const task = await db.task.create({
    data: {
      weddingId: membership.weddingId,
      title: parsed.title,
      description: parsed.description || null,
      category: parsed.category || null,
      status: parsed.status as TaskStatus,
      priority: parsed.priority as TaskPriority,
      dueDate: parseDate(parsed.dueDate),
      maxDueDate: parseDate(parsed.maxDueDate),
      estimatedCost: parseMoney(parsed.estimatedCost),
      actualCost: parseMoney(parsed.actualCost),
      notes: parsed.notes || null,
      assigneeId: parsed.assigneeId || null,
      parentTaskId: parsed.parentTaskId || null,
      createdById: membership.userId,
    },
  });

  await logChange({
    weddingId: membership.weddingId,
    userId: membership.userId,
    entity: "Task",
    entityId: task.id,
    action: "CREATE",
    newValue: task.title,
  });

  revalidatePath("/tarefas");
  if (parsed.parentTaskId) {
    redirect(`/tarefas/${parsed.parentTaskId}`);
  }
  redirect(`/tarefas/${task.id}`);
}

export async function updateTask(taskId: string, formData: FormData) {
  const membership = await getCurrentMembership();
  const parsed = taskSchema.parse(Object.fromEntries(formData));
  const before = await db.task.findUniqueOrThrow({ where: { id: taskId } });

  await db.task.update({
    where: { id: taskId },
    data: {
      title: parsed.title,
      description: parsed.description || null,
      category: parsed.category || null,
      status: parsed.status as TaskStatus,
      priority: parsed.priority as TaskPriority,
      dueDate: parseDate(parsed.dueDate),
      maxDueDate: parseDate(parsed.maxDueDate),
      estimatedCost: parseMoney(parsed.estimatedCost),
      actualCost: parseMoney(parsed.actualCost),
      notes: parsed.notes || null,
      assigneeId: parsed.assigneeId || null,
      progressPct: parsed.status === "DONE" ? 100 : undefined,
    },
  });

  await logChange({
    weddingId: membership.weddingId,
    userId: membership.userId,
    entity: "Task",
    entityId: taskId,
    action: "UPDATE",
    field: "status",
    oldValue: before.status,
    newValue: parsed.status,
  });

  revalidatePath("/tarefas");
  revalidatePath(`/tarefas/${taskId}`);
  redirect(`/tarefas/${taskId}`);
}

export async function quickUpdateStatus(taskId: string, formData: FormData) {
  const membership = await getCurrentMembership();
  const status = String(formData.get("status"));
  const before = await db.task.findUniqueOrThrow({ where: { id: taskId } });

  await db.task.update({
    where: { id: taskId },
    data: { status: status as TaskStatus, progressPct: status === "DONE" ? 100 : before.progressPct },
  });

  await logChange({
    weddingId: membership.weddingId,
    userId: membership.userId,
    entity: "Task",
    entityId: taskId,
    action: "UPDATE",
    field: "status",
    oldValue: before.status,
    newValue: status,
  });

  revalidatePath("/tarefas");
}

export async function deleteTask(taskId: string) {
  const membership = await getCurrentMembership();
  await db.task.delete({ where: { id: taskId } });
  await logChange({
    weddingId: membership.weddingId,
    userId: membership.userId,
    entity: "Task",
    entityId: taskId,
    action: "DELETE",
  });
  revalidatePath("/tarefas");
  redirect("/tarefas");
}

export async function addChecklistItem(taskId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  await db.checklistItem.create({ data: { taskId, label } });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function toggleChecklistItem(taskId: string, itemId: string, done: boolean) {
  await db.checklistItem.update({ where: { id: itemId }, data: { done } });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function deleteChecklistItem(taskId: string, itemId: string) {
  await db.checklistItem.delete({ where: { id: itemId } });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function addComment(taskId: string, formData: FormData) {
  const membership = await getCurrentMembership();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await db.comment.create({ data: { taskId, userId: membership.userId, body } });
  revalidatePath(`/tarefas/${taskId}`);
}
