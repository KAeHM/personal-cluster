# Agent: Auth

Leia também: [`src/modules/auth/README.md`](../../src/modules/auth/README.md).

## Modelo

- **Perfil** (`profiles`) vinculado a `auth.users` do Supabase.
- Sessão: Supabase Auth (cookies JWT via `@supabase/ssr`).
- Login: `signInWithPassword` na Server Action → cookies de sessão.

## API pública

```ts
import { requireAuth, requireRole, getSession } from "@/modules/auth";
```

Guards lançam `AUTH_ERRORS` — a presentation decide redirect/UI.

## Onde não mexer sem motivo

- `infrastructure/session/providers/supabase/adapter.ts` — wiring do provider.
- Trocar provider = novo adapter + factory, não alterar use cases.

## Server Actions

- `signInAction` / `signOutAction` em `presentation/actions/auth.actions.ts`.
- Client: import direto do arquivo de actions + `types.ts`.
