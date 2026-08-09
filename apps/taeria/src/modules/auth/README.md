# Módulo `auth`

Autenticação isolada atrás de um **Facade** + **Adapters** (Ports & Adapters). O resto da
aplicação consome só a API pública (`@/modules/auth`) e **nunca** importa o SDK do Supabase
direto.

> **Stack:** Supabase Auth com sessão via cookies (`@supabase/ssr`). Perfis em `profiles`
> (vinculados a `auth.users`). Trocar de provider = novo adapter em
> `infrastructure/session/providers/` + factory.

## Estrutura (DDD-lite)

```
modules/auth/
  domain/
    session/
      session.ts               # AuthUser, AuthSession
      auth-provider.port.ts    # Port: contrato mínimo de um provider de sessão
    errors.ts                  # AUTH_ERRORS
  application/
    session/
      facade.ts                # getSession / getCurrentUser / signOut
      guards.ts                # requireAuth / requireRole
  infrastructure/
    session/
      factory.ts               # entrega o AuthProviderPort (Supabase)
      providers/supabase/      # adapter da AuthProviderPort
  presentation/
    actions/auth.actions.ts    # signInAction / signOutAction
  index.ts
```

## Fluxo de login

1. `signInAction` chama `supabase.auth.signInWithPassword`.
2. Cookies de sessão gerenciados por `@supabase/ssr`.
3. `getSession` lê usuário via `auth.getUser()` + perfil em `profiles`.
4. `proxy.ts` renova a sessão em cada request.

## API pública

```ts
import {
  requireAuth,
  requireRole,
  getSession,
  getCurrentUser,
  signInAction,
  signOutAction,
} from "@/modules/auth";
```

## Callback OAuth

Rota `/auth/callback` para fluxos PKCE/OAuth futuros.
