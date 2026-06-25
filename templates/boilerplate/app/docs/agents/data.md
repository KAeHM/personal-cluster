# Agent: Data (Drizzle)

Leia também: [`src/common/adapters/db/README.md`](../../src/common/adapters/db/README.md).

## Onde fica cada coisa

| Peça             | Caminho                                                       |
| ---------------- | ------------------------------------------------------------- |
| Client Drizzle   | `src/common/adapters/db/drizzle/client.ts`                    |
| Schema da tabela | `modules/<m>/infrastructure/adapters/drizzle/schema.ts`       |
| Repository       | `modules/<m>/infrastructure/adapters/drizzle/*.repository.ts` |
| Factory          | `modules/<m>/infrastructure/*.factory.ts`                     |
| Migrations SQL   | `drizzle/*.sql` (gerado)                                      |

## Fluxo de alteração de schema

1. Editar `schema.ts` no módulo dono da tabela.
2. `make db-generate` — commitar SQL gerado.
3. `make db-migrate` local; CI valida migrate em Postgres limpo.

## Regras

- `toDomain(row)` no adapter — application só vê tipos de `domain/`.
- FK entre módulos: import relativo no schema (ex.: credentials → users).
- Repositório aceita `db` injetável para testes de integração.
