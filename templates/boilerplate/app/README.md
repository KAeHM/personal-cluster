# Boilerplate Web

Template base para iniciar novos projetos web. A `main` já vem com a **stack default**
montada — **Drizzle + Postgres + NextAuth (Credentials)** — sobre uma arquitetura DDD-lite
com Ports & Adapters. É o padrão que mais reuso; cada projeto novo parte daqui com um CRUD
real funcionando e as convenções no lugar.

> **Derivar um projeto (produto):** use **Use this template** no GitHub — não fork nem clone
> para histórico limpo. Roteiro completo em
> [`docs/derive-project.md`](docs/derive-project.md) (`PROJECT.md`, rebrand, IA).
>
> **Setup GitHub** (branch protection, Actions, GHCR): [`docs/github-setup.md`](docs/github-setup.md).

> **Workflow (branch por feature):** a `main` é a base estável (arquitetura + stack default +
> CRUD de usuários). Novas funcionalidades entram em branches a partir da `main`. Como tudo
> passa por **ports/seams** (`infrastructure`), trocar uma peça da stack (outro ORM, outro
> provider de auth) é implementar outro adapter e apontar o factory — sem tocar em
> `domain`/`application`.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript 5** (strict)
- **Tailwind CSS 4**
- **Drizzle ORM** + **Postgres**
- **NextAuth / Auth.js v5** (Credentials, sessão JWT)
- **argon2** (hashing de senha)
- **ESLint 9**

> ⚠️ Esta versão do Next tem mudanças importantes em relação a versões anteriores.
> Consulte os guias em `node_modules/next/dist/docs/` antes de escrever código.

## Arquitetura

O código segue um layering inspirado em DDD (DDD-lite). Cada **feature** vive em
`src/modules/<feature>` e é dividida em 4 camadas com responsabilidades claras:

| Camada           | Responsabilidade                                              | Pode importar |
| ---------------- | ------------------------------------------------------------- | ------------- |
| `domain`         | Tipos e contratos puros (entidades, ports). Sem SDK/framework | nada          |
| `application`    | Regra de negócio e orquestração (use cases, schemas, guards)  | `domain`      |
| `infrastructure` | Detalhes de implementação (SDKs, adapters, integrações)       | `domain`      |
| `presentation`   | UI e entrada/saída (components, hooks, server actions)        | `application` |

Direção de dependência (sentido único):

```
presentation → application → domain ← infrastructure
```

### Estrutura de pastas

```
src/
  app/            # Next.js App Router (rotas, layout, /api)
  common/         # infra e UI genuinamente compartilhadas (sem domínio)
    adapters/     # http (api-key, error-response), db (client Drizzle), logger
    components/   # layouts, ui
    env.ts        # validação de variáveis de ambiente (Zod)
    errors/  utils/
  modules/        # features, cada uma em DDD-lite
    auth/         # autenticação (NextAuth + credentials) — ver modules/auth/README.md
    users/        # CRUD de usuários — ver modules/users/README.md
```

- **`common`** guarda só o que é transversal e **sem regra de negócio** (cliente de banco,
  logger, helpers HTTP, componentes de UI base). Nada específico de domínio entra aqui.
- **`modules`** guarda as features. Cada módulo é dono da própria fronteira, incluindo a sua
  `infrastructure` (integrações de um módulo vivem dentro dele, não em `common`).

Alias de import: `@/*` aponta para `src/*` (ex.: `@/modules/auth`).

> **Atenção a imports em Client Components:** não importe um barrel de módulo
> (`@/modules/users`) dentro de um `"use client"` — ele arrasta código server-only (Drizzle,
> NextAuth) para o bundle. Em client, importe tipos/valores puros do `domain` e Server Actions
> direto do arquivo `"use server"`.

## Dados e autenticação (Ports & Adapters)

Tanto o acesso a dados quanto a auth passam por **ports**: a aplicação consome só as ports
(`@/modules/<m>` / `@/modules/auth`) e nunca importa um client de banco ou SDK de provider em
regra de negócio. Na `main` os factories já retornam as implementações da stack default.

- **Dados:** padrão (port → adapter → factory) em
  [`src/common/adapters/db/README.md`](src/common/adapters/db/README.md); CRUD real em
  `modules/users`.
- **Auth:** arquitetura, regras e passo a passo em
  [`src/modules/auth/README.md`](src/modules/auth/README.md).

### CRUD de usuários (referência)

O módulo `users` é o exemplo end-to-end do padrão, com **duas entradas para o mesmo use case**:

- **Server Action** (interno, autenticado por sessão): `modules/users/presentation/actions`.
- **Route Handler** (API externa, autenticada por API key): `app/api/v1/users`.

Ambos validam input com o mesmo schema Zod (`application/schemas`) e chamam os mesmos use
cases (`application/use-cases`).

## Observabilidade

Logs estruturados (Pino + next-logger), traces OpenTelemetry e erros tipados com
correlação servidor/cliente.

- **Logger:** padrão e setup em [`src/common/adapters/logger/README.md`](src/common/adapters/logger/README.md)
- **Erros tipados:** catálogo, helpers e UI em [`src/common/errors/README.md`](src/common/errors/README.md)
- **Demo:** rota [`/preview`](src/app/preview/page.tsx) — `?fail=1` (digest) e `?fail=known` (AppError)
- **Documentação de erros:** `npm run errors:doc` gera [`docs/errors.md`](docs/errors.md)

Variáveis de ambiente: ver [`.env.example`](.env.example). Validação em [`src/common/env.ts`](src/common/env.ts).

## IA / Cursor

Este repo inclui orientação para agentes de código:

