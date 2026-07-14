export const BUDGET_CATEGORIES = [
  "Assessoria", "Espaço", "Buffet", "Bebidas", "Bar", "Bolo", "Doces",
  "Decoração", "Flores", "Mobiliário", "Iluminação", "Som", "Gerador",
  "Fotografia", "Filmagem", "Música", "DJ", "Banda", "Celebrante",
  "Cerimônia", "Cartório", "Igreja ou templo", "Vestido", "Traje do noivo",
  "Acessórios", "Sapatos", "Alianças", "Beleza", "Papelaria", "Convites",
  "Site", "Lembranças", "Presentes de padrinhos", "Transporte", "Hospedagem",
  "Segurança", "Limpeza", "Equipe", "Recreação infantil", "Atrações",
  "Seguro", "Lua de mel", "Taxas e impostos", "Imprevistos", "Pós-casamento",
];

export const VENDOR_CATEGORIES = [
  "Assessoria/Cerimonial", "Espaço", "Buffet", "Bar/Bebidas", "Bolo e doces",
  "Decoração", "Floricultura", "Iluminação/Som/Estrutura", "Fotografia",
  "Filmagem", "Música/DJ/Banda", "Celebrante", "Papelaria/Convites",
  "Beleza", "Vestido", "Traje do noivo", "Transporte", "Hospedagem",
  "Segurança", "Lua de mel/Agência de viagens",
];

export const GUEST_TAGS = [
  "Família da noiva", "Família do noivo", "Amigos da noiva", "Amigos do noivo",
  "Amigos do casal", "Trabalho", "Faculdade", "Infância", "Vizinhos",
  "Convidados dos pais", "Padrinhos", "Madrinhas", "Daminhas", "Pajens",
  "Fornecedores convidados", "Prioridade A", "Prioridade B", "Prioridade C",
  "Obrigatório", "Possível corte", "Mora fora", "Precisa de hospedagem",
  "Precisa de transporte", "Criança", "Idoso", "Acessibilidade",
  "Restrição alimentar",
];

export const COMMON_RISKS: Array<{
  description: string;
  category: string;
  probability: string;
  impact: string;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  preventivePlan: string;
}> = [
  { description: "Chuva durante a cerimônia ou recepção ao ar livre", category: "Clima", probability: "média", impact: "alto", level: "HIGH", preventivePlan: "Contratar tenda/estrutura de backup e definir plano B coberto" },
  { description: "Calor excessivo", category: "Clima", probability: "média", impact: "médio", level: "MEDIUM", preventivePlan: "Climatização, hidratação e sombra disponíveis" },
  { description: "Falta de energia elétrica", category: "Estrutura", probability: "baixa", impact: "alto", level: "HIGH", preventivePlan: "Contratar gerador reserva" },
  { description: "Falha de som", category: "Estrutura", probability: "baixa", impact: "médio", level: "MEDIUM", preventivePlan: "Equipamento reserva e passagem de som antecipada" },
  { description: "Atraso ou ausência de fornecedor", category: "Fornecedores", probability: "baixa", impact: "alto", level: "HIGH", preventivePlan: "Confirmar horários com 48h de antecedência e ter contato reserva" },
  { description: "Atraso do casal ou dos padrinhos", category: "Operacional", probability: "média", impact: "médio", level: "MEDIUM", preventivePlan: "Cronograma com margem de segurança" },
  { description: "Problema de transporte de convidados", category: "Logística", probability: "baixa", impact: "médio", level: "MEDIUM", preventivePlan: "Motorista reserva e rota alternativa" },
  { description: "Excesso de convidados além da capacidade do espaço", category: "Convidados", probability: "média", impact: "alto", level: "HIGH", preventivePlan: "Monitorar RSVP e lista de espera" },
  { description: "Desistências de última hora", category: "Convidados", probability: "alta", impact: "baixo", level: "MEDIUM", preventivePlan: "Lista de espera ativa" },
  { description: "Restrições alimentares não informadas a tempo", category: "Alimentação", probability: "média", impact: "médio", level: "MEDIUM", preventivePlan: "Campo obrigatório no RSVP e follow-up" },
  { description: "Problema de saúde do casal ou de convidados-chave", category: "Saúde", probability: "baixa", impact: "alto", level: "HIGH", preventivePlan: "Kit de emergência e contato médico local" },
  { description: "Perda de documento importante", category: "Documentação", probability: "baixa", impact: "alto", level: "MEDIUM", preventivePlan: "Cópias digitais e responsável designado" },
  { description: "Atraso em pagamento a fornecedor", category: "Financeiro", probability: "média", impact: "médio", level: "MEDIUM", preventivePlan: "Alertas de vencimento no sistema" },
  { description: "Cancelamento do espaço", category: "Fornecedores", probability: "baixa", impact: "crítico", level: "CRITICAL", preventivePlan: "Contrato com cláusulas claras e reserva de contingência" },
  { description: "Dano em item alugado", category: "Decoração", probability: "baixa", impact: "médio", level: "MEDIUM", preventivePlan: "Vistoria de entrada/saída e seguro quando disponível" },
  { description: "Problemas de viagem na lua de mel", category: "Viagem", probability: "baixa", impact: "médio", level: "MEDIUM", preventivePlan: "Seguro viagem e documentação em dia" },
];
