# Módulo `users`

CRUD de usuários — o exemplo end-to-end do padrão DDD-lite + Ports & Adapters da `main`.
Mostra **um único service (use cases) consumido por duas entradas**: Server Action (interno)
e Route Handler (API externa).

## Estrutura

```
modules/users/
  domain/                      # contratos puros
    user.ts                    # User, NewUser, UpdateUser
    role.ts                    # UserRole ("admin" | "user")
    user.repository.ts         # Port do repositório
    errors.ts                  # USER_ERRORS
  application/                 # o "service"
    schemas/user.schema.ts     # validação de input (Zod) — fonte única
    use-cases/                 # createUser, listUsers, getUser, updateUser, deleteUser
  infrastructure/
    adapters/supabase/         # impl do UserRepository (tabela profiles)
    user.repository.factory.ts # seam que entrega a impl Supabase
  presentation/
    actions/                   # Server Actions ("use server") + tipos
  index.ts                     # superfície pública
```

## Duas entradas, mesmo use case

```
Server Action (interno, sessão)  ─┐
                                  ├─► use case (application) ─► UserRepository ─► Supabase
Route Handler /api/v1 (externo)  ─┘
```

- **Server Action** (`presentation/actions/user.actions.ts`): autentica por sessão
  (`requireAuth`), valida com Zod, chama o use case, `revalidatePath`.
- **Route Handler** (`app/api/v1/users`): autentica por **API key**, valida com o **mesmo**
  schema Zod, responde JSON via os helpers de erro (`toClientError`/`getHttpStatus`/`logError`).

Os dois diferem só em autenticação e serialização; a regra de negócio fica nos use cases.

## Regras

- `domain` puro (sem Zod, sem Supabase, sem `next/*`).
- Zod vive na `application` (validação de fronteira); os use cases assumem input já válido e
  aplicam regra de negócio (ex.: email único → `USER_EMAIL_TAKEN`).
- Supabase client só na `infrastructure`; o adapter mapeia a linha para `User` (`toDomain`).
- `createUser` cria `auth.users` + `profiles` (trigger) via admin API.

> **Client Components:** importe `User` de `domain/user`, `USER_ROLES` de `domain/role` e as
> Server Actions direto de `presentation/actions/user.actions` — nunca o barrel `@/modules/users`.

## Erros tipados

| Código             | HTTP | Quando                                               |
| ------------------ | ---- | ---------------------------------------------------- |
| `USER_NOT_FOUND`   | 404  | id inexistente (`getUser`/`updateUser`/`deleteUser`) |
| `USER_EMAIL_TAKEN` | 409  | criar com email já cadastrado                        |

Catálogo completo: [`src/common/errors/README.md`](../../common/errors/README.md).
