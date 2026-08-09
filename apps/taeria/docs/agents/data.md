# Agent: Data (Supabase)

Leia também: [`src/common/adapters/supabase/README.md`](../../src/common/adapters/supabase/README.md).

## Onde fica cada coisa

| Peça             | Caminho                                                        |
| ---------------- | -------------------------------------------------------------- |
| Clients Supabase | `src/common/adapters/supabase/*.ts`                            |
| Repository       | `modules/<m>/infrastructure/adapters/supabase/*.repository.ts` |
| Factory          | `modules/<m>/infrastructure/*.factory.ts`                      |
| Migrations SQL   | `supabase/migrations/*.sql`                                    |

## Fluxo de alteração de schema

1. Criar migration: `supabase migration new <nome>`
2. Editar SQL em `supabase/migrations/`
3. Aplicar local: `supabase db reset` ou `supabase migration up`
4. Remoto: `supabase db push`

## Regras

- `toDomain(row)` no adapter — application só vê tipos de `domain/`.
- RLS em toda tabela exposta ao client (`public`).
- Repositório server-side usa admin client; autorização nos guards/use cases.
- Realtime: `alter publication supabase_realtime add table <tabela>`.
