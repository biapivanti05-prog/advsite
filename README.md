# Casório — Plataforma de Gestão de Casamento

Central completa de planejamento e gestão de casamento: cronograma regressivo, tarefas,
convidados, financeiro, fornecedores e muito mais. Veja a arquitetura completa e o
roteiro de fases em [`docs/PLANNING.md`](docs/PLANNING.md).

## Stack

Next.js 16 (App Router) + TypeScript · Prisma ORM + SQLite (dev) · Auth.js v5
(Credentials + bcrypt) · Tailwind CSS v4 · Recharts. Detalhes e justificativas em
`docs/PLANNING.md`.

## Como rodar localmente

Pré-requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env        # ajuste AUTH_SECRET em produção
npm run db:migrate           # cria o banco SQLite e aplica as migrations
npm run db:seed              # popula cronograma completo + dados de demonstração
npm run dev
```

Acesse `http://localhost:3000`. Login de demonstração criado pelo seed:

- **E-mail:** `biapivanti05@gmail.com`
- **Senha:** `casorio2026`

Os demais usuários de exemplo (parceiro(a), assessoria, familiar) usam a mesma senha —
veja seus e-mails em `prisma/seed.ts`. Todos os registros marcados como "(exemplo)" ou
"[Exemplo]" são dados fictícios de demonstração e podem ser excluídos livremente pela
própria interface.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Build de produção (roda type-check) |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Cria/aplica migrations do Prisma |
| `npm run db:seed` | Repopula o banco com o cronograma e dados de exemplo (destrutivo) |
| `npm run db:studio` | Abre o Prisma Studio para inspecionar o banco |

## Variáveis de ambiente

Ver `.env.example`. Em produção, gere um `AUTH_SECRET` forte (`npx auth secret`) e
aponte `DATABASE_URL` para um Postgres gerenciado — o schema do Prisma já é portável,
basta trocar `provider = "sqlite"` por `"postgresql"` em `prisma/schema.prisma`.

## Estado do projeto

Esta é a **Fase 1** de um roteiro de 5 fases (ver seção 5 de `docs/PLANNING.md`):
autenticação e permissões por papel, configuração do casamento, dashboard com
indicadores e gráficos, tarefas (lista + Kanban + subtarefas + checklist +
comentários), cronograma regressivo completo (343+ tarefas pré-carregadas desde
13/07/2026 até 07/10/2028), convidados (CRUD completo, etiquetas, mesas) e financeiro
(orçamento por categoria, despesas, parcelas, pagamentos). A arquitetura de dados já
contempla todos os módulos das fases seguintes (fornecedores, contratos, cerimônia,
decoração, hospedagem, lua de mel, riscos etc.) para permitir evolução sem migrations
destrutivas.

## Segurança

Senhas com hash bcrypt (nunca texto puro), sessão JWT via Auth.js, controle de acesso
por papel (`OWNER`, `PLANNER`, `COLLABORATOR`, `VIEWER`) com possibilidade de exceções
por módulo, e histórico de alterações (`ChangeLog`) registrando usuário, data/hora e
valores antes/depois nas principais entidades.
