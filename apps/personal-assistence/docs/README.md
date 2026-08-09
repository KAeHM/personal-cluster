# Time Tracker — Documentação

Aplicação web para apontamento de horas e gestão de tarefas. Registre o ciclo de vida das tarefas pelo dashboard e acompanhe métricas consolidadas.

## Documentos

| Doc | Conteúdo |
| --- | -------- |
| [01 — Arquitetura](./01-architecture.md) | Visão geral (desatualizado parcialmente) |
| [02 — Schema](./02-database-schema.md) | Banco de dados |
| [04 — Design system](./04-design-system.md) | UI |
| [06 — Variáveis de ambiente](./06-env-vars.md) | Env vars |

## Stack

- **Web:** Next.js 16, React 19, Drizzle, Postgres, NextAuth
- **Deploy:** Kubernetes (personal-cluster), ArgoCD, Tailscale ingress

## API (dashboard)

| Rota | Uso |
| ---- | --- |
| `/api/tasks` | CRUD de tarefas |
| `/api/dashboard` | Dados do dashboard |
| `/api/contexts` | Contextos de trabalho |
| `/api/finances` | Overview de caixinhas e movimentações |
| `/api/finances/boxes` | CRUD de caixinhas |
| `/api/auth/[...nextauth]` | Autenticação |
