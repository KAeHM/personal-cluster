# Personal Cluster Platform

Fonte de verdade da plataforma Kubernetes pessoal na Contabo. O desenho segue os mesmos princípios do `platform-cluster-infra`: K3s com três servidores etcd, Argo CD em GitOps, entrada HTTPS redundante, observabilidade, segredos criptografados e recuperação externa na AWS.

Este repositório contém somente a plataforma. Código e manifests específicos de aplicações ficam nos seus próprios repositórios e são registrados aqui por `Application` e `AppProject` do Argo CD.

## Topologia

| Nome | Papel | Borda |
| --- | --- | --- |
| `personal-k8s-cp-1` | K3s server + etcd | não |
| `personal-k8s-cp-2` | K3s server + etcd | não |
| `personal-k8s-cp-3` | K3s server + etcd | secundária |
| `personal-k8s-worker-1` | K3s agent | principal |

Os quatro nós são `Cloud VPS 6` na região EU. Os servidores K3s permanecem aptos a executar workloads. Traefik roda em duas réplicas, distribuídas entre os dois nós de borda.

## Camadas

- Ubuntu 24.04 LTS e acesso SSH por chave exclusiva.
- Interconexão privada por Contabo Private Networking ou WireGuard dedicado.
- K3s `v1.36.5+k3s1` com etcd embarcado em três servidores.
- Argo CD HA com padrão App of Apps.
- Traefik, cert-manager e Sealed Secrets.
- kube-prometheus-stack e Grafana na primeira etapa.
- Loki, Tempo e Alloy somente depois de medir a capacidade base.
- Route 53 para DNS e S3/SSM para recuperação.

## Estado

A base declarativa está sendo reconstruída. Nenhum manifesto deve ser aplicado enquanto os itens marcados como `PENDING` no inventário não estiverem resolvidos.

Leia [arquitetura](docs/architecture.md), [inventário](docs/inventory.md), [bootstrap](bootstrap/README.md), [entrega](docs/delivery.md) e [recuperação](docs/recovery.md).
