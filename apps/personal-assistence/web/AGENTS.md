# Guia para agentes de IA

App **Personal Assistence** — controle de tempo e tarefas via dashboard web.
Monorepo: `apps/personal-assistence/web` (Next.js 16 + Drizzle + Postgres + NextAuth).

Regras automáticas por pasta em [`.cursor/rules/`](.cursor/rules/).

## Stack

- Next.js 16 (App Router), React 19, TypeScript strict
- Drizzle ORM + Postgres, NextAuth v5 (Google / Resend / credentials dev)
- Erros tipados (`AppError` + catálogos), Pino, OpenTelemetry, Vitest, Playwright

## Arquitetura (em evolução)

```
presentation (app/, components/) → application (modules/*/application) → lib/ infra
```

| Área                 | Caminho                              | Notas                                             |
| -------------------- | ------------------------------------ | ------------------------------------------------- |
| Use cases de tarefas | `src/modules/tasks/application/`     | Migrado de `lib/tasks/queries.ts`                 |
| Erros de domínio     | `src/modules/tasks/domain/errors.ts` | `TASK_ERRORS`                                     |
| Infra transversal    | `src/common/`                        | erros, logger, métricas HTTP                      |
| Legado               | `src/lib/`                           | dashboard, groups, contexts — migrar gradualmente |

## Regras não negociáveis

1. **Route Handlers** autenticam com `requireSessionUser`, validam com Zod, delegam a use cases, retornam `errorResponse` em catch.
2. **Métricas:** envolver handlers com `withRouteMetrics(method, route, fn)`.
3. **Erros:** `COMMON_ERRORS` / `TASK_ERRORS` via `defineErrorCatalog`; nunca expor stack ao cliente.
4. **Drizzle/postgres** em `lib/db` ou `infrastructure` — não em componentes client.
5. **Escopo mínimo:** não refatorar código não relacionado à tarefa.

## Comandos

```bash
cd apps/personal-assistence/web
make help
make check      # portão de qualidade (CI)
make test
make test-e2e   # precisa build + Postgres migrado
```

## Deploy

Workflow `personal-assistence-deploy.yaml` → imagem GHCR → ArgoCD em `infra/personal-assistence/`.
Probes: `/api/health` (liveness), `/api/ready` (readiness).

## Observabilidade

- Logs: Pino → Alloy → Loki
- Traces: OTLP → Alloy → Tempo
- Métricas: `/api/metrics` (Prometheus scrape via annotation no Service)
