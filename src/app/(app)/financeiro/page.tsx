import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EXPENSE_STATUS_LABELS } from "@/lib/labels";
import { formatBRL, formatDate } from "@/lib/utils";
import { Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { markInstallmentPaid } from "@/server/actions/finance";

export default async function FinanceiroPage() {
  const membership = await getCurrentMembership();
  const weddingId = membership.weddingId;

  const [categories, expenses, installments, fundingSources] = await Promise.all([
    db.budgetCategory.findMany({
      where: { weddingId },
      orderBy: { plannedAmount: "desc" },
      include: { expenses: { select: { finalAmount: true, status: true } } },
    }),
    db.expense.findMany({ where: { weddingId }, orderBy: { createdAt: "desc" }, include: { vendor: true, category: true } }),
    db.installment.findMany({
      where: { expense: { weddingId } },
      orderBy: { dueDate: "asc" },
      include: { expense: { select: { description: true } } },
    }),
    db.fundingSource.findMany({ where: { weddingId } }),
  ]);

  const totalOrcado = categories.reduce((s, c) => s + c.plannedAmount, 0);
  const totalContratado = expenses.filter((e) => !["ESTIMATED", "CANCELED"].includes(e.status)).reduce((s, e) => s + e.finalAmount, 0);
  const totalPago = installments.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const totalAPagar = totalContratado - totalPago;
  const totalRecebidoFontes = fundingSources.reduce((s, f) => s + f.receivedAmount, 0);
  const saldoDisponivel = totalRecebidoFontes - totalPago;

  const pendingInstallments = installments.filter((i) => i.status === "PENDING").slice(0, 10);
  const now = new Date();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Financeiro</h1>
          <p className="text-sm text-ink-muted">Orçamento, despesas e pagamentos</p>
        </div>
        <ButtonLink href="/financeiro/despesas/nova"><Plus size={16} /> Nova despesa</ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Orçado" value={formatBRL(totalOrcado)} icon={<Wallet size={15} />} />
        <StatTile label="Contratado" value={formatBRL(totalContratado)} />
        <StatTile label="Pago" value={formatBRL(totalPago)} tone="good" />
        <StatTile label="A pagar" value={formatBRL(totalAPagar)} tone={totalAPagar > 0 ? "warning" : "good"} />
        <StatTile label="Saldo disponível" value={formatBRL(saldoDisponivel)} tone={saldoDisponivel >= 0 ? "good" : "critical"} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Orçamento por categoria</CardTitle>
            <CardDescription>Planejado x contratado — categorias com maior orçamento primeiro</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.filter((c) => c.plannedAmount > 0).slice(0, 12).map((c) => {
            const spent = c.expenses.filter((e) => !["ESTIMATED", "CANCELED"].includes(e.status)).reduce((s, e) => s + e.finalAmount, 0);
            const pct = c.plannedAmount > 0 ? Math.round((spent / c.plannedAmount) * 100) : 0;
            return (
              <div key={c.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{c.name}</span>
                  <span className="text-ink-muted">{formatBRL(spent)} / {formatBRL(c.plannedAmount)}</span>
                </div>
                <Progress value={pct} tone={pct > 100 ? "critical" : pct > 85 ? "warning" : "brand"} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Despesas</CardTitle></CardHeader>
          <div className="divide-y divide-border">
            {expenses.length === 0 && <p className="p-6 text-center text-sm text-ink-muted">Nenhuma despesa cadastrada.</p>}
            {expenses.map((e) => (
              <Link key={e.id} href={`/financeiro/despesas/${e.id}`} className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-brand-50/40">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{e.description}</p>
                  <p className="text-xs text-ink-muted">{e.category?.name ?? "Sem categoria"} {e.vendor && `· ${e.vendor.companyName}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">{formatBRL(e.finalAmount)}</p>
                  <Badge tone={e.status === "PAID" ? "good" : e.status === "OVERDUE" ? "critical" : "neutral"}>{EXPENSE_STATUS_LABELS[e.status]}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Próximos pagamentos</CardTitle></CardHeader>
          <div className="divide-y divide-border">
            {pendingInstallments.length === 0 && <p className="p-6 text-center text-sm text-ink-muted">Nenhum pagamento pendente.</p>}
            {pendingInstallments.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{i.expense.description}</p>
                  <p className="text-xs text-ink-muted">Parcela {i.number} · {formatDate(i.dueDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={i.dueDate < now ? "critical" : "info"}>{formatBRL(i.amount)}</Badge>
                  <form action={markInstallmentPaid.bind(null, i.id, "/financeiro")}>
                    <Button type="submit" size="sm" variant="secondary">Pagar</Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Fontes de recursos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {fundingSources.map((f) => (
            <div key={f.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-ink">{f.sourceName}</p>
              <p className="text-xs text-ink-muted">{formatBRL(f.receivedAmount)} recebido de {formatBRL(f.expectedAmount)}</p>
              <Progress value={f.expectedAmount > 0 ? (f.receivedAmount / f.expectedAmount) * 100 : 0} className="mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
