import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

const ROLE_MODULE_ACCESS: Record<Role, string[] | "*"> = {
  OWNER: "*",
  PLANNER: [
    "tarefas",
    "cronograma",
    "fornecedores",
    "contratos",
    "agenda",
    "dia-do-casamento",
    "convidados",
    "financeiro",
  ],
  COLLABORATOR: ["tarefas"],
  VIEWER: ["tarefas", "cronograma", "convidados"],
};

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/**
 * Fase 1: cada instância hospeda um único casamento. Retorna a membership do
 * usuário logado nesse casamento (ou cria/associa se ainda não existir —
 * cobre o caso de um segundo usuário criado via seed/admin).
 */
export async function getCurrentMembership() {
  const session = await requireSession();
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { wedding: true, permissionOverrides: true, user: true },
  });
  if (!membership) redirect("/login");
  return membership;
}

export function canAccessModule(role: Role, module: string) {
  const allowed = ROLE_MODULE_ACCESS[role];
  return allowed === "*" || allowed.includes(module);
}

export async function requireModuleAccess(module: string) {
  const membership = await getCurrentMembership();
  const override = membership.permissionOverrides.find((p) => p.module === module);
  if (override) {
    if (!override.canView) redirect("/dashboard");
    return membership;
  }
  if (!canAccessModule(membership.role, module)) redirect("/dashboard");
  return membership;
}

export async function logChange(params: {
  weddingId: string;
  userId?: string | null;
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  await db.changeLog.create({
    data: {
      weddingId: params.weddingId,
      userId: params.userId ?? null,
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      field: params.field,
      oldValue: params.oldValue,
      newValue: params.newValue,
    },
  });
}
