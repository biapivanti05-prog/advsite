# Casório — Plataforma de Gestão de Casamento

Documento de arquitetura e planejamento, escrito antes da implementação, conforme a especificação recebida (seção 41).

## 1. Stack escolhida e justificativa

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Full-stack em um único projeto (UI + backend via Server Actions/Route Handlers), SSR/streaming para dashboards com muitos dados, ecossistema maduro, fácil deploy, comunidade grande → manutenção de longo prazo mais barata que separar front/back. |
| Estilo | **Tailwind CSS v4 + componentes próprios (estilo shadcn)** | Consistência visual rápida sem carregar um design system pesado; fácil customizar paleta/tema por casal (seção 36). |
| ORM / Banco | **Prisma ORM + SQLite (dev) → PostgreSQL (produção)** | Prisma migrations dão histórico versionado do schema (requisito 6 da seção 37). SQLite roda sem infra externa neste ambiente (arquivo `dev.db`), mas o schema é 100% portável: basta trocar `provider` e `DATABASE_URL` para apontar a um Postgres gerenciado (Neon/Supabase/RDS) em produção — nenhuma mudança de código. |
| Autenticação | **Auth.js (NextAuth v5) com Credentials Provider + bcrypt** | Sessão JWT, fácil adicionar provedores OAuth depois (Google) sem redesenho. Senhas nunca em texto puro (`bcryptjs`, custo 12). |
| Autorização | **RBAC próprio** (tabela `Membership` casal↔usuário↔papel + `PermissionOverride` por módulo) | Atende à exigência de permissões por módulo/funcionalidade/item (seção 3) sem depender de biblioteca externa opaca. |
| Gráficos | **Recharts** | Leve, responsivo, biblioteca React idiomática. |
| Formulários/validação | **React Hook Form + Zod** | Validação client+server compartilhando o mesmo schema Zod (segurança: nunca confiar só no client). |
| Datas | **date-fns** | Cálculo de contagem regressiva, prazos, recorrências. |
| Mutações | **Server Actions** | Elimina camada de API REST redundante para CRUDs internos; menos boilerplate, mais fácil de manter. Route Handlers (`/api/...`) reservados para RSVP público e futuras integrações/exports. |

### Por que não X?
- **Postgres já em dev**: exigiria provisionar um serviço externo neste ambiente efêmero; SQLite com Prisma é "banco real" (ACID, SQL, migrations) e a troca para Postgres é uma linha de configuração — documentado no README.
- **Firebase/Supabase gerenciado**: acopla a aplicação a um vendor específico e dificulta customizar RBAC granular exigido na seção 3.

## 2. Arquitetura

```
src/
  app/                      # rotas (App Router)
    (public)/rsvp/[code]/   # RSVP público, sem login
    (auth)/login/
    (app)/dashboard/
    (app)/tarefas/
    (app)/cronograma/
    (app)/convidados/
    (app)/financeiro/
    (app)/fornecedores/     # fase 2
    (app)/...               # demais módulos, fase 2-4
    api/...                 # webhooks, export, RSVP actions
  components/
    ui/                     # botão, card, badge, progress, dialog...
    charts/
    layout/                 # sidebar, topbar, shell
  server/
    actions/                # server actions por módulo (tasks.ts, guests.ts...)
    auth.ts                 # config Auth.js
    permissions.ts          # checagem de RBAC
    db.ts                   # cliente Prisma singleton
  lib/                      # helpers (datas, formatação, cálculo de progresso)
prisma/
  schema.prisma
  seed.ts
docs/
  PLANNING.md (este arquivo)
```

Princípios:
- **Sempre executável**: cada fase termina em um estado que builda e roda (`npm run build`).
- **Multi-tenant leve**: tudo pendura de um registro `Wedding` (permite, no futuro, hospedar vários casamentos na mesma instância, ex. para uma assessoria usar o sistema com vários clientes).
- **Auditoria nativa**: toda mutação relevante grava em `ChangeLog` (usuário, data/hora, campo, valor anterior/novo) — seção 3.
- **Privacidade por padrão**: dados de convidados nunca expostos em rotas públicas; RSVP público só enxerga o próprio registro via token opaco (UUID), nunca lista outros convidados.

