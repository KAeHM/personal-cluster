#!/usr/bin/env bash
set -euo pipefail

: "${WG_ADDRESS:?Defina WG_ADDRESS, por exemplo 10.70.0.11/24}"
: "${WG_PEERS_FILE:?Defina WG_PEERS_FILE}"

if [[ "$(id -u)" != 0 ]]; then
  echo "Execute como root." >&2
  exit 1
fi

if [[ ! -s /etc/wireguard/privatekey ]]; then
  echo "Chave privada do WireGuard ausente." >&2
  exit 1
fi

if [[ ! -s "$WG_PEERS_FILE" ]]; then
  echo "Arquivo de peers ausente: $WG_PEERS_FILE" >&2
  exit 1
fi

umask 077
{
  printf '[Interface]\n'
  printf 'Address = %s\n' "$WG_ADDRESS"
  printf 'ListenPort = 51820\n'
  printf 'PrivateKey = %s\n' "$(cat /etc/wireguard/privatekey)"
  printf '\n'
  cat "$WG_PEERS_FILE"
} > /etc/wireguard/wg0.conf

systemctl enable --now wg-quick@wg0
wg show wg0
