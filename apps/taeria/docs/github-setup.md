# Setup do monorepo (GitHub)

Configuração **uma vez** no repositório `personal-cluster`. Apps derivadas reutilizam os
mesmos workflows e secrets.

> **Nova app:** [`derive-project.md`](derive-project.md) + [`cluster-deploy.md`](cluster-deploy.md).

## Checklist rápido

- [ ] **Branch protection** na `master` (PR obrigatório + status checks por app)
- [ ] **Actions:** permissões read/write + `GITHUB_TOKEN` com packages:write
- [ ] **Allow auto-merge** (Dependabot, se usado)
- [ ] Primeiro fluxo: **branch → PR → CI verde → merge**
- [ ] GHCR: packages `ghcr.io/kaehm/personal-cluster/*-web` acessíveis ao cluster

---

## 1. Branch protection na `master`

**Settings → Branches → Add branch protection rule**

| Regra                                 | Recomendação |
| ------------------------------------- | ------------ |
| Require a pull request before merging | ✅           |
| Require status checks to pass         | ✅           |
| Require branches to be up to date     | ✅           |

**Status checks** — após a primeira PR de cada app, adicione os jobs do workflow
`<slug>-ci.yaml`:

- `Lint, types, testes e build`
- `Migrations aplicam em banco limpo`
- `Testes de integracao (Testcontainers)`
- `Testes E2E (Playwright)`

---

## 2. GitHub Actions

**Settings → Actions → General → Workflow permissions**

- **Read and write permissions**

O `GITHUB_TOKEN` do workflow de deploy já tem `packages: write` via `permissions` no YAML.

---

## 3. GHCR

Cada app publica em:

```text
ghcr.io/kaehm/personal-cluster/<slug>-web:sha-xxxxxxx
```

Após o primeiro deploy bem-sucedido, ajuste visibilidade do package se o cluster precisar pull.

---

## 4. Fluxo por app

```text
Desenvolvimento
  branch → PR → <slug>-ci (4 jobs) → merge na master

Após merge
  <slug>-deploy → imagem :sha-xxx no GHCR
  auto-commit em infra/<slug>/web-app.yaml
  ArgoCD sync → pod no cluster
```

---

## 5. Cursor / agentes de IA

Cada app em `apps/<slug>/` inclui:

- [`AGENTS.md`](../AGENTS.md)
- [`.cursor/rules/`](../.cursor/rules/)
- [`docs/agents/`](../docs/agents/)

Deploy e observabilidade: [`cluster-deploy.md`](cluster-deploy.md).
