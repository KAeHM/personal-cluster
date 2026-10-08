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

passwd --lock root
rm -f /root/.ssh/authorized_keys
rm -f \
  /tmp/bootstrap-host.sh \
  /tmp/bootstrap-k3s.sh \
  /tmp/cluster-token \
  /tmp/configure-wireguard.sh \
  /tmp/get-k3s.sh \
  /tmp/harden-ssh.sh \
  /tmp/wg.peers

echo "SSH_HARDENED=1"
