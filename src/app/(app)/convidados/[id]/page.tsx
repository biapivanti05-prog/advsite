import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { RSVP_STATUS_LABELS, GUEST_SIDE_LABELS } from "@/lib/labels";
import { deleteGuest, assignTable } from "@/server/actions/guests";
import { Pencil, Trash2 } from "lucide-react";

export default async function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership();
  const { id } = await params;

  const [guest, tables] = await Promise.all([
    db.guest.findFirst({
      where: { id, weddingId: membership.weddingId },
      include: { tags: { include: { tag: true } }, table: true, family: true },
    }),
    db.table.findMany({ where: { weddingId: membership.weddingId } }),
  ]);
  if (!guest) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card>
        <CardHeader>
          <div>
            <Badge tone="brand">{RSVP_STATUS_LABELS[guest.rsvpStatus]}</Badge>
            <CardTitle className="mt-2 text-xl">{guest.fullName}</CardTitle>
            <p className="text-sm text-ink-muted">{GUEST_SIDE_LABELS[guest.side]} {guest.relationship && `· ${guest.relationship}`}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <ButtonLink href={`/convidados/${guest.id}/editar`} variant="secondary" size="sm"><Pencil size={14} /></ButtonLink>
            <form action={deleteGuest.bind(null, guest.id)}>
              <Button variant="danger" size="sm" type="submit"><Trash2 size={14} /></Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-ink-muted">Telefone</dt><dd className="text-ink">{guest.phone ?? "—"}</dd></div>
            <div><dt className="text-ink-muted">WhatsApp</dt><dd className="text-ink">{guest.whatsapp ?? "—"}</dd></div>
            <div><dt className="text-ink-muted">E-mail</dt><dd className="text-ink">{guest.email ?? "—"}</dd></div>
            <div><dt className="text-ink-muted">Cidade</dt><dd className="text-ink">{guest.city ?? "—"}{guest.state ? `/${guest.state}` : ""}</dd></div>
            <div><dt className="text-ink-muted">Acompanhantes</dt><dd className="text-ink">{guest.plusOneAllowed}</dd></div>
            <div><dt className="text-ink-muted">Família</dt><dd className="text-ink">{guest.family?.name ?? "—"}</dd></div>
          </dl>

          {(guest.dietaryRestriction || guest.allergies || guest.accessibilityNeeds) && (
            <div className="rounded-lg bg-warning-bg p-3 text-sm text-ink">
              {guest.dietaryRestriction && <p><strong>Restrição alimentar:</strong> {guest.dietaryRestriction}</p>}
              {guest.allergies && <p><strong>Alergias:</strong> {guest.allergies}</p>}
              {guest.accessibilityNeeds && <p><strong>Acessibilidade:</strong> {guest.accessibilityNeeds}</p>}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {guest.tags.map((t) => <Badge key={t.tagId} tone="neutral">{t.tag.name}</Badge>)}
            {guest.isChild && <Badge tone="info">Criança{guest.childAge ? ` · ${guest.childAge} anos` : ""}</Badge>}
            {guest.needsTransport && <Badge tone="warning">Precisa transporte</Badge>}
            {guest.needsLodging && <Badge tone="warning">Precisa hospedagem</Badge>}
          </div>

          {guest.notes && <p className="text-sm text-ink-secondary">{guest.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mesa</CardTitle></CardHeader>
        <CardContent>
          <form action={assignTable.bind(null, guest.id)} className="flex gap-2">
            <Select name="tableId" defaultValue={guest.tableId ?? ""}>
              <option value="">Sem mesa atribuída</option>
              {tables.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.capacity} lugares)</option>)}
            </Select>
            <Button type="submit" variant="secondary">Salvar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
