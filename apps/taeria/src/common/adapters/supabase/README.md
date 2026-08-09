# Adapters Supabase

Clientes para Auth, Postgres (via API), Realtime e Storage.

| Arquivo         | Uso                                                     |
| --------------- | ------------------------------------------------------- |
| `server.ts`     | Server Components, Server Actions, Route Handlers       |
| `browser.ts`    | Client Components (Realtime, etc.)                      |
| `admin.ts`      | Service role — seed, API externa, use cases server-side |
| `middleware.ts` | Refresh de sessão no `proxy.ts`                         |

Migrations em `supabase/migrations/`. Desenvolvimento e produção usam **Supabase Cloud**:

```bash
supabase link --project-ref <ref>
npm run db:push
npm run db:seed
```
