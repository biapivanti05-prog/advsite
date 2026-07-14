"use server";

import { db } from "@/server/db";
import { getCurrentMembership, logChange } from "@/server/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addMonths } from "date-fns";
import type { ExpenseStatus, InstallmentStatus } from "@prisma/client";

const expenseSchema = z.object({
  description: z.string().min(1),
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  originalAmount: z.string(),
  discount: z.string().optional(),
  extraCharges: z.string().optional(),
  status: z.string(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  installmentCount: z.string().optional(),
});

function n(v?: string) {
  if (!v) return 0;
  const parsed = Number(v.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function createExpense(formData: FormData) {
  const membership = await getCurrentMembership();
  const parsed = expenseSchema.parse(Object.fromEntries(formData));

  const original = n(parsed.originalAmount);
  const discount = n(parsed.discount);
  const extra = n(parsed.extraCharges);
  const finalAmount = original - discount + extra;
  const dueDate = parsed.dueDate ? new Date(parsed.dueDate + "T12:00:00") : new Date();

  const expense = await db.expense.create({
    data: {
      weddingId: membership.weddingId,
      description: parsed.description,
      categoryId: parsed.categoryId || null,
      vendorId: parsed.vendorId || null,
      originalAmount: original,
      discount,
      extraCharges: extra,
      finalAmount,
      status: parsed.status as ExpenseStatus,
      dueDate,
      notes: parsed.notes || null,
    },
  });

  const installmentCount = Math.max(1, Number(parsed.installmentCount) || 1);
  const perInstallment = Math.round((finalAmount / installmentCount) * 100) / 100;
  for (let i = 0; i < installmentCount; i++) {
    await db.installment.create({
      data: {
        expenseId: expense.id,
        number: i + 1,
        amount: perInstallment,
        dueDate: addMonths(dueDate, i),
        status: "PENDING",
      },
    });
  }

  await logChange({ weddingId: membership.weddingId, userId: membership.userId, entity: "Expense", entityId: expense.id, action: "CREATE", newValue: expense.description });
  revalidatePath("/financeiro");
  redirect(`/financeiro/despesas/${expense.id}`);
}

export async function updateExpenseStatus(expenseId: string, formData: FormData) {
  const membership = await getCurrentMembership();
  const status = String(formData.get("status"));
  await db.expense.update({ where: { id: expenseId }, data: { status: status as ExpenseStatus } });
  await logChange({ weddingId: membership.weddingId, userId: membership.userId, entity: "Expense", entityId: expenseId, action: "UPDATE", field: "status", newValue: status });
  revalidatePath("/financeiro");
  revalidatePath(`/financeiro/despesas/${expenseId}`);
}

export async function deleteExpense(expenseId: string) {
  const membership = await getCurrentMembership();
  await db.expense.delete({ where: { id: expenseId } });
  await logChange({ weddingId: membership.weddingId, userId: membership.userId, entity: "Expense", entityId: expenseId, action: "DELETE" });
  revalidatePath("/financeiro");
  redirect("/financeiro");
}

export async function markInstallmentPaid(installmentId: string, redirectTo: string) {
  const membership = await getCurrentMembership();
  await db.installment.update({
    where: { id: installmentId },
    data: { status: "PAID" as InstallmentStatus, paidDate: new Date() },
  });
  await logChange({ weddingId: membership.weddingId, userId: membership.userId, entity: "Installment", entityId: installmentId, action: "UPDATE", field: "status", newValue: "PAID" });
  revalidatePath("/financeiro");
  revalidatePath(redirectTo);
}

export async function updateBudgetCategory(categoryId: string, formData: FormData) {
  const membership = await getCurrentMembership();
  const plannedAmount = n(String(formData.get("plannedAmount") ?? ""));
  await db.budgetCategory.update({ where: { id: categoryId }, data: { plannedAmount } });
  await logChange({ weddingId: membership.weddingId, userId: membership.userId, entity: "BudgetCategory", entityId: categoryId, action: "UPDATE", field: "plannedAmount", newValue: String(plannedAmount) });
  revalidatePath("/financeiro");
}
