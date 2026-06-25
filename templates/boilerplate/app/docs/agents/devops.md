# Agent: DevOps

Leia também: [`docs/cluster-deploy.md`](../cluster-deploy.md), [`docs/github-setup.md`](../github-setup.md).

## Makefile

Fonte única de comandos — CI chama `make check`, `make db-migrate`, etc.

## CI / CD (monorepo)

| Evento          | Workflow                         | Resultado                              |
| --------------- | -------------------------------- | -------------------------------------- |
| PR              | `.github/workflows/<slug>-ci.yaml` | 4 jobs de qualidade                 |
| Merge `master`  | `.github/workflows/<slug>-deploy.yaml` | imagem `:sha-xxx` + bump manifest |

## Imagens

`ghcr.io/kaehm/personal-cluster/<slug>-web:sha-xxxxxxx`

Manifests em `infra/<slug>/` — ArgoCD Application em `infra/argocd-apps/<slug>.yaml`.

## Observabilidade

Env OTLP → `http://alloy.monitoring.svc.cluster.local:4318`. Métricas em `/api/metrics`.

## GitHub manual

Branch protection, Actions permissions — checklist em `github-setup.md`.

## Hooks

- pre-commit: lint-staged
- pre-push: typecheck + unit tests
