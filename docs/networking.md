# Rede

## Opção A — Contabo Private Networking

Replica o desenho da plataforma de referência: uma interface privada L2 entre as quatro VPS. É a opção mais simples operacionalmente, mas exige add-on mensal em cada instância e reinicialização dos nós.

## Opção B — WireGuard

Cria uma malha privada `10.70.0.0/24` sobre os IPs públicos, restrita aos quatro peers. K3s usa `wg0` como `node-ip`, `advertise-address` e `flannel-iface`. Não há custo adicional, porém a configuração e recuperação do WireGuard passam a fazer parte da plataforma.

## Portas

Públicas nos nós de borda:

- TCP 80 e 443 de qualquer origem.
- TCP 22 apenas de origem administrativa confiável durante o bootstrap.

Entre nós pela rede privada escolhida:

- TCP 6443 para os servidores K3s.
- TCP 2379-2380 entre os três membros etcd.
- UDP 8472 entre todos os nós para Flannel VXLAN.
- TCP 10250 entre todos os nós para kubelet/metrics-server.

Nenhuma dessas portas internas deve ser liberada globalmente nos IPs públicos.
