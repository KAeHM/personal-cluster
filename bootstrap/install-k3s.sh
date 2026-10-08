#!/usr/bin/env bash
set -euo pipefail

: "${ROLE:?Defina ROLE=cp-1|cp-2|cp-3|worker-1}"
: "${NODE_IP:?Defina NODE_IP com o endereco da rede privada}"
: "${PUBLIC_IP:?Defina PUBLIC_IP com o IPv4 publico da VPS}"

K3S_VERSION="${K3S_VERSION:-v1.36.5+k3s1}"
TOKEN_FILE="${TOKEN_FILE:-/etc/rancher/k3s/cluster-token}"
FIRST_SERVER_URL="${FIRST_SERVER_URL:-https://10.70.0.11:6443}"

if [[ "$(id -u)" != 0 ]]; then
  echo "Execute como root." >&2
  exit 1
fi

case "$ROLE" in
  cp-1) MODE=server; INIT=true ;;
  cp-2|cp-3) MODE=server; INIT=false ;;
  worker-1) MODE=agent; INIT=false ;;
  *) echo "ROLE invalido: $ROLE" >&2; exit 1 ;;
esac

if [[ ! -s "$TOKEN_FILE" ]]; then
  echo "Token ausente em $TOKEN_FILE" >&2
  exit 1
fi
chmod 600 "$TOKEN_FILE"

PRIVATE_IFACE="$(ip -4 -o addr show | awk -v ip="$NODE_IP" '{split($4, address, "/"); if (address[1] == ip) {print $2; exit}}')"
if [[ -z "$PRIVATE_IFACE" ]]; then
  echo "Endereco privado $NODE_IP nao encontrado." >&2
  exit 1
fi

hostnamectl set-hostname "personal-k8s-$ROLE"
mkdir -p /etc/rancher/k3s

cat > /etc/rancher/k3s/config.yaml <<EOF
node-name: "$ROLE"
node-ip: "$NODE_IP"
node-external-ip: "$PUBLIC_IP"
token-file: "$TOKEN_FILE"
flannel-iface: "$PRIVATE_IFACE"
EOF

if [[ "$MODE" == server ]]; then
  cat >> /etc/rancher/k3s/config.yaml <<EOF
advertise-address: "$NODE_IP"
write-kubeconfig-mode: "0600"
secrets-encryption: true
etcd-snapshot-compress: true
etcd-snapshot-schedule-cron: "0 */6 * * *"
etcd-snapshot-retention: 8
tls-san:
  - "10.70.0.11"
  - "10.70.0.12"
  - "10.70.0.13"
EOF
  if [[ "$INIT" == true ]]; then
    printf 'cluster-init: true\n' >> /etc/rancher/k3s/config.yaml
  else
    printf 'server: "%s"\n' "$FIRST_SERVER_URL" >> /etc/rancher/k3s/config.yaml
  fi
else
  printf 'server: "%s"\n' "$FIRST_SERVER_URL" >> /etc/rancher/k3s/config.yaml
fi

curl -sfL https://get.k3s.io -o /tmp/get-k3s.sh
INSTALL_K3S_VERSION="$K3S_VERSION" INSTALL_K3S_EXEC="$MODE" sh /tmp/get-k3s.sh

if [[ "$MODE" == server ]]; then
  SERVICE=k3s
else
  SERVICE=k3s-agent
fi
systemctl is-active --quiet "$SERVICE"
echo "K3s $K3S_VERSION ativo em $ROLE."
