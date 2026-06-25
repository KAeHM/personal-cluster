#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Uso: $(basename "$0") <app-slug> [--host <tailscale-host>]

Exemplo:
  $(basename "$0") meu-produto
  $(basename "$0") meu-produto --host meu-produto.tail412374.ts.net

Cria apps/<slug>/, infra/<slug>/, workflows CI/CD e Application ArgoCD a partir do template.
EOF
  exit 1
}

APP_SLUG=""
TAILSCALE_HOST=""
DEFAULT_TAILSCALE_SUFFIX="tail412374.ts.net"
IMAGE_REGISTRY="ghcr.io/kaehm/personal-cluster"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      TAILSCALE_HOST="${2:-}"
      shift 2
      ;;
    -h | --help)
      usage
      ;;
    -*)
      echo "Opção desconhecida: $1" >&2
      usage
      ;;
    *)
      if [[ -z "$APP_SLUG" ]]; then
        APP_SLUG="$1"
      else
        echo "Argumento extra: $1" >&2
        usage
      fi
      shift
      ;;
  esac
done

[[ -n "$APP_SLUG" ]] || usage

if [[ ! "$APP_SLUG" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "Slug inválido: use minúsculas, números e hífens (ex.: meu-produto)" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="${ROOT_DIR}/templates/boilerplate"
APP_DIR="${ROOT_DIR}/apps/${APP_SLUG}"
INFRA_DIR="${ROOT_DIR}/infra/${APP_SLUG}"

if [[ -e "$APP_DIR" || -e "$INFRA_DIR" ]]; then
  echo "App ou infra já existe: $APP_SLUG" >&2
  exit 1
fi

if [[ -z "$TAILSCALE_HOST" ]]; then
  TAILSCALE_HOST="${APP_SLUG}.${DEFAULT_TAILSCALE_SUFFIX}"
fi

APP_NAME="$(echo "$APP_SLUG" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2); print}')"
DB_NAME="$(echo "$APP_SLUG" | tr '-' '_')"
IMAGE_NAME="${IMAGE_REGISTRY}/${APP_SLUG}-web"

substitute() {
  local file="$1"
  sed \
    -e "s|{{APP_SLUG}}|${APP_SLUG}|g" \
    -e "s|{{APP_NAME}}|${APP_NAME}|g" \
    -e "s|{{TAILSCALE_HOST}}|${TAILSCALE_HOST}|g" \
    -e "s|{{IMAGE_NAME}}|${IMAGE_NAME}|g" \
    -e "s|{{DB_NAME}}|${DB_NAME}|g" \
    "$file"
}

echo "→ Copiando app template para apps/${APP_SLUG}/"
cp -a "${TEMPLATE_DIR}/app/." "$APP_DIR/"

echo "→ Copiando infra template para infra/${APP_SLUG}/"
mkdir -p "${INFRA_DIR}/scripts"
for f in namespace.yaml postgres.yaml web-app.yaml; do
  substitute "${TEMPLATE_DIR}/infra/${f}" > "${INFRA_DIR}/${f}"
done
substitute "${TEMPLATE_DIR}/infra/scripts/secrets.template" > "${INFRA_DIR}/scripts/secrets.template"
cp "${TEMPLATE_DIR}/infra/scripts/seal-secrets.sh" "${INFRA_DIR}/scripts/seal-secrets.sh"
chmod +x "${INFRA_DIR}/scripts/seal-secrets.sh"

echo "→ Gerando workflows GitHub Actions"
mkdir -p "${ROOT_DIR}/.github/workflows"
substitute "${TEMPLATE_DIR}/github/deploy-workflow.yaml.tpl" > "${ROOT_DIR}/.github/workflows/${APP_SLUG}-deploy.yaml"
substitute "${TEMPLATE_DIR}/github/ci-workflow.yaml.tpl" > "${ROOT_DIR}/.github/workflows/${APP_SLUG}-ci.yaml"

echo "→ Gerando Application ArgoCD"
substitute "${TEMPLATE_DIR}/github/argocd-application.yaml.tpl" > "${ROOT_DIR}/infra/argocd-apps/${APP_SLUG}.yaml"

cat <<EOF

✓ App "${APP_SLUG}" criada.

Próximos passos:
  1. cd infra/${APP_SLUG}
  2. cp scripts/secrets.template secrets.local.yaml
  3. Edite secrets.local.yaml (POSTGRES_PASSWORD, AUTH_SECRET, API_KEY)
  4. ./scripts/seal-secrets.sh
  5. git add apps/${APP_SLUG} infra/${APP_SLUG} infra/argocd-apps/${APP_SLUG}.yaml .github/workflows/${APP_SLUG}-*.yaml
  6. git commit && git push (branch master)

Após deploy:
  - URL: https://${TAILSCALE_HOST}
  - Imagem: ${IMAGE_NAME}:sha-<commit>
  - Logs Loki: {namespace="${APP_SLUG}"} | json | service="${APP_SLUG}-web"
  - Métricas: Prometheus targets (annotation prometheus.io/scrape no Service)
  - Traces: Grafana → Tempo

EOF
