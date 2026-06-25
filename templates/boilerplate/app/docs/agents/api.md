# Agent: API (Route Handlers)

## Rotas por tipo

| Prefixo        | Uso                     | Auth         |
| -------------- | ----------------------- | ------------ |
| `/api/v1/*`    | API externa (terceiros) | API key      |
| `/api/auth/*`  | NextAuth                | provider     |
| `/api/health`  | Liveness                | nenhuma      |
| `/api/ready`   | Readiness (DB)          | nenhuma      |
| `/api/metrics` | Prometheus              | rede interna |

## Template Route Handler (v1)

```ts
export async function GET(request: Request) {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      if (!isValidApiKey(request)) throw AUTH_ERRORS.create("UNAUTHORIZED");
      const data = await listSomething();
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}
```

POST/PATCH: `safeParse` com schema Zod de `application/schemas`; `COMMON_ERRORS.create("VALIDATION")` se falhar.

## Env

`API_KEY` em `.env` — se ausente, `isValidApiKey` nega (fail-closed).
