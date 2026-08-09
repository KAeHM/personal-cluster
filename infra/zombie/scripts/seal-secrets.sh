#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT="${1:-${ROOT_DIR}/secrets.local.yaml}"
OUTPUT="${ROOT_DIR}/sealed-secret.yaml"

if [ ! -f "$INPUT" ]; then
  echo "Arquivo não encontrado: $INPUT"
  echo ""
  echo "Uso:"
  echo "  cp scripts/secrets.template secrets.local.yaml"
  echo "  # edite secrets.local.yaml com valores reais"
  echo "  ./scripts/seal-secrets.sh"
  exit 1
fi

if ! command -v kubeseal >/dev/null; then
  echo "kubeseal não encontrado. Instale: https://github.com/bitnami-labs/sealed-secrets"
  exit 1
fi

CONTROLLER_NAME="${SEALED_SECRETS_CONTROLLER_NAME:-sealed-secrets}"
CONTROLLER_NAMESPACE="${SEALED_SECRETS_CONTROLLER_NAMESPACE:-kube-system}"

kubeseal \
  --format yaml \
  --controller-name "$CONTROLLER_NAME" \
  --controller-namespace "$CONTROLLER_NAMESPACE" \
  < "$INPUT" \
  > "$OUTPUT"

echo "✓ Gerado: $OUTPUT"
echo "  Commit este arquivo e remova secrets.local.yaml do disco."
