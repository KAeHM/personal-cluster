# Logger adapter

Adapter de logging estruturado com **Pino**, pensado para ambientes que capturam
**stdout/stderr** (Docker, Kubernetes, Grafana Loki via Alloy/Promtail).

## Stack

- **Pino** — logs JSON da aplicação
- **next-logger** (preset `next-only`) — padroniza logs internos do Next.js sem patchar `console`
- **OpenTelemetry** — mixin injeta `trace_id` / `span_id` do span ativo

## Uso

```ts
import { getLogger } from "@/common/adapters/logger";

const logger = getLogger();

logger.info({ userId: "123" }, "Usuário autenticado");
logger.error({ err: error, code: "AUTH_UNAUTHORIZED" }, "Falha de auth");
```

## Schema de log (campos padrão)

```json
{
  "level": 30,
  "time": 1710000000000,
  "service": "web",
  "env": "production",
  "requestId": "uuid",
  "trace_id": "abc123",
  "span_id": "def456",
  "msg": "mensagem"
}
```

Campos de erro (via `logError`):

```json
{
  "errorId": "uuid",
  "code": "AUTH_UNAUTHORIZED",
  "digest": "next-digest-hash"
}
```

## Variáveis de ambiente

| Variável            | Descrição                                     | Default                       |
| ------------------- | --------------------------------------------- | ----------------------------- |
| `LOG_LEVEL`         | Nível Pino (`debug`, `info`, `warn`, `error`) | `debug` (dev) / `info` (prod) |
| `OTEL_SERVICE_NAME` | Nome do serviço nos logs e traces             | `web`                         |

## Correlação requestId

O [`proxy.ts`](../../proxy.ts) propaga o header `X-Request-ID`. Use
`runWithRequestContext` em Route Handlers ou Server Actions quando precisar de
contexto async explícito:

```ts
import { runWithRequestContext } from "@/common/adapters/logger";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  return runWithRequestContext({ requestId }, async () => {
    // logs aqui incluem requestId automaticamente
  });
}
```

## Queries Loki (exemplos)

No cluster, filtre por namespace Kubernetes e campo `service` do JSON Pino:

```logql
{namespace="meu-app"} | json | service="meu-app-web"
{namespace="meu-app"} | json | errorId="550e8400-e29b-41d4-a716-446655440000"
{namespace="meu-app"} | json | trace_id="..."
```

## Redact

Campos sensíveis são removidos automaticamente: `authorization`, `cookie`, `password`,
`token`, `*.secret`.

## Bootstrap

Inicialização ocorre em [`instrumentation.node.ts`](../../instrumentation.node.ts)
via `initLogger()` + import do preset `next-logger/presets/next-only`.

## Nota Next.js 16 + Turbopack

Se o build falhar com erros de bundling do Pino, use `next build --webpack` ou atualize
para Next >= 16.1 (Pino em `serverExternalPackages` por default).
