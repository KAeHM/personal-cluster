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
- O firewall de borda também aceita UDP 7882 (`Comunidades WebRTC UDP`) e TCP 7881 (`Comunidades WebRTC TCP`) de qualquer IPv4 para a mídia do piloto Comunidades, executada no `worker-1`. Regras confirmadas como ACTIVE no painel em 29/10/2026; os demais acessos foram preservados.
- Todo o restante do tráfego de entrada é descartado.

Se o IP público administrativo mudar, atualize a regra `Admin SSH` nos dois firewalls antes de abrir uma nova sessão.

O Comunidades oferece TURN/TLS pela porta 443 existente: Traefik termina TLS por SNI em `turn-comunidades.kaehm.dev` e encaminha para 5349 internamente. Não abrir 5349 nem a faixa de relay no firewall público. O Ingress que mantém DNS/certificado de TURN usa somente o entrypoint `web`, para não interceptar a rota TCP de mídia no `websecure`. Testes de quatro clientes com duas telas, webcam e áudio sintéticos passaram com TURN obrigatório e conexão direta sem TURN; tráfego UDP bidirecional foi observado no worker. TCP 7881 aceitou conexão externa, sem teste de mídia com ICE/TCP obrigatório. Configuração e evidências detalhadas ficam no repositório privado `KAeHM/comunidades-infra`.

## Portas internas

Entre os nós pela malha WireGuard:

- TCP 6443 para os servidores K3s.
- TCP 2379-2380 entre os três membros etcd.
- UDP 8472 entre todos os nós para Flannel VXLAN.
- TCP 10250 entre todos os nós para kubelet/metrics-server.

Nenhuma dessas portas internas é liberada nos IPs públicos. A API Kubernetes local é acessada pelo túnel SSH de `ops/kube-tunnel.ps1`.
