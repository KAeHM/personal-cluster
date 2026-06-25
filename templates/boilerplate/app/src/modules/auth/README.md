# Módulo `auth`

Autenticação isolada atrás de um **Facade** + **Adapters** (Ports & Adapters). O resto da
aplicação consome só a API pública (`@/modules/auth`) e **nunca** importa o SDK de um
provider direto.

> **Stack default da main:** NextAuth (Auth.js v5) com **Credentials** provider e sessão
> **JWT**, mais um `CredentialsRepository` e um `PasswordHasher` (argon2) sobre Drizzle +
> Postgres. Como tudo passa pelos seams de `infrastructure` (factories), trocar de provider é
> implementar outro adapter e apontar o factory — sem tocar em `domain`/`application`.

## Estrutura (DDD-lite)

Três concerns, sub-agrupados em cada camada:

- **`session`** — quem está logado (eixo de provider de auth).
- **`credentials`** — armazenamento local de identidade/senha (eixo de adapter de banco).
- **`security`** — primitivas transversais (hashing).

```
modules/auth/
  domain/                      # contratos puros (agnósticos)
    session/
      session.ts               # AuthUser, AuthSession
      auth-provider.port.ts    # Port: contrato mínimo de um provider de sessão
    credentials/
      credentials.ts
      credentials.repository.ts # Port do repo de credenciais
    security/
      password-hasher.ts       # Port de hashing
    errors.ts                  # AUTH_ERRORS
  application/                 # orquestração agnóstica
    session/
      facade.ts                # getSession / getCurrentUser / signOut
      guards.ts                # requireAuth / requireRole
    credentials/
      verify-credentials.ts    # use case (costura repo + hasher)
  infrastructure/              # SEAMS — impl da stack default
    session/
      factory.ts               # entrega o AuthProviderPort (NextAuth)
      providers/nextauth/      # config, handlers e adapter da AuthProviderPort
    credentials/
      factory.ts               # entrega o CredentialsRepository (Drizzle)
      adapters/drizzle/        # schema da tabela + impl do repo
    security/
      password-hasher.ts       # impl da PasswordHasher (argon2)
  presentation/                # server actions (signIn/signOut)
  index.ts                     # superfície pública do módulo
```

## Regras por camada

- **`domain`**: só tipos e interfaces puros. **Proibido** importar SDK, `next/*` ou qualquer
  outra camada. É o contrato estável que todo o resto respeita.
- **`application`**: depende de `domain` e dos seams de `infrastructure`. Regra de negócio
  transversal (guards, use cases). Não importa SDK de provider.
- **`infrastructure`**: o **único** lugar onde SDK de provider (NextAuth, Drizzle) pode ser
  importado. Cada adapter implementa uma port; o factory entrega a impl.
- **`presentation`**: server actions (`signInAction`/`signOutAction`). É aqui que o login
  dispara o `signIn` do NextAuth e o erro dos guards vira UX.

### Direção de dependência (sentido único)

```
presentation → application → domain ← infrastructure
```

`domain` não depende de ninguém. `infrastructure` depende de `domain` (implementa a port).
Outros módulos (ex.: `users`) podem depender de `auth`, nunca o contrário.

## A Port

Contrato mínimo, o "menor denominador comum" que todos os providers suportam:

```ts
interface AuthProviderPort {
  getSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<AuthUser | null>;
  signOut(): Promise<void>;
}
```

**Não** inche essa interface. Recursos que só alguns providers têm (login com senha,
redirect OAuth, magic link) devem ser modelados como **capabilities opcionais** separadas,
implementadas pelo adapter que as suportar — nunca forçadas na port.

## Como funciona a stack default (NextAuth + Credentials)

1. **session**: `infrastructure/session/providers/nextauth/config.ts` configura o NextAuth
   (Credentials, `session.strategy = "jwt"`, callbacks que injetam `role` no token/sessão). O
   `authorize` costura com `verifyCredentials`. O `adapter.ts` satisfaz `AuthProviderPort`
   envolvendo `auth()` (mapeia user/sessão do SDK para os tipos de `domain`).
2. **credentials**: `infrastructure/credentials/adapters/drizzle` tem o schema da tabela
   `credentials` (separada de `users`, ligada por `userId`) e a impl do `CredentialsRepository`.
3. **security**: `infrastructure/security/password-hasher.ts` implementa `PasswordHasher` com
   argon2.
4. **rota**: `app/api/auth/[...nextauth]/route.ts` exporta os handlers; login em `/login`.

### Trocar de provider (numa branch)

Implemente outro adapter em `infrastructure/session/providers/<provider>/` que satisfaça
`AuthProviderPort` e faça `infrastructure/session/factory.ts` retorná-lo. Rotas específicas
(callbacks OAuth, etc.) pertencem ao adapter/projeto.

## Uso

```ts
import { requireAuth, getCurrentUser } from "@/modules/auth";

// Server Component / Route Handler / Server Action
const session = await requireAuth();
const user = await getCurrentUser();
```

> **Em Client Components**, importe Server Actions direto do arquivo `"use server"`
> (`@/modules/auth/presentation/actions/auth.actions`) e tipos do `./types` — nunca o barrel,
> que arrasta código server-only para o bundle.

## Erros tipados

Erros do módulo definidos em [`domain/errors.ts`](domain/errors.ts):

| Código              | HTTP | Quando                            |
| ------------------- | ---- | --------------------------------- |
| `AUTH_UNAUTHORIZED` | 401  | Sessão ausente (`requireAuth`)    |
| `AUTH_FORBIDDEN`    | 403  | Role insuficiente (`requireRole`) |

Os guards lançam `AUTH_ERRORS.create(...)` em vez de `Error` genérico. Na camada de
presentation, mapeie para redirect ou UI conforme o projeto:

```ts
import { isAppError } from "@/common/errors";
import { requireAuth } from "@/modules/auth";

try {
  await requireAuth();
} catch (error) {
  if (isAppError(error) && error.code === "AUTH_UNAUTHORIZED") {
    redirect("/login");
  }
  throw error;
}
```

Documentação completa: [`src/common/errors/README.md`](../../common/errors/README.md).
