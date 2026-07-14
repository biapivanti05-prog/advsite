import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { RSVP_STATUS_LABELS, GUEST_SIDE_LABELS } from "@/lib/labels";
import type { Guest, GuestTag, Tag } from "@prisma/client";

type GuestWithTags = Guest & { tags: (GuestTag & { tag: Tag })[] };

export function GuestForm({
  guest,
  allTags,
  action,
}: {
  guest?: GuestWithTags;
  allTags: Tag[];
  action: (formData: FormData) => void;
}) {
  const guestTagIds = new Set(guest?.tags.map((t) => t.tagId));

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome completo">
          <Input name="fullName" required defaultValue={guest?.fullName} />
        </Field>
        <Field label="Nome social">
          <Input name="socialName" defaultValue={guest?.socialName ?? ""} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Lado">
          <Select name="side" defaultValue={guest?.side ?? "BOTH"}>
            {Object.entries(GUEST_SIDE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Relação">
          <Input name="relationship" defaultValue={guest?.relationship ?? ""} placeholder="Ex: prima, amigo de trabalho" />
        </Field>
        <Field label="Status do RSVP">
          <Select name="rsvpStatus" defaultValue={guest?.rsvpStatus ?? "PRE_LIST"}>
            {Object.entries(RSVP_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Telefone"><Input name="phone" defaultValue={guest?.phone ?? ""} /></Field>
        <Field label="WhatsApp"><Input name="whatsapp" defaultValue={guest?.whatsapp ?? ""} /></Field>
        <Field label="E-mail"><Input name="email" type="email" defaultValue={guest?.email ?? ""} /></Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cidade"><Input name="city" defaultValue={guest?.city ?? ""} /></Field>
        <Field label="Estado"><Input name="state" defaultValue={guest?.state ?? ""} /></Field>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg bg-black/[0.02] p-3">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="isChild" defaultChecked={guest?.isChild} /> É criança
        </label>
        <Field label="Idade (se criança)">
          <Input name="childAge" type="number" min={0} defaultValue={guest?.childAge ?? ""} />
        </Field>
      </div>

      <Field label="Acompanhantes permitidos">
        <Input name="plusOneAllowed" type="number" min={0} defaultValue={guest?.plusOneAllowed ?? 0} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Restrição alimentar"><Input name="dietaryRestriction" defaultValue={guest?.dietaryRestriction ?? ""} /></Field>
        <Field label="Alergias"><Input name="allergies" defaultValue={guest?.allergies ?? ""} /></Field>
      </div>

      <Field label="Necessidades de acessibilidade">
        <Input name="accessibilityNeeds" defaultValue={guest?.accessibilityNeeds ?? ""} />
      </Field>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="needsTransport" defaultChecked={guest?.needsTransport} /> Precisa de transporte
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="needsLodging" defaultChecked={guest?.needsLodging} /> Precisa de hospedagem
        </label>
      </div>

      <Field label="Etiquetas">
        <div className="flex flex-wrap gap-2 rounded-lg border border-border-strong p-3">
          {allTags.map((t) => (
            <label key={t.id} className="flex items-center gap-1.5 rounded-full bg-black/[0.03] px-2.5 py-1 text-xs text-ink">
              <input type="checkbox" name="tags" value={t.id} defaultChecked={guestTagIds.has(t.id)} />
              {t.name}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Observações">
        <Textarea name="notes" defaultValue={guest?.notes ?? ""} rows={2} />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{guest ? "Salvar alterações" : "Adicionar convidado"}</Button>
        <ButtonLink href={guest ? `/convidados/${guest.id}` : "/convidados"} variant="ghost">Cancelar</ButtonLink>
      </div>
    </form>
  );
}
