import { getCurrentMembership } from "@/server/permissions";
import { getDashboardData } from "@/server/queries/dashboard";
import { getCountdown } from "@/lib/countdown";
import { formatBRL, formatDateLong, formatDate } from "@/lib/utils";
import { TASK_STATUS_LABELS } from "@/lib/labels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BudgetByCategoryChart, TasksByStatusChart } from "@/components/charts/dashboard-charts";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Wallet,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const membership = await getCurrentMembership();
  const data = await getDashboardData(membership.weddingId);
  const countdown = getCountdown(data.wedding.weddingDate);

  const budgetChartData = await getBudgetChartData(membership.weddingId);
  const statusChartData = Object.entries(data.tasksByStatus).map(([status, count]) => ({
    status: TASK_STATUS_LABELS[status] ?? status,
    count,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Cabeçalho / contagem regressiva */}
      <Card className="overflow-hidden border-brand-100 bg-gradient-to-br from-brand-50 to-surface">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-ink-secondary">
              {data.wedding.partner1Name} &amp; {data.wedding.partner2Name} · {formatDateLong(data.wedding.weddingDate)}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
              {countdown.totalDays} dias para o grande dia
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {countdown.months} meses · {countdown.weeks} semanas restantes
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-ink">Progresso do planejamento</span>
              <span className="font-semibold text-brand-600">{data.progressPct}%</span>
            </div>
            <Progress value={data.progressPct} />
            <p className="mt-1 text-xs text-ink-muted">
              {data.doneTasks} de {data.totalTasks} tarefas concluídas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {(data.overdueTasks.length > 0 || data.overduePayments.length > 0 || data.riskAlerts.length > 0) && (
        <Card className="border-critical/20 bg-critical-bg/40">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-critical" />
              <div className="flex-1 text-sm text-ink">
                <p className="font-medium">Atenção necessária</p>
                <ul className="mt-1 space-y-0.5 text-ink-secondary">
                  {data.overdueTasks.length > 0 && (
                    <li>
                      <Link href="/tarefas?filter=overdue" className="hover:underline">
                        {data.overdueTasks.length} tarefa(s) atrasada(s)
                      </Link>
                    </li>
                  )}
                  {data.overduePayments.length > 0 && (
                    <li>
                      <Link href="/financeiro" className="hover:underline">
                        {data.overduePayments.length} pagamento(s) vencido(s)
                      </Link>
                    </li>
                  )}
                  {data.riskAlerts.length > 0 && (
                    <li>{data.riskAlerts.length} risco(s) de nível alto/crítico registrado(s)</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Atrasadas" value={data.overdueTasks.length} tone={data.overdueTasks.length > 0 ? "critical" : "neutral"} icon={<AlertTriangle size={15} />} />
        <StatTile label="Hoje" value={data.todayTasks.length} tone="warning" icon={<CalendarClock size={15} />} />
        <StatTile label="Próx. 7 dias" value={data.next7Count} icon={<CalendarClock size={15} />} />
        <StatTile label="Próx. 30 dias" value={data.next30Count} icon={<CalendarClock size={15} />} />
        <StatTile label="Fornecedores contratados" value={data.vendorsHired} icon={<Building2 size={15} />} />
        <StatTile label="Em negociação" value={data.vendorsNegotiating} icon={<Building2 size={15} />} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Orçamento total" value={formatBRL(data.finance.totalOrcado)} icon={<Wallet size={15} />} />
        <StatTile label="Total contratado" value={formatBRL(data.finance.totalContratado)} icon={<Wallet size={15} />} />
        <StatTile label="Já pago" value={formatBRL(data.finance.totalPago)} tone="good" icon={<CheckCircle2 size={15} />} />
        <StatTile label="Falta pagar" value={formatBRL(data.finance.totalAPagar)} tone={data.finance.totalAPagar > 0 ? "warning" : "good"} icon={<Wallet size={15} />} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Convidados" value={data.guests.total} icon={<Users size={15} />} />
        <StatTile label="Confirmados" value={data.guests.confirmed} tone="good" icon={<Users size={15} />} />
        <StatTile label="Recusados" value={data.guests.declined} icon={<Users size={15} />} />
        <StatTile label="Pendentes" value={data.guests.pending} tone="warning" icon={<Users size={15} />} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Orçado x Contratado por categoria</CardTitle>
              <CardDescription>Top categorias com maior orçamento planejado</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BudgetByCategoryChart data={budgetChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tarefas por status</CardTitle>
              <CardDescription>Distribuição de todas as tarefas do cronograma</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TasksByStatusChart data={statusChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tarefas atrasadas e de hoje</CardTitle>
            <Link href="/tarefas" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
              Ver todas <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...data.overdueTasks, ...data.todayTasks].length === 0 && (
              <p className="py-6 text-center text-sm text-ink-muted">Nenhuma pendência urgente. 🎉</p>
            )}
            {[...data.overdueTasks, ...data.todayTasks].slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                  <p className="text-xs text-ink-muted">{t.category ?? "Geral"}</p>
                </div>
                <Badge tone={t.dueDate && t.dueDate < new Date() ? "critical" : "warning"}>
                  {t.dueDate ? formatDate(t.dueDate) : "—"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos pagamentos</CardTitle>
            <Link href="/financeiro" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
              Ver financeiro <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...data.overduePayments, ...data.upcomingPayments].length === 0 && (
              <p className="py-6 text-center text-sm text-ink-muted">Nenhum pagamento pendente.</p>
            )}
            {[...data.overduePayments, ...data.upcomingPayments].slice(0, 6).map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{i.expense.description}</p>
                  <p className="text-xs text-ink-muted">{formatBRL(i.amount)}</p>
                </div>
                <Badge tone={i.dueDate < new Date() ? "critical" : "info"}>{formatDate(i.dueDate)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {data.pendingDecisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-500" /> Decisões pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.pendingDecisions.map((d) => (
              <Badge key={d.id} tone="brand">
                {d.subject}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function getBudgetChartData(weddingId: string) {
  const { db } = await import("@/server/db");
  const categories = await db.budgetCategory.findMany({
    where: { weddingId, plannedAmount: { gt: 0 } },
    orderBy: { plannedAmount: "desc" },
    take: 8,
    include: { expenses: { select: { finalAmount: true, status: true } } },
  });
  return categories.map((c) => ({
    category: c.name,
    orcado: c.plannedAmount,
    realizado: c.expenses
      .filter((e) => !["ESTIMATED", "CANCELED"].includes(e.status))
      .reduce((sum, e) => sum + e.finalAmount, 0),
  }));
}
