# Deploy no cluster (monorepo)

Fluxo para apps derivadas do boilerplate dentro do repositório `personal-cluster`.

## Criar uma nova app

```bash
./scripts/new-app.sh meu-produto
# ou com host Tailscale customizado:
./scripts/new-app.sh meu-produto --host meu-produto.tail412374.ts.net
```

O script gera:

| Destino | Conteúdo |
| ------- | -------- |
| `apps/<slug>/` | Código Next.js (cópia do template) |
| `infra/<slug>/` | Namespace, Postgres, web-app, scripts de secrets |
| `.github/workflows/<slug>-ci.yaml` | CI em PRs |
| `.github/workflows/<slug>-deploy.yaml` | Build GHCR + bump de imagem no manifest |
| `infra/argocd-apps/<slug>.yaml` | Application ArgoCD |

## Secrets

```bash
cd infra/meu-produto
cp scripts/secrets.template secrets.local.yaml
# Edite: POSTGRES_PASSWORD, AUTH_SECRET, API_KEY
./scripts/seal-secrets.sh
```

Commit `sealed-secret.yaml`. **Nunca** commite `secrets.local.yaml` (está no `.gitignore`).

## Deploy

1. Push na branch `master` com paths em `apps/<slug>/`
2. GitHub Actions builda `ghcr.io/kaehm/personal-cluster/<slug>-web:sha-xxxxxxx`
3. Workflow atualiza `infra/<slug>/web-app.yaml` e faz auto-commit
4. ArgoCD sincroniza o namespace da app

## Observabilidade

Pré-configurado no manifest gerado:

- **Logs:** stdout JSON (Pino) → Alloy → Loki
- **Métricas:** `/api/metrics` com annotations Prometheus no Service
- **Traces:** OTLP → `http://alloy.monitoring.svc.cluster.local:4318`

Consulte [`infra/observability/README.md`](../../../infra/observability/README.md) para queries e validação.

## URL

Após sync: `https://<slug>.tail412374.ts.net` (ou host passado em `--host`).

Login seed (dev): `admin@example.com` / `admin1234` — troque em produção.
