"use server";

import { db } from "@/server/db";
import { getCurrentMembership, logChange } from "@/server/permissions";
import { revalidatePath } from "next/cache";

export async function updateWeddingConfig(formData: FormData) {
  const membership = await getCurrentMembership();
  if (membership.role !== "OWNER") return;

  const partner1Name = String(formData.get("partner1Name") ?? "").trim();
  const partner2Name = String(formData.get("partner2Name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;
  const state = String(formData.get("state") ?? "").trim() || null;
  const venueName = String(formData.get("venueName") ?? "").trim() || null;
  const style = String(formData.get("style") ?? "").trim() || null;
  const guestLimitRaw = String(formData.get("guestLimit") ?? "");
  const totalBudgetRaw = String(formData.get("totalBudget") ?? "");

  await db.wedding.update({
    where: { id: membership.weddingId },
    data: {
      partner1Name,
      partner2Name,
      city,
      state,
      venueName,
      style,
      guestLimit: guestLimitRaw ? Number(guestLimitRaw) : null,
      totalBudget: totalBudgetRaw ? Number(totalBudgetRaw.replace(",", ".")) : null,
    },
  });

  await logChange({
    weddingId: membership.weddingId,
    userId: membership.userId,
    entity: "Wedding",
    entityId: membership.weddingId,
    action: "UPDATE",
  });

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
}
