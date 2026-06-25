# Guia para agentes de IA

Boilerplate **Next.js 16 + Drizzle + Postgres + NextAuth (Credentials)** com arquitetura
**DDD-lite + Ports & Adapters**. Use este arquivo como mapa; regras automáticas por pasta
estão em [`.cursor/rules/`](.cursor/rules/). Detalhes por especialidade em
[`docs/agents/`](docs/agents/).

> **Projeto derivado (produto):** leia [`PROJECT.md`](PROJECT.md) para escopo de negócio;
> deploy no cluster: [`docs/cluster-deploy.md`](docs/cluster-deploy.md).
> Roteiro: [`docs/derive-project.md`](docs/derive-project.md).

## Stack

- Next.js 16 (App Router), React 19, TypeScript strict
- Drizzle ORM + Postgres, NextAuth v5 (JWT + Credentials), argon2, Zod
- Erros tipados (`AppError` + catálogos), Pino, OpenTelemetry, Vitest, Playwright

## Arquitetura (resumo)

```
presentation → application → domain ← infrastructure
```

| Camada           | O quê                                   | Pode importar                   |
| ---------------- | --------------------------------------- | ------------------------------- |
| `domain`         | Entidades, ports, erros do módulo       | nada de infra/SDK               |
| `application`    | Use cases, schemas Zod, guards          | `domain`                        |
| `infrastructure` | Adapters (Drizzle, NextAuth), factories | `domain`                        |
| `presentation`   | Server Actions, componentes             | `application`, `domain` (tipos) |

- **`common/`** — só infra transversal sem domínio (logger, HTTP helpers, client Drizzle).
- **`modules/<feature>/`** — features com as 4 camadas; ver [`users`](src/modules/users/README.md) como referência.

## Regras não negociáveis

1. **Use cases = única regra de negócio.** Server Action e Route Handler só autenticam, validam (Zod) e serializam.
2. **Duas entradas, mesmo service:** interno = sessão (`requireAuth`); externo = API key (`/api/v1`).
3. **Client Components:** não importar barrel de módulo (`@/modules/users`) — puxa server-only. Importar actions direto de `presentation/actions/*.actions.ts` e tipos de `presentation/actions/types.ts`.
4. **Drizzle/NextAuth/postgres** só em `infrastructure` ou `common/adapters`; mapear com `toDomain`.
5. **Erros:** `defineErrorCatalog` no `domain/errors.ts`; APIs usam `errorResponse` / `toClientError`.
6. **Testes unitários:** mockar factories/ports; integração = Testcontainers; E2E = Playwright.
7. **Commits:** Conventional Commits (`feat:`, `fix:`).
8. **Escopo mínimo:** não refatorar nem adicionar código não pedido.

## Onde mexer (índice)

| Tarefa                 | Rule (Cursor)                    | Documentação                                                           |
| ---------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| Visão geral / layering | `global.mdc`, `architecture.mdc` | [`docs/agents/architecture.md`](docs/agents/architecture.md)           |
| Novo módulo / CRUD     | `modules.mdc`                    | [`src/modules/users/README.md`](src/modules/users/README.md)           |
| Banco / migrations     | `drizzle.mdc`                    | [`src/common/adapters/db/README.md`](src/common/adapters/db/README.md) |
| Auth / sessão          | `auth.mdc`                       | [`src/modules/auth/README.md`](src/modules/auth/README.md)             |
| API externa `/api/v1`  | `api.mdc`                        | [`docs/agents/api.md`](docs/agents/api.md)                             |
| UI / Server Actions    | `presentation.mdc`               | [`docs/agents/presentation.md`](docs/agents/presentation.md)           |
| Erros / logging        | `errors.mdc`                     | [`src/common/errors/README.md`](src/common/errors/README.md)           |
| Testes                 | `testing.mdc`                    | [`docs/agents/testing.md`](docs/agents/testing.md)                     |
| CI/CD / deploy         | `devops.mdc`                     | [`docs/cluster-deploy.md`](docs/cluster-deploy.md)                     |

## Comandos úteis

```bash
make help          # todos os targets
make check         # portão de qualidade (CI)
make test          # unit
make test-integration
make db:generate && make db:migrate
```

## Next.js 16

<!-- BEGIN:nextjs-agent-rules -->

This is NOT the Next.js you know. Read guides in `node_modules/next/dist/docs/` before
writing Next.js code. APIs and conventions may differ from your training data.

<!-- END:nextjs-agent-rules -->
