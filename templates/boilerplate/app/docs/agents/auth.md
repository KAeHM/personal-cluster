# Agent: Auth

Leia também: [`src/modules/auth/README.md`](../../src/modules/auth/README.md).

## Modelo

- **Perfil** (`users`) ≠ **credenciais** (`auth` / tabela `credentials`).
- Sessão: NextAuth JWT (não persiste sessão no banco na main).
- Login: `verifyCredentials` → NextAuth `authorize` → callbacks injetam `role`.

## API pública

```ts
import { requireAuth, requireRole, getSession } from "@/modules/auth";
```

Guards lançam `AUTH_ERRORS` — a presentation decide redirect/UI.

## Onde não mexer sem motivo

- `infrastructure/session/providers/nextauth/config.ts` — wiring do provider.
- Trocar provider = novo adapter + factory, não alterar use cases.

## Server Actions

- `signInAction` / `signOutAction` em `presentation/actions/auth.actions.ts`.
- Client: import direto do arquivo de actions + `types.ts`.