- **[`AGENTS.md`](AGENTS.md)** — hub global (stack, regras, índice)
- **[`.cursor/rules/`](.cursor/rules/)** — regras versionadas (aplicadas por pasta no Cursor)
- **[`docs/agents/`](docs/agents/)** — guias por especialidade (architect, modules, auth, API, testes, DevOps)

Ao derivar um produto, copie [`PROJECT.md.example`](PROJECT.md.example) → `PROJECT.md` e ative
[`.cursor/rules/project.mdc.example`](.cursor/rules/project.mdc.example) — ver
[`docs/derive-project.md`](docs/derive-project.md).

## Primeiros passos (após clonar)

1. **Instale as dependências:**

   ```bash
   npm install
   ```

2. **Configure o ambiente:**

   ```bash
   cp .env.example .env.local
   # preencha DATABASE_URL e gere AUTH_SECRET:
   npx auth secret
   ```

3. **Suba o schema e popule dados de exemplo:**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Rode o servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000). Faça login em `/login` com o usuário
   do seed (`admin@example.com` / `admin1234`) e gerencie usuários em `/preview`.

## Setup do GitHub (monorepo)

No repositório `personal-cluster`, a configuração é **uma vez** na raiz — detalhes em
[`docs/github-setup.md`](docs/github-setup.md). Para criar uma app:

```bash
./scripts/new-app.sh <slug>   # na raiz do monorepo
```

Deploy no cluster: [`docs/cluster-deploy.md`](docs/cluster-deploy.md).

## Scripts

| Comando                    | Descrição                          |
| -------------------------- | ---------------------------------- |
| `npm run dev`              | Servidor de desenvolvimento        |
| `npm run build`            | Build de produção                  |
| `npm run start`            | Sobe o build de produção           |
| `npm run lint`             | Lint com ESLint                    |
| `npm run typecheck`        | Checagem de tipos (`tsc --noEmit`) |
| `npm run test`             | Testes unitários (Vitest)          |
| `npm run test:watch`       | Testes em modo watch               |
| `npm run test:coverage`    | Testes com cobertura               |
| `npm run test:integration` | Integração (Testcontainers)        |
| `npm run test:e2e`         | E2E (Playwright)                   |
| `npm run format`           | Formata o código (Prettier)        |
| `npm run format:check`     | Checa formatação sem alterar       |
| `npm run db:generate`      | Gera migration a partir do schema  |
| `npm run db:migrate`       | Aplica migrations                  |
| `npm run db:studio`        | Drizzle Studio                     |
| `npm run db:seed`          | Popula dados de exemplo            |
| `npm run errors:doc`       | Gera `docs/errors.md`              |

## DevOps

- **Makefile** (wrapper fino sobre os `npm scripts`, paridade dev/CI): `make help` lista os
  targets. O portão de qualidade é `make check` (format-check + lint + typecheck +
  test-coverage + build).
- **Testes** em três camadas:
  - **Unit** (Vitest): lógica de `domain`/`application` + helpers puros, com os ports
    mockados (use cases de `users`, guards de sessão, `verifyCredentials`, guard de API
    key e helpers de erro). `make test`. A cobertura é medida só sobre esse núcleo e o
    `make check` aplica threshold mínimo de **90%** — o CI falha se cair abaixo.
  - **Integração** (Vitest + Testcontainers): os repositórios Drizzle contra um Postgres
    real e efêmero (sobe/derruba sozinho; precisa de Docker), aplicando as migrations
    versionadas. `make test-integration`.
  - **E2E** (Playwright): smoke de `health`/`ready`/`metrics` + fluxo de login. `make
test-e2e` (precisa de build + banco migrado/seedado; ou aponte `E2E_BASE_URL`).
- **CI** (`.github/workflows/<slug>-ci.yaml` no monorepo): dispara em **PRs** com paths
  `apps/<slug>/**`. Jobs: `check`, `migrate`, `integration` e `e2e`.
- **CD** (`.github/workflows/<slug>-deploy.yaml`): em push na `master`, build + push da
  imagem `ghcr.io/kaehm/personal-cluster/<slug>-web:sha-xxxxxxx` e auto-commit em
  `infra/<slug>/web-app.yaml`. ArgoCD sincroniza o cluster.
- **Hooks** (husky + lint-staged): pre-commit roda `eslint --fix` + `prettier` nos arquivos
  staged; **pre-push** roda `typecheck` + testes unitários.
- **Docker** (self-host): build standalone em [`Dockerfile`](Dockerfile);
  [`docker-compose.yml`](docker-compose.yml) sobe `db` + `migrate` + `app` (com healthcheck).

  ```bash
  AUTH_SECRET="$(npx auth secret | tr -d '\n')" make docker-up
  ```

- **Probes:** `GET /api/health` (liveness, não toca no banco) e `GET /api/ready`
  (readiness — checa o Postgres com `select 1`, devolve 503 se indisponível).
- **Observabilidade:** logs Pino estruturados (correlacionados a `trace_id`); traces
  OpenTelemetry exportados via OTLP quando `OTEL_EXPORTER_OTLP_ENDPOINT` aponta para um
  collector/backend; métricas Prometheus em `GET /api/metrics` (default do Node +
  `http_requests_total`/`http_request_duration_seconds`). Backends (Tempo/Prometheus)
  ficam no cluster — a app só expõe os dados.
- **Node:** versão fixada em [`.nvmrc`](.nvmrc) e em `engines` (`>=22`).
- **Licença:** [`LICENSE`](LICENSE) (MIT). Templates de PR/issue em `.github/`. Auto-merge
  do Dependabot (patch/minor) após CI — requer [config no GitHub](docs/github-setup.md).
