# WhatsApp Time Tracker — Documentação

Aplicação para apontamento de horas e gestão de tarefas via WhatsApp utilizando linguagem natural. O sistema interpreta mensagens do usuário, extrai intenções através de Function Calling com LLMs e registra o ciclo de vida das tarefas, exibindo os dados consolidados em um painel web.

## Índice

| Doc | Conteúdo |
|-----|----------|
| [01 — Arquitetura](./01-architecture.md) | Stack, rotas, fluxos e estrutura de pastas |
| [02 — Banco de Dados](./02-database-schema.md) | Schema PostgreSQL, Drizzle ORM, Neon |
| [03 — Ferramentas de IA](./03-ai-tools.md) | Agent, tools, system prompt, casos de borda |
| [04 — Design System](./04-design-system.md) | Fontes, paleta, ícones, componentes |
| [05 — Docker (Dev)](./05-docker-dev.md) | Evolution API via Docker Compose |
| [06 — Variáveis de Ambiente](./06-env-vars.md) | Referência completa de env vars |

## Stack

- **Framework:** Next.js 16 (App Router)
- **Banco:** PostgreSQL via Neon
- **ORM:** Drizzle
- **Auth:** NextAuth.js
- **IA:** Vercel AI SDK + Google Gemini
- **WhatsApp:** Evolution API (Docker em dev)
- **UI:** Tailwind CSS 4 + shadcn/ui + Magic UI

## Rotas (MVP)

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Reservada — sem conteúdo no MVP |
| `/auth` | Público | Login / registro (NextAuth) |
| `/dashboard` | Protegido | Painel de timesheet |
| `/api/webhooks/whatsapp` | Webhook | Recebe mensagens da Evolution API |
| `/api/debug/agent` | Debug | Testa agente IA (dev only) |
