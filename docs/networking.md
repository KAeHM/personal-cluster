# Rede

## Escolha atual — WireGuard

Uma malha privada `10.70.0.0/24` conecta os quatro peers. K3s usa `wg0` como `node-ip`, `advertise-address` e `flannel-iface`. O desenho não adiciona custo mensal.

| Nó | Endereço WireGuard |
| --- | --- |
| `cp-1` | `10.70.0.11` |
| `cp-2` | `10.70.0.12` |
| `cp-3` | `10.70.0.13` |
| `worker-1` | `10.70.0.21` |

O add-on Contabo Private Networking não foi contratado.

## Firewalls Contabo

- `personal-k8s-control-plane` está em `cp-1` e `cp-2`.
- `personal-k8s-edge` está em `cp-3` e `worker-1`.
- Ambos aceitam TCP 22 somente do CIDR administrativo configurado no painel.
- Ambos aceitam UDP 51820 somente dos quatro IPv4 públicos das VPS.
- Apenas o firewall de borda aceita TCP 80 e 443 de qualquer IPv4.
- Todo o restante do tráfego de entrada é descartado.

Se o IP público administrativo mudar, atualize a regra `Admin SSH` nos dois firewalls antes de abrir uma nova sessão.

## Portas internas

Entre os nós pela malha WireGuard:

- TCP 6443 para os servidores K3s.
- TCP 2379-2380 entre os três membros etcd.
- UDP 8472 entre todos os nós para Flannel VXLAN.
- TCP 10250 entre todos os nós para kubelet/metrics-server.

Nenhuma dessas portas internas é liberada nos IPs públicos. A API Kubernetes local é acessada pelo túnel SSH de `ops/kube-tunnel.ps1`.
