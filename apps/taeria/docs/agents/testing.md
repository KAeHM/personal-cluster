# Agent: Testing

## Pirâmide

| Camada     | O quê                              | Comando                 |
| ---------- | ---------------------------------- | ----------------------- |
| Unit       | Use cases, guards, schemas, errors | `make test`             |
| Integração | Repos Supabase (opcional, local)   | `make test-integration` |
| E2E        | Browser + app buildada             | `make test-e2e`         |

## Unit

- Mock factories: `vi.mock("../../infrastructure/user.repository.factory")`.
- Cobertura 90% no núcleo (`domain`/`application` + helpers) — ver `vitest.config.ts`.

## Integração

- `tests/integration/` — placeholder; dev local usa Supabase Cloud (sem suite ativa por padrão).
- CI E2E sobe Supabase local efêmero para testes automatizados.

## E2E

- **Primeira vez (ou após upgrade do `@playwright/test`):** `npm run test:e2e:install` — baixa o Chromium. No WSL, evite `--with-deps` (precisa de sudo); use `test:e2e:install:deps` só em CI/Linux com permissão de root.
- Seed Taeria: `make db-seed` — usuários + kinds (`lyra.vento@camp.dev` / `JogadorTaeria!837`). Não cria entradas do codex.
- Playwright sobe `npm run start` se `E2E_BASE_URL` não estiver setado (requer `npm run build` antes).

## CI

Tudo roda na **PR**; merge na `master` não repete CI (só CD publica imagem).
