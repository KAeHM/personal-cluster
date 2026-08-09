# Erros tipados

Catálogo de erros conhecidos com tipagem, documentação e helpers para separar o que
vai ao **cliente** do que fica nos **logs do servidor**.

## Dois tipos de erro

| Tipo                            | Quando usar                       | Cliente vê                                               | Servidor loga                       |
| ------------------------------- | --------------------------------- | -------------------------------------------------------- | ----------------------------------- |
| **AppError** (conhecido)        | Validação, auth, negócio esperado | `errorId`, `code`, mensagem segura (se `exposeToClient`) | Stack completo + metadados          |
| **Throw genérico** (inesperado) | Bug, falha externa                | `digest` (Next.js)                                       | Stack completo via `onRequestError` |

## Definir erros por módulo

Cada módulo declara erros em `domain/errors.ts`:

```ts
import { defineErrorCatalog } from "@/common/errors";

export const AUTH_ERRORS = defineErrorCatalog(
  {
    UNAUTHORIZED: {
      code: "AUTH_UNAUTHORIZED",
      httpStatus: 401,
      message: "Autenticação necessária.",
      description: "Sessão ausente ou inválida.",
      severity: "expected",
      exposeToClient: true,
    },
  },
  "auth",
);
```

## Lançar erros

```ts
// Guards / Server Components (erros esperados)
throw AUTH_ERRORS.create("UNAUTHORIZED");

// Com metadados para logs
throw AUTH_ERRORS.create("FORBIDDEN", { meta: { role: "admin" } });
```

## Route Handlers / Server Actions

```ts
import { getHttpStatus, logError, toClientError } from "@/common/errors";

try {
  // ...
} catch (error) {
  logError(error, { route: "/api/users" });
  return Response.json(toClientError(error), {
    status: getHttpStatus(error),
  });
}
```

## Helpers

| Helper                   | Descrição                     |
| ------------------------ | ----------------------------- |
| `logError(err, ctx)`     | Log estruturado server-side   |
| `toClientError(err)`     | Payload seguro para o cliente |
| `getHttpStatus(err)`     | Status HTTP (AppError ou 500) |
| `getErrorReference(err)` | `errorId` ou `digest` para UI |
| `isAppError(err)`        | Type guard                    |

## UI

Use [`ErrorDisplay`](../components/feedback/error-display.tsx) em error boundaries e
páginas de erro. Nunca exponha stack ou mensagens internas em produção.

## Documentação automática

```bash
npm run errors:doc
```

Gera [`docs/errors.md`](../../../docs/errors.md) agregando todos os catálogos.

## Erros comuns (`COMMON_ERRORS`)

| Código              | HTTP | Descrição                     |
| ------------------- | ---- | ----------------------------- |
| `COMMON_INTERNAL`   | 500  | Erro interno não categorizado |
| `COMMON_NOT_FOUND`  | 404  | Recurso não encontrado        |
| `COMMON_VALIDATION` | 422  | Falha de validação            |

Ver também erros do módulo auth em [`modules/auth/README.md`](../../modules/auth/README.md).
