import { PrismaClient, Role, RsvpStatus, TaskPriority, TaskStatus, VendorStatus, ExpenseStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import { TIMELINE_PHASES } from "./seed-data/timeline";
import { BUDGET_CATEGORIES, GUEST_TAGS, COMMON_RISKS } from "./seed-data/reference";

const db = new PrismaClient();

const PLANNING_START = new Date("2026-07-13T12:00:00Z");
const WEDDING_DATE = new Date("2028-10-07T18:00:00Z");
const TODAY = new Date("2026-07-14T12:00:00Z");

function offsetFromWedding(monthsBefore: number): Date {
  const days = Math.round(monthsBefore * 30.44);
  return addDays(WEDDING_DATE, -days);
}

async function main() {
  console.log("Limpando dados existentes...");
  // Ordem respeita dependências de FK (filhos antes dos pais).
  await db.changeLog.deleteMany();
  await db.notification.deleteMany();
  await db.comment.deleteMany();
  await db.attachment.deleteMany();
  await db.checklistItem.deleteMany();
  await db.taskDependency.deleteMany();
  await db.taskTag.deleteMany();
  await db.task.deleteMany();
  await db.timelinePhase.deleteMany();
  await db.installment.deleteMany();
  await db.expense.deleteMany();
  await db.budgetCategory.deleteMany();
  await db.account.deleteMany();
  await db.card.deleteMany();
  await db.fundingSource.deleteMany();
  await db.contract.deleteMany();
  await db.document.deleteMany();
  await db.vendor.deleteMany();
  await db.invitation.deleteMany();
  await db.guestTag.deleteMany();
  await db.guest.deleteMany();
  await db.family.deleteMany();
  await db.table.deleteMany();
  await db.tag.deleteMany();
  await db.decision.deleteMany();
  await db.risk.deleteMany();
  await db.agendaItem.deleteMany();
  await db.weddingEvent.deleteMany();
  await db.note.deleteMany();
  await db.permissionOverride.deleteMany();
  await db.membership.deleteMany();
  await db.wedding.deleteMany();
  await db.user.deleteMany();

  console.log("Criando casamento...");
  const wedding = await db.wedding.create({
    data: {
      partner1Name: "Beatriz",
      partner2Name: "Parceiro(a)",
      planningStart: PLANNING_START,
      weddingDate: WEDDING_DATE,
      city: "São Paulo",
      state: "SP",
      venueName: "A definir",
      style: "Clássico romântico",
      theme: "rose",
      guestLimit: 150,
      totalBudget: 180000,
      contingencyPct: 10,
    },
  });

  console.log("Criando usuários...");
  const demoPasswordHash = await bcrypt.hash("casorio2026", 12);

  const owner1 = await db.user.create({
    data: {
      name: "Beatriz",
      email: "biapivanti05@gmail.com",
      passwordHash: demoPasswordHash,
    },
  });

  const owner2 = await db.user.create({
    data: {
      name: "Parceiro(a)",
      email: "parceiro@exemplo.com",
      passwordHash: demoPasswordHash,
    },
  });

  const plannerUser = await db.user.create({
    data: {
      name: "Assessoria Momento Perfeito (exemplo)",
      email: "assessoria@exemplo.com",
      passwordHash: demoPasswordHash,
    },
  });

  const collaboratorUser = await db.user.create({
    data: {
      name: "Mãe da noiva (exemplo)",
      email: "familiar@exemplo.com",
      passwordHash: demoPasswordHash,
    },
  });

  await db.membership.createMany({
    data: [
      { userId: owner1.id, weddingId: wedding.id, role: Role.OWNER },
      { userId: owner2.id, weddingId: wedding.id, role: Role.OWNER },
      { userId: plannerUser.id, weddingId: wedding.id, role: Role.PLANNER },
      { userId: collaboratorUser.id, weddingId: wedding.id, role: Role.COLLABORATOR },
    ],
  });

  console.log("Criando cronograma regressivo completo...");
  let totalTasks = 0;
  for (const phase of TIMELINE_PHASES) {
    const rangeStartRaw = offsetFromWedding(phase.monthsBeforeStart);
    const rangeStart = phase.order === 1 && rangeStartRaw < PLANNING_START ? PLANNING_START : rangeStartRaw;
    const rangeEnd = offsetFromWedding(phase.monthsBeforeEnd);

    const timelinePhase = await db.timelinePhase.create({
      data: {
        weddingId: wedding.id,
        name: phase.name,
        category: phase.category,
        order: phase.order,
        monthsBeforeStart: phase.monthsBeforeStart,
        monthsBeforeEnd: phase.monthsBeforeEnd,
      },
    });

    const spanMs = rangeEnd.getTime() - rangeStart.getTime();
    const n = phase.items.length;

    for (let i = 0; i < n; i++) {
      const fraction = (i + 1) / (n + 1);
      const dueDate = new Date(rangeStart.getTime() + spanMs * fraction);
      const isFinalStretch = phase.order >= 12; // última semana, véspera, dia do casamento, pós

      await db.task.create({
        data: {
          weddingId: wedding.id,
          phaseId: timelinePhase.id,
          title: phase.items[i],
          category: phase.category,
          status: TaskStatus.NOT_STARTED,
          priority: isFinalStretch ? TaskPriority.HIGH : TaskPriority.MEDIUM,
          dueDate,
          maxDueDate: addDays(dueDate, 7),
          createdById: owner1.id,
        },
      });
      totalTasks++;
    }
  }
  console.log(`  ${totalTasks} tarefas criadas a partir do cronograma.`);

  console.log("Criando tarefas de destaque para o painel (exemplos)...");
  await db.task.createMany({
    data: [
      {
        weddingId: wedding.id,
        title: "[Exemplo] Responder orçamento do buffet",
        category: "Buffet",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        dueDate: addDays(TODAY, -3),
        assigneeId: owner1.id,
        createdById: owner1.id,
        notes: "Dado de demonstração — pode ser excluído.",
      },
      {
        weddingId: wedding.id,
        title: "[Exemplo] Confirmar reserva do local da cerimônia",
        category: "Espaço",
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.CRITICAL,
        dueDate: addDays(TODAY, -1),
        assigneeId: owner2.id,
        createdById: owner1.id,
        notes: "Dado de demonstração — pode ser excluído.",
      },
      {
        weddingId: wedding.id,
        title: "[Exemplo] Ligar para fotógrafo sobre disponibilidade",
        category: "Fotografia",
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.HIGH,
        dueDate: TODAY,
        assigneeId: owner1.id,
        createdById: owner1.id,
        notes: "Dado de demonstração — pode ser excluído.",
      },
      {
        weddingId: wedding.id,
        title: "[Exemplo] Enviar lista preliminar de convidados para a família",
        category: "Convidados",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: addDays(TODAY, 4),
        assigneeId: owner2.id,
        createdById: owner1.id,
        notes: "Dado de demonstração — pode ser excluído.",
      },
      {
        weddingId: wedding.id,
        title: "[Exemplo] Definir orçamento global do casamento",
        category: "Planejamento inicial",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        progressPct: 100,
        dueDate: addDays(TODAY, -2),
        assigneeId: owner1.id,
        createdById: owner1.id,
        notes: "Dado de demonstração — pode ser excluído.",
      },
    ],
  });

  console.log("Criando categorias financeiras...");
  const weights: Record<string, number> = {
    Espaço: 0.2, Buffet: 0.18, Fotografia: 0.07, Filmagem: 0.05, Decoração: 0.08,
    Música: 0.04, DJ: 0.03, Vestido: 0.04, "Traje do noivo": 0.02, Beleza: 0.015,
    Papelaria: 0.015, Bolo: 0.01, Doces: 0.01, Bebidas: 0.03, Bar: 0.02,
    Alianças: 0.02, Transporte: 0.015, Hospedagem: 0.02, "Lua de mel": 0.08,
    Imprevistos: 0.1,
  };
  const totalBudget = wedding.totalBudget ?? 0;
  for (const name of BUDGET_CATEGORIES) {
    const pct = weights[name] ?? 0.005;
    await db.budgetCategory.create({
      data: { weddingId: wedding.id, name, plannedAmount: Math.round(totalBudget * pct) },
    });
  }

  console.log("Criando fontes de recursos...");
  await db.fundingSource.createMany({
    data: [
      { weddingId: wedding.id, sourceName: "Recursos do casal", expectedAmount: 100000, receivedAmount: 100000, expectedDate: PLANNING_START },
      { weddingId: wedding.id, sourceName: "Família da noiva", expectedAmount: 50000, receivedAmount: 20000 },
      { weddingId: wedding.id, sourceName: "Família do noivo", expectedAmount: 30000, receivedAmount: 30000 },
    ],
  });

  console.log("Criando contas...");
  const contaConjunta = await db.account.create({
    data: { weddingId: wedding.id, name: "Conta conjunta do casamento", type: "conjunta", balance: 45000 },
  });

  console.log("Criando fornecedores de exemplo...");
  const espaco = await db.budgetCategory.findFirst({ where: { weddingId: wedding.id, name: "Espaço" } });
  const buffet = await db.budgetCategory.findFirst({ where: { weddingId: wedding.id, name: "Buffet" } });
  const fotografia = await db.budgetCategory.findFirst({ where: { weddingId: wedding.id, name: "Fotografia" } });

  const vendorEspaco = await db.vendor.create({
    data: {
      weddingId: wedding.id, companyName: "Espaço Jardim Real (exemplo)", category: "Espaço",
      contactName: "Carla Mendes", phone: "(11) 99999-0001", status: VendorStatus.HIRED,
      initialPrice: 38000, negotiatedPrice: 35000,
    },
  });
  const vendorBuffet = await db.vendor.create({
    data: {
      weddingId: wedding.id, companyName: "Sabor & Arte Buffet (exemplo)", category: "Buffet",
      contactName: "Roberto Lima", phone: "(11) 99999-0002", status: VendorStatus.NEGOTIATING,
      initialPrice: 32000,
    },
  });
  const vendorFoto = await db.vendor.create({
    data: {
      weddingId: wedding.id, companyName: "Estúdio Instante (exemplo)", category: "Fotografia",
      contactName: "Ana Souza", phone: "(11) 99999-0003", status: VendorStatus.RESEARCHING,
    },
  });

  console.log("Criando despesas de exemplo...");
  const expenseEspaco = await db.expense.create({
    data: {
      weddingId: wedding.id, categoryId: espaco?.id, vendorId: vendorEspaco.id,
      description: "Aluguel do espaço — Jardim Real", originalAmount: 35000, finalAmount: 35000,
      status: ExpenseStatus.PARTIALLY_PAID,
    },
  });
  await db.installment.createMany({
    data: [
      { expenseId: expenseEspaco.id, number: 1, amount: 10000, dueDate: addDays(TODAY, -10), paidDate: addDays(TODAY, -10), status: "PAID", accountId: contaConjunta.id },
      { expenseId: expenseEspaco.id, number: 2, amount: 12500, dueDate: addDays(TODAY, 20), status: "PENDING" },
      { expenseId: expenseEspaco.id, number: 3, amount: 12500, dueDate: addDays(TODAY, 50), status: "PENDING" },
    ],
  });

  const expenseBuffet = await db.expense.create({
    data: {
      weddingId: wedding.id, categoryId: buffet?.id, vendorId: vendorBuffet.id,
      description: "Buffet completo (orçamento em negociação)", originalAmount: 32000, finalAmount: 32000,
      status: ExpenseStatus.QUOTED,
    },
  });
  await db.installment.create({
    data: { expenseId: expenseBuffet.id, number: 1, amount: 32000, dueDate: addDays(TODAY, 5), status: "PENDING" },
  });

  await db.expense.create({
    data: {
      weddingId: wedding.id, categoryId: fotografia?.id, vendorId: vendorFoto.id,
      description: "Cobertura fotográfica (estimativa)", originalAmount: 8000, finalAmount: 8000,
      status: ExpenseStatus.ESTIMATED,
    },
  });

  console.log("Criando etiquetas de convidados...");
  const tagMap = new Map<string, string>();
  for (const name of GUEST_TAGS) {
    const tag = await db.tag.create({ data: { weddingId: wedding.id, name, kind: "guest" } });
    tagMap.set(name, tag.id);
  }

  console.log("Criando mesas...");
  const table1 = await db.table.create({ data: { weddingId: wedding.id, name: "Mesa 1", capacity: 8, area: "recepção" } });
  await db.table.createMany({
    data: [
      { weddingId: wedding.id, name: "Mesa 2", capacity: 8, area: "recepção" },
      { weddingId: wedding.id, name: "Mesa 3 (família)", capacity: 10, area: "recepção" },
    ],
  });

  console.log("Criando convidados de exemplo...");
  const familiaSilva = await db.family.create({ data: { weddingId: wedding.id, name: "Família Silva (exemplo)" } });

  const demoGuests: Array<{
    fullName: string; side: "BRIDE" | "GROOM" | "BOTH"; rsvpStatus: RsvpStatus;
    isChild?: boolean; childAge?: number; tags: string[]; needsTransport?: boolean; needsLodging?: boolean;
    familyId?: string; tableId?: string; dietaryRestriction?: string;
  }> = [
    { fullName: "Marina Silva (exemplo)", side: "BRIDE", rsvpStatus: RsvpStatus.CONFIRMED, tags: ["Família da noiva", "Prioridade A"], familyId: familiaSilva.id, tableId: table1.id },
    { fullName: "João Silva (exemplo)", side: "BRIDE", rsvpStatus: RsvpStatus.CONFIRMED, tags: ["Família da noiva", "Prioridade A"], familyId: familiaSilva.id, tableId: table1.id },
    { fullName: "Sofia Silva (exemplo)", side: "BRIDE", rsvpStatus: RsvpStatus.CONFIRMED, isChild: true, childAge: 6, tags: ["Família da noiva", "Criança"], familyId: familiaSilva.id },
    { fullName: "Pedro Andrade (exemplo)", side: "GROOM", rsvpStatus: RsvpStatus.AWAITING_RESPONSE, tags: ["Amigos do noivo", "Prioridade B"] },
    { fullName: "Larissa Ferreira (exemplo)", side: "BOTH", rsvpStatus: RsvpStatus.DECLINED, tags: ["Amigos do casal"] },
    { fullName: "Camila Rocha (exemplo)", side: "BRIDE", rsvpStatus: RsvpStatus.CONFIRMED_WITH_PLUS_ONE, tags: ["Amigos da noiva", "Prioridade A"] },
    { fullName: "Rafael Torres (exemplo)", side: "GROOM", rsvpStatus: RsvpStatus.INVITE_SENT, tags: ["Trabalho", "Mora fora"], needsLodging: true },
    { fullName: "Beatriz Nunes (exemplo)", side: "BRIDE", rsvpStatus: RsvpStatus.NO_RESPONSE, tags: ["Faculdade"] },
    { fullName: "Eduardo Martins (exemplo)", side: "GROOM", rsvpStatus: RsvpStatus.CONFIRMED, tags: ["Padrinhos", "Prioridade A"], needsTransport: true },
    { fullName: "Vovó Alice (exemplo)", side: "BRIDE", rsvpStatus: RsvpStatus.CONFIRMED, tags: ["Idoso", "Acessibilidade", "Prioridade A"], dietaryRestriction: "Sem sal" },
  ];

  for (const g of demoGuests) {
    const guest = await db.guest.create({
      data: {
        weddingId: wedding.id,
        familyId: g.familyId,
        fullName: g.fullName,
        side: g.side,
        rsvpStatus: g.rsvpStatus,
        isChild: g.isChild ?? false,
        childAge: g.childAge,
        needsTransport: g.needsTransport ?? false,
        needsLodging: g.needsLodging ?? false,
        dietaryRestriction: g.dietaryRestriction,
        tableId: g.tableId,
        confirmedCount: g.rsvpStatus === RsvpStatus.CONFIRMED || g.rsvpStatus === RsvpStatus.CONFIRMED_WITH_PLUS_ONE ? 1 : null,
      },
    });
    for (const tagName of g.tags) {
      const tagId = tagMap.get(tagName);
      if (tagId) await db.guestTag.create({ data: { guestId: guest.id, tagId } });
    }
  }

  console.log("Criando riscos comuns...");
  for (const risk of COMMON_RISKS) {
    await db.risk.create({
      data: {
        weddingId: wedding.id,
        description: risk.description,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        level: risk.level,
        preventivePlan: risk.preventivePlan,
        status: "open",
      },
    });
  }

  console.log("Criando decisões de exemplo...");
  await db.decision.createMany({
    data: [
      {
        weddingId: wedding.id, subject: "Estilo geral do casamento",
        options: "Clássico / Rústico / Moderno / Praiano",
        status: "DECIDED", finalChoice: "Clássico romântico",
        decidedAt: PLANNING_START,
      },
      {
        weddingId: wedding.id, subject: "Buffet",
        options: "Sabor & Arte / Buffet Encanto / Buffet Vila Rica",
        status: "DISCUSSING",
        deadline: addDays(TODAY, 30),
      },
    ],
  });

  console.log("\nSeed concluído com sucesso.");
  console.log("─────────────────────────────────────────────");
  console.log("Login de demonstração:");
  console.log(`  E-mail:  ${owner1.email}`);
  console.log(`  Senha:   casorio2026`);
  console.log("  (demais usuários de exemplo usam a mesma senha)");
  console.log("─────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
