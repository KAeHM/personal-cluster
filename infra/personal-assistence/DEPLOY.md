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
#   openssl rand -hex 16        # WEBHOOK_SECRET
#   openssl rand -hex 24        # EVOLUTION_API_KEY, POSTGRES_PASSWORD

chmod +x scripts/seal-secrets.sh
./scripts/seal-secrets.sh

git add sealed-secret.yaml
rm secrets.local.yaml
```

O controller Helm se chama `sealed-secrets` (não `sealed-secrets-controller`).
O script já passa `--controller-name` e `--controller-namespace` corretos.

## 2. ArgoCD

O app `personal-assistence` em `infra/argocd-apps/` aponta para `infra/personal-assistence/`.
Após commit, o root-app sincroniza automaticamente.

## 3. CI — imagem Docker

Push em `apps/personal-assistence/web/**` na branch `master` dispara
`.github/workflows/personal-assistence-deploy.yaml`:

1. Build da imagem `ghcr.io/kaehm/personal-cluster/personal-assistence-web:<sha>`
2. Atualiza tag em `web-app.yaml` e commita

**Primeiro deploy:** faça push do código web para gerar a imagem antes de sincronizar o Deployment.

## 4. Evolution API (WhatsApp)

Após os pods estarem healthy, configure a instância:

```bash
# Na raiz do app
cd apps/personal-assistence
cp .env.example .env
# Preencha EVOLUTION_API_KEY, EVOLUTION_INSTANCE, WEBHOOK_SECRET iguais ao secret
# WEBHOOK_URL=https://personal-assistence.tail412374.ts.net/api/webhooks/whatsapp
# EVOLUTION_API_URL=http://localhost:8080  # via port-forward:

kubectl port-forward -n personal-assistence svc/evolution-api 8080:8080

./scripts/setup-evolution.sh
```

Escaneie o QR Code gerado para conectar o WhatsApp.

## 5. Auth em produção

Configure no secret (opcional):

- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — OAuth Google
- `AUTH_RESEND_KEY` / `AUTH_EMAIL_FROM` — magic link

Sem providers OAuth, o app usa login por e-mail (Credentials) em produção.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `namespace.yaml` | Namespace `personal-assistence` |
| `postgres.yaml` + `postgres-init-configmap.yaml` | Postgres 16 + DB `evolution` |
| `evolution-api.yaml` | Evolution API v2.2.3 |
| `web-app.yaml` | Next.js + Ingress Tailscale |
| `sealed-secret.yaml` | Gerado via `seal-secrets.sh` (não versionado até você criar) |
| `scripts/secrets.template` | Template de variáveis |
