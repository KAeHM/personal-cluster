#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -f web/.env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source web/.env.local
  set +a
elif [ -f web/.env ]; then
  set -a
  # shellcheck disable=SC1091
  source web/.env
  set +a
fi

API_KEY="${EVOLUTION_API_KEY:-dev-secret-key-change-me}"
INSTANCE="${EVOLUTION_INSTANCE:-timetracker-dev}"
BASE_URL="${EVOLUTION_API_URL:-http://localhost:8080}"
WEBHOOK_URL="${WEBHOOK_URL:-${WEBHOOK_GLOBAL_URL:-http://host.docker.internal:3000/api/webhooks/whatsapp}}"
QR_OUTPUT="${ROOT_DIR}/qrcode.png"

curl_evolution() {
  local response http_code
  response="$(mktemp)"
  http_code="$(
    curl -sS -w "%{http_code}" -o "$response" "$@" || echo "000"
  )"

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    cat "$response"
    rm -f "$response"
    return 0
  fi

  echo "✗ Evolution API falhou (HTTP ${http_code}) em: $*" >&2
  if [ -s "$response" ]; then
    cat "$response" >&2
    echo "" >&2
  fi
  rm -f "$response"
  return 1
}

build_webhook_payload() {
  if [ -n "${WEBHOOK_SECRET:-}" ]; then
    cat <<EOF
{
  "webhook": {
    "enabled": true,
    "url": "${WEBHOOK_URL}",
    "webhookByEvents": false,
    "webhookBase64": true,
    "headers": {
      "apikey": "${API_KEY}",
      "x-webhook-secret": "${WEBHOOK_SECRET}"
    },
    "events": ["MESSAGES_UPSERT"]
  }
}
EOF
  else
    cat <<EOF
{
  "webhook": {
    "enabled": true,
    "url": "${WEBHOOK_URL}",
    "webhookByEvents": false,
    "webhookBase64": true,
    "headers": {
      "apikey": "${API_KEY}"
    },
    "events": ["MESSAGES_UPSERT"]
  }
}
EOF
  fi
}

save_qrcode_from_response() {
  local response="$1"

  if ! command -v python3 >/dev/null; then
    return 0
  fi

  RESPONSE="$response" OUTPUT="$QR_OUTPUT" python3 <<'PY'
import base64
import json
import os
from pathlib import Path

output = Path(os.environ["OUTPUT"])
data = json.loads(os.environ["RESPONSE"])

base64_value = data.get("base64")
if not base64_value and isinstance(data.get("qrcode"), dict):
    base64_value = data["qrcode"].get("base64")

if not base64_value:
    count = data.get("count")
    if count == 0:
        print("")
        print("⚠ QR não gerado (count: 0).")
        print("  1. Confirme WHATSAPP_WEB_VERSION no .env da raiz")
        print("  2. Reinicie: docker compose down && docker compose up -d")
        print("  3. Rode este script novamente")
    raise SystemExit(0)

if base64_value.startswith("data:"):
    base64_value = base64_value.split(",", 1)[1]

output.write_bytes(base64.b64decode(base64_value))
print(f"✓ QR salvo em {output}")
PY
}

echo "→ Configuração:"
echo "  BASE_URL=${BASE_URL}"
echo "  INSTANCE=${INSTANCE}"
echo "  WEBHOOK_URL=${WEBHOOK_URL}"
echo ""

echo "→ Criando instância ${INSTANCE}..."
if ! curl_evolution -X POST "${BASE_URL}/instance/create" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"instanceName\":\"${INSTANCE}\",\"integration\":\"WHATSAPP-BAILEYS\",\"qrcode\":true}"; then
  echo "Instância pode já existir — continuando."
fi

echo ""
echo "→ Configurando webhook por instância (com headers de auth)..."
curl_evolution -X POST "${BASE_URL}/webhook/set/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(build_webhook_payload)"

echo ""
echo "→ Gerando QR Code..."
QR_RESPONSE="$(curl_evolution "${BASE_URL}/instance/connect/${INSTANCE}" \
  -H "apikey: ${API_KEY}")"
echo "${QR_RESPONSE}"
save_qrcode_from_response "${QR_RESPONSE}"

echo ""
echo "→ Estado da conexão:"
curl_evolution "${BASE_URL}/instance/connectionState/${INSTANCE}" \
  -H "apikey: ${API_KEY}"

echo ""
echo ""
if [ -f "${QR_OUTPUT}" ]; then
  echo "✓ Abra ${QR_OUTPUT} e escaneie com o WhatsApp de teste."
else
  echo "✓ Escaneie o QR Code acima ou abra o painel em ${BASE_URL}/manager"
fi
