# Agent: Feature modules

Referência canônica: [`src/modules/users/`](../../src/modules/users/README.md).

## Checklist — novo módulo

1. **domain/** — `entity`, repository port, `errors.ts` (`defineErrorCatalog`).
2. **application/schemas/** — Zod compartilhado (Action + API).
3. **application/use-cases/** — funções puras; `throw` erros do catálogo.
4. **infrastructure/adapters/supabase/** — repo + `toDomain`, factory.
5. **presentation/actions/** — `*.actions.ts` + `types.ts` separado.
6. **index.ts** — exports para server; client importa paths diretos.
7. (Opcional) **app/api/v1/** — Route Handler com API key.
8. **supabase/migrations/** — SQL + RLS para novas tabelas.

## Duas entradas

| Entrada       | Auth                          | Resposta                          |
| ------------- | ----------------------------- | --------------------------------- |
| Server Action | `requireAuth` / `requireRole` | `revalidatePath`, estados de form |
| Route Handler | `isValidApiKey`               | JSON + `errorResponse`            |

Ambas chamam **os mesmos use cases** com **os mesmos schemas**.

## Testes

Unit: mock do factory do repositório. Ver `user.use-cases.test.ts`.
