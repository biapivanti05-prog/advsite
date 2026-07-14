import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { EXPENSE_STATUS_LABELS, INSTALLMENT_STATUS_LABELS } from "@/lib/labels";
import { formatBRL, formatDate } from "@/lib/utils";
import { deleteExpense, markInstallmentPaid, updateExpenseStatus } from "@/server/actions/finance";
import { Trash2 } from "lucide-react";

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership();
  const { id } = await params;

  const expense = await db.expense.findFirst({
    where: { id, weddingId: membership.weddingId },
    include: { category: true, vendor: true, installments: { orderBy: { number: "asc" } } },
  });
  if (!expense) notFound();

  const paid = expense.installments.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card>
        <CardHeader>
          <div>
            <Badge tone="brand">{EXPENSE_STATUS_LABELS[expense.status]}</Badge>
            <CardTitle className="mt-2 text-xl">{expense.description}</CardTitle>
            <p className="text-sm text-ink-muted">{expense.category?.name ?? "Sem categoria"} {expense.vendor && `· ${expense.vendor.companyName}`}</p>
          </div>
          <form action={deleteExpense.bind(null, expense.id)}>
            <Button variant="danger" size="sm" type="submit"><Trash2 size={14} /></Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-ink-muted">Valor original</dt><dd className="text-ink">{formatBRL(expense.originalAmount)}</dd></div>
            <div><dt className="text-ink-muted">Desconto</dt><dd className="text-ink">{formatBRL(expense.discount)}</dd></div>
            <div><dt className="text-ink-muted">Valor final</dt><dd className="font-medium text-ink">{formatBRL(expense.finalAmount)}</dd></div>
            <div><dt className="text-ink-muted">Pago</dt><dd className="text-good">{formatBRL(paid)}</dd></div>
          </dl>

          <form action={updateExpenseStatus.bind(null, expense.id)} className="flex items-center gap-2">
            <Select name="status" defaultValue={expense.status} className="w-auto">
              {Object.entries(EXPENSE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Button type="submit" size="sm" variant="secondary">Atualizar status</Button>
          </form>

          {expense.notes && <p className="text-sm text-ink-secondary">{expense.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Parcelas</CardTitle></CardHeader>
        <div className="divide-y divide-border">
          {expense.installments.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2 px-5 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Parcela {i.number} — {formatBRL(i.amount)}</p>
                <p className="text-xs text-ink-muted">Vencimento {formatDate(i.dueDate)} {i.paidDate && `· Pago em ${formatDate(i.paidDate)}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={i.status === "PAID" ? "good" : i.dueDate < new Date() ? "critical" : "neutral"}>
                  {INSTALLMENT_STATUS_LABELS[i.status]}
                </Badge>
                {i.status !== "PAID" && (
                  <form action={markInstallmentPaid.bind(null, i.id, `/financeiro/despesas/${expense.id}`)}>
                    <Button type="submit" size="sm" variant="secondary">Marcar como pago</Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
