import { db } from "@/server/db";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function getDashboardData(weddingId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [wedding, allTasks, guests, expenses, installments, vendors, decisions, risks, budgetCategories] =
    await Promise.all([
      db.wedding.findUniqueOrThrow({ where: { id: weddingId } }),
      db.task.findMany({ where: { weddingId }, select: { id: true, status: true, dueDate: true, category: true, priority: true, title: true, assignee: { select: { name: true } } } }),
      db.guest.findMany({ where: { weddingId }, select: { id: true, rsvpStatus: true, isChild: true, plusOneAllowed: true, confirmedCount: true } }),
      db.expense.findMany({ where: { weddingId }, select: { id: true, finalAmount: true, status: true, description: true } }),
      db.installment.findMany({
        where: { expense: { weddingId } },
        select: { id: true, amount: true, dueDate: true, status: true, expense: { select: { description: true } } },
      }),
      db.vendor.findMany({ where: { weddingId }, select: { id: true, status: true } }),
      db.decision.findMany({ where: { weddingId, status: { notIn: ["DECIDED", "CANCELED"] } }, select: { id: true, subject: true, deadline: true } }),
      db.risk.findMany({ where: { weddingId }, select: { id: true, level: true, description: true } }),
      db.budgetCategory.findMany({ where: { weddingId }, select: { plannedAmount: true } }),
    ]);

  const doneStatuses = new Set(["DONE", "CANCELED"]);
  const activeTasks = allTasks.filter((t) => !doneStatuses.has(t.status));

  const overdueTasks = activeTasks.filter((t) => t.dueDate && t.dueDate < todayStart);
  const todayTasks = activeTasks.filter((t) => t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd);
  const next7 = activeTasks.filter((t) => t.dueDate && t.dueDate > todayEnd && t.dueDate <= addDays(todayEnd, 7));
  const next15 = activeTasks.filter((t) => t.dueDate && t.dueDate > todayEnd && t.dueDate <= addDays(todayEnd, 15));
  const next30 = activeTasks.filter((t) => t.dueDate && t.dueDate > todayEnd && t.dueDate <= addDays(todayEnd, 30));

  const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
  const progressPct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const tasksByStatus: Record<string, number> = {};
  for (const t of allTasks) tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1;

  const tasksByCategory = new Map<string, { total: number; done: number }>();
  for (const t of allTasks) {
    const cat = t.category ?? "Sem categoria";
    const entry = tasksByCategory.get(cat) ?? { total: 0, done: 0 };
    entry.total++;
    if (t.status === "DONE") entry.done++;
    tasksByCategory.set(cat, entry);
  }

  // Financeiro
  const totalOrcado = budgetCategories.reduce((sum, c) => sum + c.plannedAmount, 0);
  const totalContratado = expenses
    .filter((e) => !["ESTIMATED", "CANCELED"].includes(e.status))
    .reduce((sum, e) => sum + e.finalAmount, 0);
  const totalPago = installments.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
  const totalAPagar = totalContratado - totalPago;

  const pendingInstallments = installments.filter((i) => i.status === "PENDING");
  const overduePayments = pendingInstallments.filter((i) => i.dueDate < todayStart);
  const upcomingPayments = pendingInstallments
    .filter((i) => i.dueDate >= todayStart)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 6);

  // Convidados
  const totalGuests = guests.length;
  const confirmed = guests.filter((g) => g.rsvpStatus === "CONFIRMED" || g.rsvpStatus === "CONFIRMED_WITH_PLUS_ONE").length;
  const declined = guests.filter((g) => g.rsvpStatus === "DECLINED").length;
  const pending = totalGuests - confirmed - declined;
  const adults = guests.filter((g) => !g.isChild).length;
  const children = guests.filter((g) => g.isChild).length;

  const vendorsHired = vendors.filter((v) => v.status === "HIRED").length;
  const vendorsNegotiating = vendors.filter((v) =>
    ["NEGOTIATING", "COMPARING", "QUOTE_RECEIVED"].includes(v.status),
  ).length;

  const riskAlerts = risks.filter((r) => r.level === "HIGH" || r.level === "CRITICAL");

  return {
    wedding,
    progressPct,
    totalTasks: allTasks.length,
    doneTasks,
    overdueTasks,
    todayTasks,
    next7Count: next7.length,
    next15Count: next15.length,
    next30Count: next30.length,
    tasksByStatus,
    tasksByCategory: Array.from(tasksByCategory.entries()).map(([category, v]) => ({ category, ...v })),
    finance: { totalOrcado, totalContratado, totalPago, totalAPagar },
    overduePayments,
    upcomingPayments,
    guests: { total: totalGuests, confirmed, declined, pending, adults, children },
    vendorsHired,
    vendorsNegotiating,
    pendingDecisions: decisions,
    riskAlerts,
  };
}
