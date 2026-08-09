# Derivar um projeto no monorepo

Roteiro para criar uma **app de produto** dentro do repositório `personal-cluster`, mantendo
as convenções do boilerplate (`AGENTS.md`, `.cursor/rules/`).

> **Não crie um repositório separado.** Use `./scripts/new-app.sh` na raiz do monorepo.

---

## Passo 1 — Gerar a app

```bash
./scripts/new-app.sh meu-produto
```

Isso copia `templates/boilerplate/app/` → `apps/meu-produto/` e gera infra + CI/CD.

---

## Passo 2 — Secrets e primeiro deploy

Siga [`cluster-deploy.md`](cluster-deploy.md):

1. Seal secrets em `infra/meu-produto/`
2. Commit + push na `master`
3. Aguarde CI (PR) e CD (merge)

---

## Passo 3 — Identidade do produto (IA e time)

### 1. Criar `PROJECT.md`

```bash
cd apps/meu-produto
cp PROJECT.md.example PROJECT.md
# Edite: nome, descrição, módulos, fora de escopo
```

### 2. Atualizar o topo do `AGENTS.md`

```markdown
# Guia para agentes de IA

**Meu Produto** — app em `apps/meu-produto/` do monorepo personal-cluster.

- **Negócio e escopo:** [`PROJECT.md`](PROJECT.md)
- **Deploy no cluster:** [`docs/cluster-deploy.md`](docs/cluster-deploy.md)
- **Convenções de código:** este arquivo + [`.cursor/rules/`](.cursor/rules/)
```

### 3. Ativar rule de produto no Cursor

```bash
cp .cursor/rules/project.mdc.example .cursor/rules/project.mdc
```

---

## Passo 4 — Ambiente local (Supabase Cloud)

```bash
cd apps/meu-produto
cp .env.example .env.local
supabase link --project-ref <ref>
make db-push && make db-seed && make dev
```

---

## Checklist resumido

- [ ] `./scripts/new-app.sh <slug>` executado
- [ ] Secrets sealed e commitados
- [ ] `PROJECT.md` + `AGENTS.md` atualizados
- [ ] `.cursor/rules/project.mdc` ativado
- [ ] PR com CI verde → merge na `master`
- [ ] App acessível via Tailscale; logs/métricas/traces no Grafana

---

## O que **não** mudar (herança do boilerplate)

- Camadas DDD-lite + Ports & Adapters
- Use cases + duas entradas (Server Action + Route Handler)
- Erros tipados, factories, testes (unit / integração / E2E)
- `make check`, Conventional Commits, CI em PR

---

## Template vs app derivada

|                 | `templates/boilerplate/` | `apps/<slug>/` (produto)    |
| --------------- | ------------------------ | --------------------------- |
| Papel           | Fonte para `new-app.sh`  | App real no monorepo        |
| Deploy          | N/A                      | `infra/<slug>/` + ArgoCD    |
| `PROJECT.md`    | Só `.example`            | `PROJECT.md` preenchido     |
| Observabilidade | Documentada              | Env vars no manifest gerado |
