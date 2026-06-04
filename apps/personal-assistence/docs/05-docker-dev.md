# 05 — Docker (Ambiente de Desenvolvimento)

Stack local via **Docker Compose**: PostgreSQL (app + Evolution) + Evolution API.

---

## Pré-requisitos

- Docker e Docker Compose
- Conta WhatsApp dedicada para testes
- ngrok ou cloudflared (se o Next.js não for acessível pelo container)

---

## Serviços

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `postgres` | 5432 | PostgreSQL com dois bancos: `timetracker` (app) e `evolution` |
| `evolution-api` | 8080 | Evolution API (WhatsApp) |

---

## docker-compose.yml

Localizado na raiz: `personal-assistence/docker-compose.yml`

```bash
# 1. Configurar env na raiz
cp .env.example .env

# 2. Subir containers
docker compose up -d

# 3. Aplicar migrations no banco local
cd web && npm run db:migrate

# 4. Configurar .env.local do Next.js
cp .env.example .env.local
# DATABASE_URL=postgresql://timetracker:timetracker@localhost:5432/timetracker

# 5. Iniciar Next.js
npm run dev
```

---

## Variáveis

### Raiz (`.env`) — Docker Compose

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `EVOLUTION_API_KEY` | API key da Evolution | `dev-secret-key-change-me` |
| `WEBHOOK_URL` | URL do webhook Next.js (setup script) | `http://host.docker.internal:3000/api/webhooks/whatsapp` |
| `WHATSAPP_WEB_VERSION` | Versão WhatsApp Web (Desktop → Ajuda) | `2.3000.1040323813` |

### Web (`web/.env.local`) — App

| Variável | Dev (Docker) | Prod |
|----------|--------------|------|
| `DATABASE_URL` | `postgresql://timetracker:timetracker@localhost:5432/timetracker` | Neon |
| `EVOLUTION_API_URL` | `http://localhost:8080` | URL do servidor Evolution |
| `EVOLUTION_API_KEY` | Mesma da raiz | — |
| `EVOLUTION_INSTANCE` | `timetracker-dev` | — |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Sua key Google AI Studio | — |

---

## Bancos de dados

Um único container Postgres hospeda dois bancos (criados em `docker/postgres/init.sql`):

| Banco | Usuário | Uso |
|-------|---------|-----|
| `timetracker` | `timetracker` / `timetracker` | App Next.js (Drizzle) |
| `evolution` | `evolution` / `evolution` | Evolution API |

---

## Configurar WhatsApp

```bash
chmod +x scripts/setup-evolution.sh
./scripts/setup-evolution.sh
```

Ou manualmente:

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: dev-secret-key-change-me" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"timetracker-dev","integration":"WHATSAPP-BAILEYS","qrcode":true}'

curl -X POST http://localhost:8080/webhook/set/timetracker-dev \
  -H "apikey: dev-secret-key-change-me" \
  -H "Content-Type: application/json" \
  -d '{"webhook":{"enabled":true,"url":"http://host.docker.internal:3000/api/webhooks/whatsapp","webhookByEvents":false,"webhookBase64":true,"headers":{"apikey":"dev-secret-key-change-me"},"events":["MESSAGES_UPSERT"]}}'

curl http://localhost:8080/instance/connect/timetracker-dev \
  -H "apikey: dev-secret-key-change-me"
```

---

## Fluxo completo (dev)

```
1. docker compose up -d
2. cd web && npm run db:migrate
3. npm run dev
4. ./scripts/setup-evolution.sh  → escanear QR Code
5. (Opcional) ngrok http 3000 → atualizar `WEBHOOK_URL` no `.env` da raiz → `./scripts/setup-evolution.sh`
6. Enviar mensagem WhatsApp → webhook → agente → resposta
```

---

## Testar webhook localmente (sem WhatsApp)

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "apikey: dev-secret-key-change-me" \
  -d '{
    "event": "messages.upsert",
    "instance": "timetracker-dev",
    "data": {
      "key": {
        "id": "test-msg-001",
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false
      },
      "pushName": "Dev User",
      "message": { "conversation": "Comecei o relatório mensal" },
      "messageType": "conversation",
      "messageTimestamp": 1740393277
    }
  }'
```

> Requer `GOOGLE_GENERATIVE_AI_API_KEY` configurada. Use `messageId` único a cada teste (idempotência).

---

## Testar com o mesmo número da instância (dev)

Quando a instância Evolution usa o seu número pessoal, ative em `web/.env.local`:

```env
WHATSAPP_SELF_TEST_MODE=true
```

Comportamento:

- Só processa **self-chat**: mensagens `fromMe` enviadas **para você mesmo** (não para contatos)
- Requer `WHATSAPP_SELF_PHONE` com seu número (DDI + DDD, só dígitos)
- Ignora mensagens de terceiros e respostas da assistente (prefixo `[Assistente]`)
- Respostas outbound recebem automaticamente o prefixo `[Assistente]\n` para evitar loop

Exemplo em `web/.env.local`:

```env
WHATSAPP_SELF_TEST_MODE=true
WHATSAPP_SELF_PHONE=5511999999999
```

> Ignorada em produção (`NODE_ENV=production`). Para testes automatizados sem WhatsApp, use `npm run webhook:simulate` ou `npm run agent:test`.

---

## Comandos úteis

```bash
docker compose logs -f evolution-api
docker compose down
docker compose down -v   # apaga volumes (reset total)
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| QR Code expira / `count: 0` | Atualize `WHATSAPP_WEB_VERSION` no `.env` da raiz, `docker compose down && docker compose up -d`, rode `./scripts/setup-evolution.sh` (gera `qrcode.png`) |
| Webhook 401 | Webhook global desligado; use `./scripts/setup-evolution.sh` (configura headers `apikey`) |
| Webhook não dispara | Verificar `WEBHOOK_URL`; testar curl acima |
| `host.docker.internal` no Linux | Já configurado via `extra_hosts: host-gateway` |
| Migration falha (`P1001: Can't reach database server at postgres:5432`) | Postgres fora da rede Docker. Recrie a stack: `docker compose down && docker compose up -d`. Confirme DNS: `docker run --rm --network personal-assistence_default alpine getent hosts postgres` |
| Migration falha (geral) | Verificar se Postgres está up: `docker compose ps` |
| Resposta não chega no WhatsApp | Verificar instância `open` e `EVOLUTION_INSTANCE` |

---

## Produção

- **Banco:** Neon (não Docker)
- **Evolution API:** VPS ou serviço dedicado
- **Webhook:** `https://seu-app.vercel.app/api/webhooks/whatsapp`
