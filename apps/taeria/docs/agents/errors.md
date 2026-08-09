# Agent: Errors & logging

Leia também: [`src/common/errors/README.md`](../../src/common/errors/README.md).

## Criar erros no módulo

`domain/errors.ts` com `defineErrorCatalog`:

- `code` estável (ex.: `USER_NOT_FOUND`)
- `httpStatus`, `exposeToClient`, `severity`, `description`

## Lançar

```ts
throw USER_ERRORS.create("EMAIL_TAKEN", { meta: { email } });
```

## Resposta HTTP

`errorResponse` já faz `logError` + `toClientError` + status.

## Logging

- `getEnv()` / Pino em server; correlaciona `trace_id` quando OTEL ativo.
- Não logar senhas/tokens — redaction no Pino.

## Documentação

Após novo catálogo ou chave: `npm run errors:doc`.
