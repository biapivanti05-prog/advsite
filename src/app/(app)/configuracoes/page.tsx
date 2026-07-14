import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { updateWeddingConfig } from "@/server/actions/wedding";

export default async function ConfiguracoesPage() {
  const membership = await getCurrentMembership();
  const wedding = membership.wedding;

  const members = await db.membership.findMany({
    where: { weddingId: membership.weddingId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const recentChanges = await db.changeLog.findMany({
    where: { weddingId: membership.weddingId },
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { user: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted">Dados do casamento, colaboradores e histórico de alterações</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Dados do casamento</CardTitle>
            <CardDescription>
              Planejamento iniciado em {formatDate(wedding.planningStart)} · Casamento em {formatDate(wedding.weddingDate)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={updateWeddingConfig} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome do(a) parceiro(a) 1">
                <Input name="partner1Name" defaultValue={wedding.partner1Name} disabled={membership.role !== "OWNER"} />
              </Field>
              <Field label="Nome do(a) parceiro(a) 2">
                <Input name="partner2Name" defaultValue={wedding.partner2Name} disabled={membership.role !== "OWNER"} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade"><Input name="city" defaultValue={wedding.city ?? ""} disabled={membership.role !== "OWNER"} /></Field>
              <Field label="Estado"><Input name="state" defaultValue={wedding.state ?? ""} disabled={membership.role !== "OWNER"} /></Field>
            </div>
            <Field label="Local do evento">
              <Input name="venueName" defaultValue={wedding.venueName ?? ""} disabled={membership.role !== "OWNER"} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Estilo"><Input name="style" defaultValue={wedding.style ?? ""} disabled={membership.role !== "OWNER"} /></Field>
              <Field label="Limite de convidados"><Input name="guestLimit" type="number" defaultValue={wedding.guestLimit ?? ""} disabled={membership.role !== "OWNER"} /></Field>
              <Field label="Orçamento total (R$)"><Input name="totalBudget" defaultValue={wedding.totalBudget ?? ""} disabled={membership.role !== "OWNER"} /></Field>
            </div>
            {membership.role === "OWNER" && (
              <div className="pt-2"><Button type="submit">Salvar</Button></div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Colaboradores e permissões</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium text-ink">{m.user.name}</p>
                <p className="text-xs text-ink-muted">{m.user.email}</p>
              </div>
              <Badge tone="brand">{ROLE_LABELS[m.role]}</Badge>
            </div>
          ))}
          <p className="pt-2 text-xs text-ink-muted">
            Papéis definem o acesso padrão por módulo. Administradores enxergam e editam tudo; assessoria acessa tarefas,
            cronograma, fornecedores, contratos, agenda, convidados e financeiro; colaboradores acessam apenas tarefas;
            visualizadores apenas consultam.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico de alterações recentes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentChanges.length === 0 && <p className="text-sm text-ink-muted">Nenhuma alteração registrada ainda.</p>}
          {recentChanges.map((c) => (
            <div key={c.id} className="border-b border-border pb-2 text-xs text-ink-secondary last:border-0">
              <span className="font-medium text-ink">{c.user?.name ?? "Sistema"}</span>{" "}
              {c.action === "CREATE" ? "criou" : c.action === "DELETE" ? "excluiu" : "atualizou"} {c.entity.toLowerCase()}
              {c.field && ` (${c.field})`} — {formatDate(c.createdAt)}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
