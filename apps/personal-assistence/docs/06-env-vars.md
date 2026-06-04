# 06 — Variáveis de Ambiente

Referência completa de variáveis para o projeto.

---

## Arquivos

| Arquivo | Escopo | Commitar? |
|---------|--------|-----------|
| `web/.env.local` | Next.js (dev) | Não |
| `web/.env.production` | Vercel (prod) | Não — configurar no dashboard |
| `.env` (raiz) | Docker Compose | Não |
| `web/.env.example` | Template | Sim |

---

## Next.js (`web/.env.local`)

### Banco de dados

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL | Dev Docker: `postgresql://timetracker:timetracker@localhost:5432/timetracker` / Prod: Neon |

### Auth (NextAuth)

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `AUTH_SECRET` | Sim | Secret para criptografia de sessão | Gerar: `openssl rand -base64 32` |
| `AUTH_URL` | Sim (prod) | URL base da aplicação | `http://localhost:3000` |
| `AUTH_GOOGLE_ID` | Condicional | Client ID Google OAuth | — |
| `AUTH_GOOGLE_SECRET` | Condicional | Client Secret Google OAuth | — |
| `AUTH_RESEND_KEY` | Condicional | API key Resend (magic link) | `re_...` |
| `AUTH_EMAIL_FROM` | Condicional | E-mail remetente | `noreply@seudominio.com` |

### IA (Google Gemini)

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Sim | API key Google AI Studio | `AIza...` |

### WhatsApp (Evolution API)

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `EVOLUTION_API_URL` | Sim | URL base da Evolution API | `http://localhost:8080` |
| `EVOLUTION_API_KEY` | Sim | API key da Evolution | `dev-secret-key-change-me` |
| `EVOLUTION_INSTANCE` | Sim | Nome da instância WhatsApp | `timetracker-dev` |
| `WEBHOOK_SECRET` | Sim | Token para validar webhooks inbound | Gerar: `openssl rand -hex 16` |
| `WHATSAPP_SELF_TEST_MODE` | Não | Self-test: processa só self-chat (`fromMe` + `WHATSAPP_SELF_PHONE`). Respostas com prefixo `[Assistente]`. | `true` |
| `WHATSAPP_SELF_PHONE` | Sim (com self-test) | Seu número WhatsApp (DDI + DDD + número, só dígitos) para identificar self-chat | `5511999999999` |
| `AI_DEBUG` | Não | Logs detalhados do fluxo IA (`[ai:...]` no console). Ativo por padrão em `NODE_ENV=development`. | `true` |

---

## Docker Compose (`.env` na raiz)

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `EVOLUTION_API_KEY` | Sim | Mesma key usada no Next.js | `dev-secret-key-change-me` |
| `WEBHOOK_URL` | Sim | URL do webhook Next.js (setup script) | `http://host.docker.internal:3000/api/webhooks/whatsapp` |
| `WHATSAPP_WEB_VERSION` | Sim | Versão WhatsApp Web (Desktop → Ajuda) | `2.3000.1040323813` |

---

## Template (`web/.env.example`)

```env
# ── Database (Neon) ──
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# ── Auth (NextAuth) ──
AUTH_SECRET=
AUTH_URL=http://localhost:3000

# OAuth (opcional — escolher um provider)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Magic link (opcional — Resend)
AUTH_RESEND_KEY=
AUTH_EMAIL_FROM=noreply@example.com

# ── AI (Google Gemini) ──
GOOGLE_GENERATIVE_AI_API_KEY=

# ── WhatsApp (Evolution API) ──
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=timetracker-dev
WEBHOOK_SECRET=

# Dev only — testar WhatsApp com o mesmo número da instância
# WHATSAPP_SELF_TEST_MODE=true
```

---

## Vercel (produção)

Configurar no dashboard Vercel → Settings → Environment Variables:

| Variável | Environment |
|----------|-------------|
| `DATABASE_URL` | Production, Preview |
| `AUTH_SECRET` | Production, Preview |
| `AUTH_URL` | Production (`https://seu-app.vercel.app`) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Production, Preview |
| `EVOLUTION_API_URL` | Production |
| `EVOLUTION_API_KEY` | Production |
| `EVOLUTION_INSTANCE` | Production |
| `WEBHOOK_SECRET` | Production |

---

## Segurança

- **Nunca** commitar `.env.local` ou `.env` — adicionar ao `.gitignore`
- `AUTH_SECRET` e `WEBHOOK_SECRET` devem ser únicos por ambiente
- `EVOLUTION_API_KEY` deve ser forte em produção
- `GOOGLE_GENERATIVE_AI_API_KEY` com quotas configuradas no Google AI Studio
- Validar `WEBHOOK_SECRET` em todo POST para `/api/webhooks/whatsapp`

---

## Geração de secrets

```bash
# AUTH_SECRET (NextAuth)
openssl rand -base64 32

# WEBHOOK_SECRET
openssl rand -hex 16

# EVOLUTION_API_KEY (dev)
openssl rand -hex 24
```
