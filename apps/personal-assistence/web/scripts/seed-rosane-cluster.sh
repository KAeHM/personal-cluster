#!/usr/bin/env bash
# Popula tarefas Rosane no Postgres do cluster (via kubectl port-forward).
#
# Uso:
#   ./scripts/seed-rosane-cluster.sh --email user@example.com
#   ./scripts/seed-rosane-cluster.sh --from 2026-06-01 --to 2026-06-30 --email user@example.com
#
# Requer: kubectl apontando para o cluster, namespace personal-assistence.

set -euo pipefail

NAMESPACE="${NAMESPACE:-personal-assistence}"
LOCAL_PORT="${LOCAL_PORT:-15432}"
SECRET_NAME="${SECRET_NAME:-app-secrets}"

usage() {
  echo "Uso: $0 [--from YYYY-MM-DD] [--to YYYY-MM-DD] --email EMAIL" >&2
  exit 1
}

ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from|--to|--email|--phone)
      ARGS+=("$1" "$2")
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Argumento desconhecido: $1" >&2
      usage
      ;;
  esac
done

if [[ ${#ARGS[@]} -eq 0 ]] || ! printf '%s\n' "${ARGS[@]}" | grep -q '^--email\|^--phone$'; then
  echo "Informe --email ou --phone." >&2
  usage
fi

POSTGRES_PASSWORD="$(
  kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
    -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d
)"

if [[ -z "$POSTGRES_PASSWORD" ]]; then
  echo "POSTGRES_PASSWORD vazio no secret $SECRET_NAME (namespace $NAMESPACE)." >&2
  exit 1
fi

DATABASE_URL="postgresql://admin:${POSTGRES_PASSWORD}@127.0.0.1:${LOCAL_PORT}/personal_assistence"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

kubectl port-forward -n "$NAMESPACE" "svc/postgres" "${LOCAL_PORT}:5432" >/dev/null 2>&1 &
PF_PID=$!

cleanup() {
  kill "$PF_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if (echo >/dev/tcp/127.0.0.1/"$LOCAL_PORT") 2>/dev/null; then
    break
  fi
  sleep 0.5
done

export DATABASE_URL
export NODE_ENV=development

exec ./node_modules/.bin/tsx scripts/seed-rosane-month.ts "${ARGS[@]}"
