"use server";

import { db } from "@/server/db";
import { getCurrentMembership, logChange } from "@/server/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { GuestSide, RsvpStatus } from "@prisma/client";

const guestSchema = z.object({
  fullName: z.string().min(1, "Nome obrigatório"),
  socialName: z.string().optional(),
  side: z.string(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isChild: z.string().optional(),
  childAge: z.string().optional(),
  plusOneAllowed: z.string().optional(),
  dietaryRestriction: z.string().optional(),
  allergies: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  needsTransport: z.string().optional(),
  needsLodging: z.string().optional(),
  rsvpStatus: z.string(),
  notes: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
});

function toTagIds(tags: string | string[] | undefined) {
  if (!tags) return [];
  return Array.isArray(tags) ? tags : [tags];
}

export async function createGuest(formData: FormData) {
  const membership = await getCurrentMembership();
  const raw = Object.fromEntries(formData);
  const parsed = guestSchema.parse({ ...raw, tags: formData.getAll("tags") });

  const guest = await db.guest.create({
    data: {
      weddingId: membership.weddingId,
      fullName: parsed.fullName,
      socialName: parsed.socialName || null,
      side: parsed.side as GuestSide,
      relationship: parsed.relationship || null,
      phone: parsed.phone || null,
      whatsapp: parsed.whatsapp || null,
      email: parsed.email || null,
      city: parsed.city || null,
      state: parsed.state || null,
      isChild: parsed.isChild === "on",
      childAge: parsed.childAge ? Number(parsed.childAge) : null,
      plusOneAllowed: parsed.plusOneAllowed ? Number(parsed.plusOneAllowed) : 0,
      dietaryRestriction: parsed.dietaryRestriction || null,
      allergies: parsed.allergies || null,
      accessibilityNeeds: parsed.accessibilityNeeds || null,
      needsTransport: parsed.needsTransport === "on",
      needsLodging: parsed.needsLodging === "on",
      rsvpStatus: parsed.rsvpStatus as RsvpStatus,
      notes: parsed.notes || null,
      tags: { create: toTagIds(parsed.tags).map((tagId) => ({ tagId })) },
    },
  });

  await logChange({ weddingId: membership.weddingId, userId: membership.userId, entity: "Guest", entityId: guest.id, action: "CREATE", newValue: guest.fullName });
  revalidatePath("/convidados");
  redirect(`/convidados/${guest.id}`);
}

export async function updateGuest(guestId: string, formData: FormData) {
  const membership = await getCurrentMembership();
  const raw = Object.fromEntries(formData);
  const parsed = guestSchema.parse({ ...raw, tags: formData.getAll("tags") });

  await db.guestTag.deleteMany({ where: { guestId } });
  await db.guest.update({
    where: { id: guestId },
    data: {
      fullName: parsed.fullName,
      socialName: parsed.socialName || null,
      side: parsed.side as GuestSide,
      relationship: parsed.relationship || null,
      phone: parsed.phone || null,
      whatsapp: parsed.whatsapp || null,
      email: parsed.email || null,
      city: parsed.city || null,
      state: parsed.state || null,
      isChild: parsed.isChild === "on",
      childAge: parsed.childAge ? Number(parsed.childAge) : null,
      plusOneAllowed: parsed.plusOneAllowed ? Number(parsed.plusOneAllowed) : 0,
      dietaryRestriction: parsed.dietaryRestriction || null,
      allergies: parsed.allergies || null,
      accessibilityNeeds: parsed.accessibilityNeeds || null,
      needsTransport: parsed.needsTransport === "on",
      needsLodging: parsed.needsLodging === "on",
      rsvpStatus: parsed.rsvpStatus as RsvpStatus,
      notes: parsed.notes || null,
      tags: { create: toTagIds(parsed.tags).map((tagId) => ({ tagId })) },
    },
  });

  await logChange({ weddingId: membership.weddingId, userId: membership.userId, entity: "Guest", entityId: guestId, action: "UPDATE" });
  revalidatePath("/convidados");
  revalidatePath(`/convidados/${guestId}`);
  redirect(`/convidados/${guestId}`);
}

export async function deleteGuest(guestId: string) {
  const membership = await getCurrentMembership();
  await db.guest.delete({ where: { id: guestId } });
  await logChange({ weddingId: membership.weddingId, userId: membership.userId, entity: "Guest", entityId: guestId, action: "DELETE" });
  revalidatePath("/convidados");
  redirect("/convidados");
}

export async function assignTable(guestId: string, formData: FormData) {
  const tableId = String(formData.get("tableId") || "") || null;
  await db.guest.update({ where: { id: guestId }, data: { tableId } });
  revalidatePath("/convidados");
  revalidatePath(`/convidados/${guestId}`);
}