## 3. Modelo de dados (visão geral)

Entidades centrais do `prisma/schema.prisma` (nomes em inglês por convenção de código, labels em PT-BR na UI):

**Identidade & acesso**: `User`, `Wedding`, `Membership` (papel: OWNER, PLANNER, COLLABORATOR, VIEWER), `PermissionOverride`, `ChangeLog`.

**Planejamento**: `Task`, `Subtask`, `Checklist`/`ChecklistItem`, `Comment`, `Tag`, `TaskTag`, `TimelinePhase` (as 15 fases da seção 5).

**Convidados**: `Family`, `Guest`, `GuestTag`, `Invitation`, `RsvpResponse`, `Table`, `Seat`.

**Financeiro**: `BudgetCategory`, `Budget`, `Expense`, `Installment`, `Payment`, `Account`, `Card`, `FundingSource`.

**Fornecedores/contratos**: `Vendor`, `VendorProposal`, `Contract`, `Document`.

**Operacional (fases 3-4)**: `CeremonyItem`, `ReceptionItem`, `DecorItem`, `Outfit`, `BeautyAppointment`, `Playlist/MusicItem`, `Lodging`, `Transport`, `HoneymoonItem`, `Gift`, `Decision`, `Risk`, `Event` (chá de panela, etc.), `AgendaItem`, `Notification`, `Attachment`.

Todas as entidades com `id`, `createdAt`, `updatedAt`, `weddingId` (isolamento por casamento) e, quando aplicável, `createdById`.

O schema completo (fase 1 já cria todas as tabelas — mesmo as usadas só nas fases seguintes — para não exigir migrations destrutivas depois) fica em `prisma/schema.prisma`.

## 4. Mapa de telas

1. `/login` — autenticação
2. `/dashboard` — visão geral (seção 4)
3. `/tarefas` — lista + kanban + detalhe
4. `/cronograma` — timeline/lista/calendário/por categoria
5. `/convidados` — lista, filtros, detalhe, mesas (mesas na fase 3)
6. `/financeiro` — orçamento, despesas, parcelas, relatórios
7. `/fornecedores` *(fase 2)*
8. `/contratos-documentos` *(fase 2)*
9. `/rsvp/[code]` *(público, fase 2)*
10. `/agenda` *(fase 2)*
11. `/relatorios` *(fase 2)*
12. `/mesas`, `/cerimonia`, `/recepcao`, `/decoracao`, `/roupas`, `/musica`, `/buffet`, `/dia-do-casamento` *(fase 3)*
13. `/hospedagem`, `/transporte`, `/lua-de-mel`, `/presentes`, `/riscos` *(fase 4)*
14. `/configuracoes` — dados do casamento, tema, usuários e permissões (transversal)

## 5. Fases de implementação

- **Fase 1 (esta entrega)**: autenticação + RBAC básico, configuração do casamento, dashboard, tarefas, cronograma regressivo completo (seed 13/07/2026→07/10/2028), convidados, financeiro básico. **Sistema funcional de ponta a ponta.**
- **Fase 2**: fornecedores, contratos, documentos, RSVP público, agenda, relatórios exportáveis.
- **Fase 3**: mapa de mesas drag-and-drop, cerimônia, recepção, decoração, roupas, beleza, música, buffet, planejamento do dia.
- **Fase 4**: hospedagem, transporte, lua de mel, presentes, riscos/contingência, resumos automáticos, notificações.
- **Fase 5**: refinamento de UX/acessibilidade, testes automatizados, exportações PDF/Excel, otimização e documentação final.

## 6. Definição do MVP (Fase 1)

Um casal consegue, sozinho:
1. Criar conta e configurar o casamento (nomes, data, local, orçamento total).
2. Ver o dashboard com contagem regressiva, progresso e alertas.
3. Gerenciar tarefas próprias e as 300+ tarefas do cronograma pré-carregado, com status/prioridade/prazo.
4. Cadastrar e filtrar convidados, acompanhar confirmações.
5. Registrar orçamento por categoria, despesas, parcelas e ver quanto já pagaram/falta pagar.

Isso já entrega valor real (substitui planilhas), com arquitetura pronta para as fases seguintes sem retrabalho.
