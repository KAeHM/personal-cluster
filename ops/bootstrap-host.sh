#!/usr/bin/env bash
set -euo pipefail

: "${NODE_NAME:?Defina NODE_NAME}"
: "${ADMIN_PUBLIC_KEY:?Defina ADMIN_PUBLIC_KEY}"

if [[ "$(id -u)" != 0 ]]; then
  echo "Execute como root." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  jq \
  wireguard \
  wireguard-tools

hostnamectl set-hostname "$NODE_NAME"

if ! id platform-admin >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash platform-admin
fi

install -d -m 700 -o platform-admin -g platform-admin /home/platform-admin/.ssh
printf '%s\n' "$ADMIN_PUBLIC_KEY" > /home/platform-admin/.ssh/authorized_keys
chown platform-admin:platform-admin /home/platform-admin/.ssh/authorized_keys
chmod 600 /home/platform-admin/.ssh/authorized_keys

printf '%s\n' 'platform-admin ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-platform-admin
chmod 440 /etc/sudoers.d/90-platform-admin

install -d -m 700 /etc/wireguard
if [[ ! -s /etc/wireguard/privatekey ]]; then
  umask 077
  wg genkey > /etc/wireguard/privatekey
fi

systemctl enable systemd-timesyncd
systemctl restart systemd-timesyncd

echo "NODE_READY=$NODE_NAME"
printf 'WG_PUBLIC_KEY='
wg pubkey < /etc/wireguard/privatekey
