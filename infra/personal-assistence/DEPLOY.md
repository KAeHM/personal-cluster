# Deploy — Personal Assistence (Kubernetes)

## Pré-requisitos

- Cluster com ArgoCD, Sealed Secrets e Tailscale Ingress
- `kubectl` e `kubeseal` configurados
- GitHub Actions com permissão de push no repo (para bump de imagem)

## 1. Gerar Sealed Secret

```bash
cd infra/personal-assistence

cp scripts/secrets.template secrets.local.yaml
# Edite secrets.local.yaml — substitua CHANGE_ME por valores reais:
#   openssl rand -base64 32   # AUTH_SECRET
#   openssl rand -hex 24      # POSTGRES_PASSWORD

chmod +x scripts/seal-secrets.sh
./scripts/seal-secrets.sh

git add sealed-secret.yaml
rm secrets.local.yaml
```

## 2. ArgoCD

O app `personal-assistence` em `infra/argocd-apps/` aponta para `infra/personal-assistence/`.
Após commit, o root-app sincroniza automaticamente.

Recursos aplicados:

| Arquivo | Recurso |
| ------- | ------- |
| `namespace.yaml` | Namespace |
| `postgres.yaml` | Postgres StatefulSet |
| `web-app.yaml` | Web app + Service + Ingress |
| `sealed-secret.yaml` | Secrets |

## 3. CI — imagem Docker

Push em `apps/personal-assistence/web/**` na branch `master` dispara
`.github/workflows/personal-assistence-deploy.yaml`:

1. Build da imagem `ghcr.io/kaehm/personal-cluster/personal-assistence-web:<sha>`
2. Atualiza tag em `web-app.yaml` e commita

**Primeiro deploy:** faça push do código web para gerar a imagem antes de sincronizar o Deployment.

## 4. URL

Após sync: **https://personal-assistence.tail412374.ts.net**

Login via `/auth` (Google, magic link ou credenciais conforme configurado nos secrets).

## 5. Migration

O init container `db-migrate` aplica migrations Drizzle automaticamente no deploy.
Nova migration `0008_drop_whatsapp_ai` remove tabelas/colunas de WhatsApp e IA.
