export const TASK_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Não iniciada",
  RESEARCHING: "Em pesquisa",
  AWAITING_DECISION: "Aguardando decisão",
  AWAITING_QUOTE: "Aguardando orçamento",
  NEGOTIATING: "Em negociação",
  AWAITING_THIRD_PARTY: "Aguardando terceiro",
  HIRED: "Contratada",
  IN_PROGRESS: "Em andamento",
  BLOCKED: "Bloqueada",
  DONE: "Concluída",
  CANCELED: "Cancelada",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
  CRITICAL: "Crítica",
};

export const RSVP_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  PRE_LIST: "Pré-lista",
  APPROVED: "Aprovado",
  INVITE_NOT_SENT: "Convite não enviado",
  INVITE_SENT: "Convite enviado",
  INVITE_DELIVERED: "Convite entregue",
  AWAITING_RESPONSE: "Aguardando confirmação",
  CONFIRMED: "Confirmado",
  CONFIRMED_WITH_PLUS_ONE: "Confirmado c/ acompanhante",
  DECLINED: "Recusado",
  NO_RESPONSE: "Sem resposta",
  CONTACT_NEEDED: "Contato necessário",
  WAITLIST: "Lista de espera",
  REMOVED: "Removido",
  CANCELED: "Cancelado",
};

export const VENDOR_STATUS_LABELS: Record<string, string> = {
  RESEARCHING: "Pesquisando",
  REFERRED: "Indicado",
  CONTACTED: "Contato iniciado",
  AWAITING_RESPONSE: "Aguardando resposta",
  QUOTE_RECEIVED: "Orçamento recebido",
  MEETING_SCHEDULED: "Reunião agendada",
  VISITED: "Visitado",
  COMPARING: "Em comparação",
  NEGOTIATING: "Em negociação",
  APPROVED: "Aprovado",
  HIRED: "Contratado",
  DISCARDED: "Descartado",
  CANCELED: "Cancelado",
  SERVICE_DONE: "Serviço concluído",
  REVIEW_PENDING: "Avaliação pendente",
};

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  ESTIMATED: "Estimada",
  QUOTED: "Cotada",
  APPROVED: "Aprovada",
  HIRED: "Contratada",
  PARTIALLY_PAID: "Parcialmente paga",
  PAID: "Paga",
  OVERDUE: "Vencida",
  CANCELED: "Cancelada",
  REFUNDED: "Reembolsada",
};

export const INSTALLMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  OVERDUE: "Vencida",
  CANCELED: "Cancelada",
};

export const GUEST_SIDE_LABELS: Record<string, string> = {
  BRIDE: "Noiva",
  GROOM: "Noivo",
  BOTH: "Ambos",
};

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Administrador (noivo/a)",
  PLANNER: "Assessoria/Cerimonialista",
  COLLABORATOR: "Familiar/Colaborador",
  VIEWER: "Visualizador",
};
