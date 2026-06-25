# Agent: Testing

## Pirâmide

| Camada     | O quê                              | Comando                 |
| ---------- | ---------------------------------- | ----------------------- |
| Unit       | Use cases, guards, schemas, errors | `make test`             |
| Integração | Repos Drizzle + Postgres real      | `make test-integration` |
| E2E        | Browser + app buildada             | `make test-e2e`         |

## Unit

- Mock factories: `vi.mock("../../infrastructure/user.repository.factory")`.
- Cobertura 90% no núcleo (`domain`/`application` + helpers) — ver `vitest.config.ts`.
- `CHANGELOG.md` ignorado no Prettier.

## Integração

- `tests/integration/repositories.test.ts` + Testcontainers.
- Aplica migrations versionadas antes dos testes.

## E2E

- Seed: `admin@example.com` / `admin1234`.
- Playwright sobe `npm run start` se `E2E_BASE_URL` não estiver setado.

## CI

Tudo roda na **PR**; merge na `main` não repete CI (só CD publica imagem).
