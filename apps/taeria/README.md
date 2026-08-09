# Taeria

Companheiro digital do RPG **Taeria** — worldbuild do universo, mesas de jogo e apoio às
sessões. Um mundo proprietário conduzido pelo Mestre, com jogadores administrando seus
personagens nas mesas em que participam.

> **Escopo do produto:** [`PROJECT.md`](PROJECT.md) · **Agentes de IA:** [`AGENTS.md`](AGENTS.md)

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript 5** (strict)
- **Tailwind CSS 4**
- **Supabase Cloud** (Auth, Postgres, Realtime, Storage)
- **Zod**, **Pino**, **OpenTelemetry**, **Vitest**, **Playwright**

> ⚠️ Esta versão do Next tem mudanças importantes em relação a versões anteriores.
> Consulte os guias em `node_modules/next/dist/docs/` antes de escrever código.

## Arquitetura

O código segue um layering inspirado em DDD (DDD-lite). Cada **feature** vive em
`src/modules/<feature>` e é dividida em 4 camadas:

| Camada           | Responsabilidade                                              | Pode importar |
| ---------------- | ------------------------------------------------------------- | ------------- |
| `domain`         | Tipos e contratos puros (entidades, ports). Sem SDK/framework | nada          |
| `application`    | Regra de negócio e orquestração (use cases, schemas, guards)  | `domain`      |
| `infrastructure` | Detalhes de implementação (adapters Supabase, factories)      | `domain`      |
| `presentation`   | UI e entrada/saída (components, hooks, server actions)        | `application` |

```
presentation → application → domain ← infrastructure
```

### Estrutura de pastas

```
src/
  app/            # Next.js App Router (rotas, layout, /api)
  common/         # infra e UI compartilhadas (sem domínio)
    adapters/     # http, supabase, logger
    components/   # layouts, ui
  modules/        # features em DDD-lite
    auth/         # autenticação (Supabase Auth) — ver modules/auth/README.md
    users/        # gestão de contas — ver modules/users/README.md
supabase/
  migrations/     # schema SQL versionado
```

## Dados e autenticação

- **Supabase Cloud** para Auth e Postgres; a app no cluster só consome a API.
- Ports & Adapters: use cases nunca importam SDK direto — ver
  [`src/common/adapters/supabase/README.md`](src/common/adapters/supabase/README.md).
- Auth: [`src/modules/auth/README.md`](src/modules/auth/README.md).

## Primeiros passos

1. **Instale as dependências:**

   ```bash
   npm install
   ```

2. **Crie um projeto no [Supabase Dashboard](https://supabase.com/dashboard)** e vincule a CLI:

   ```bash
   supabase login
   supabase link --project-ref <seu-project-ref>
   ```

3. **Configure o ambiente:**

   ```bash
   cp .env.example .env.local
   # Preencha com URL e chaves do Dashboard → Settings → API
   # Gere API_KEY para consumo externo em /api/v1
   ```

4. **Aplique o schema e popule dados de exemplo:**

   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Rode o servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000). Login em `/login` com o usuário do
   seed (`admin@example.com` / `admin1234`).

## Scripts

| Comando                 | Descrição                           |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento         |
| `npm run build`         | Build de produção                   |
| `npm run lint`          | Lint com ESLint                     |
| `npm run typecheck`     | Checagem de tipos                   |
| `npm run test`          | Testes unitários (Vitest)           |
| `npm run test:coverage` | Testes com cobertura                |
| `npm run test:e2e`      | E2E (Playwright)                    |
| `npm run db:push`       | Aplica migrations no Supabase Cloud |
| `npm run db:seed`       | Popula dados de exemplo             |
| `npm run errors:doc`    | Gera `docs/errors.md`               |

## DevOps

- **Makefile:** `make check` = portão de qualidade (format + lint + typecheck + coverage + build).
- **CI** (monorepo): `.github/workflows/taeria-ci.yaml` em PRs com paths `apps/taeria/**`.
- **CD:** merge na `master` → imagem GHCR + ArgoCD. Ver [`docs/cluster-deploy.md`](docs/cluster-deploy.md).
- **Secrets:** `infra/taeria/scripts/seal-secrets.sh` com chaves do Supabase Cloud.

## IA / Cursor

- [`AGENTS.md`](AGENTS.md) — hub para agentes
- [`.cursor/rules/`](.cursor/rules/) — regras por pasta (inclui `project.mdc` do Taeria)
- [`docs/agents/`](docs/agents/) — guias por especialidade
