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

Painel web (Tailscale): **https://evolution-personal-assistence.tail412374.ts.net/manager**

Use a `EVOLUTION_API_KEY` do secret no header `apikey` ou na UI do manager.

Após o ArgoCD sincronizar o Ingress, crie/configure a instância:

```bash
cd apps/personal-assistence
cp .env.example .env
# EVOLUTION_API_KEY, EVOLUTION_INSTANCE, WEBHOOK_SECRET — iguais ao sealed secret
# WEBHOOK_URL=http://web-app.personal-assistence.svc.cluster.local/api/webhooks/whatsapp
# EVOLUTION_API_URL=https://evolution-personal-assistence.tail412374.ts.net

./scripts/setup-evolution.sh
```

Ou conecte pelo manager no browser e escaneie o QR Code.

**Webhook no cluster:** use sempre a URL **interna** (`http://web-app.personal-assistence.svc.cluster.local/...`).
A URL Tailscale só funciona de fora do cluster; a Evolution roda dentro e não resolve o hostname.

**Evolution API:** imagem `atendai/evolution-api:v2.2.3` (open source, sem licença).
JIDs `@lid` na resposta são tratados na web-app (`remoteJidAlt` → número real).
Não use `evoapicloud/evolution-api` — exige ativação comercial (`LICENSE_REQUIRED`).

## 5. WhatsApp self-test (pré-produção)

`WHATSAPP_SELF_TEST_MODE=true` está habilitado no Deployment. Permite testar com self-chat no mesmo
número da instância (mensagem **para você mesmo**, não para contatos).

Configure `WHATSAPP_SELF_PHONE` no sealed secret (DDI + DDD + número, só dígitos) e regenere
`sealed-secret.yaml` se ainda não existir essa chave.

Desative removendo a env var ou setando `WHATSAPP_SELF_TEST_MODE=false` antes de abrir para usuários reais.

## 6. Auth em produção

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
