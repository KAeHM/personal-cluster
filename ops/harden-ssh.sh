#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" != 0 ]]; then
  echo "Execute como root." >&2
  exit 1
fi

cat > /etc/ssh/sshd_config.d/90-personal-cluster.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowUsers platform-admin
EOF

sshd -t
systemctl restart ssh
echo "SSH_HARDENED=1"
