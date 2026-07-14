import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { Card, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { RSVP_STATUS_LABELS, GUEST_SIDE_LABELS } from "@/lib/labels";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import type { Prisma, RsvpStatus, GuestSide } from "@prisma/client";

const CONFIRMED_STATUSES = ["CONFIRMED", "CONFIRMED_WITH_PLUS_ONE"];

function statusTone(status: string) {
  if (CONFIRMED_STATUSES.includes(status)) return "good" as const;
  if (status === "DECLINED" || status === "REMOVED" || status === "CANCELED") return "critical" as const;
  if (status === "NO_RESPONSE" || status === "AWAITING_RESPONSE") return "warning" as const;
  return "neutral" as const;
}

export default async function ConvidadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; side?: string; tag?: string }>;
}) {
  const membership = await getCurrentMembership();
  const params = await searchParams;

  const where: Prisma.GuestWhereInput = { weddingId: membership.weddingId };
  if (params.q) where.fullName = { contains: params.q };
  if (params.status) where.rsvpStatus = params.status as RsvpStatus;
  if (params.side) where.side = params.side as GuestSide;
  if (params.tag) where.tags = { some: { tag: { name: params.tag } } };

  const [guests, allGuests, tags] = await Promise.all([
    db.guest.findMany({ where, include: { tags: { include: { tag: true } }, table: true }, orderBy: { fullName: "asc" } }),
    db.guest.findMany({ where: { weddingId: membership.weddingId }, select: { rsvpStatus: true, isChild: true, plusOneAllowed: true } }),
    db.tag.findMany({ where: { weddingId: membership.weddingId, kind: "guest" }, orderBy: { name: "asc" } }),
  ]);

  const total = allGuests.length;
  const confirmed = allGuests.filter((g) => CONFIRMED_STATUSES.includes(g.rsvpStatus)).length;
  const declined = allGuests.filter((g) => g.rsvpStatus === "DECLINED").length;
  const pending = total - confirmed - declined;
  const adults = allGuests.filter((g) => !g.isChild).length;
  const children = allGuests.filter((g) => g.isChild).length;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Convidados</h1>
          <p className="text-sm text-ink-muted">{total} cadastrados · limite {membership.wedding.guestLimit ?? "—"}</p>
        </div>
        <ButtonLink href="/convidados/novo"><Plus size={16} /> Novo convidado</ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Total" value={total} icon={<Users size={15} />} />
        <StatTile label="Confirmados" value={confirmed} tone="good" />
        <StatTile label="Recusados" value={declined} tone="critical" />
        <StatTile label="Pendentes" value={pending} tone="warning" />
        <StatTile label="Adultos / Crianças" value={`${adults} / ${children}`} />
      </div>

      {membership.wedding.guestLimit && total > membership.wedding.guestLimit && (
        <div className="rounded-lg bg-critical-bg px-4 py-2.5 text-sm text-critical">
          Atenção: a lista ultrapassou o limite de {membership.wedding.guestLimit} convidados definido para o espaço.
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="min-w-[180px] flex-1">
              <Input name="q" placeholder="Buscar por nome…" defaultValue={params.q} />
            </div>
            <Select name="status" defaultValue={params.status ?? ""} className="w-auto">
              <option value="">Todos os status</option>
              {Object.entries(RSVP_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Select name="side" defaultValue={params.side ?? ""} className="w-auto">
              <option value="">Ambos os lados</option>
              {Object.entries(GUEST_SIDE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Select name="tag" defaultValue={params.tag ?? ""} className="w-auto">
              <option value="">Todas as etiquetas</option>
              {tags.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </Select>
            <button type="submit" className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-ink hover:bg-brand-50">
              Filtrar
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="divide-y divide-border">
          {guests.length === 0 && <p className="p-8 text-center text-sm text-ink-muted">Nenhum convidado encontrado.</p>}
          {guests.map((g) => (
            <Link key={g.id} href={`/convidados/${g.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-brand-50/40">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{g.fullName} {g.isChild && <span className="text-xs text-ink-muted">(criança)</span>}</p>
                <p className="flex flex-wrap gap-1 text-xs text-ink-muted">
                  {GUEST_SIDE_LABELS[g.side]} {g.table && `· ${g.table.name}`} {g.tags.slice(0, 2).map((t) => t.tag.name).join(", ")}
                </p>
              </div>
              <Badge tone={statusTone(g.rsvpStatus)}>{RSVP_STATUS_LABELS[g.rsvpStatus]}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
