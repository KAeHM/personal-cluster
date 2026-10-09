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
- Interconexão privada por WireGuard dedicado em `10.70.0.0/24`.
- K3s `v1.36.5+k3s1` com etcd embarcado em três servidores.
- Argo CD HA com padrão App of Apps.
- Traefik, cert-manager e Sealed Secrets.
- kube-prometheus-stack e Grafana na primeira etapa.
- Loki, Tempo e Alloy somente depois de medir a capacidade base.
- Route 53 com ExternalDNS para nomes sob demanda e S3/SSM para recuperação.

## Estado

Cluster provisionado em 8 de outubro de 2026. Os quatro nós estão `Ready`, o etcd tem três membros, o Argo CD reconcilia `main` e todas as Applications da plataforma estão `Synced/Healthy`. Traefik atende somente em `cp-3` e `worker-1`.

O acesso Kubernetes local usa `~/.kube/personal-contabo.yaml` pelo túnel criado por `ops/kube-tunnel.ps1`; ele não é mesclado com outros kubeconfigs. A fundação AWS já possui organização, SSO, orçamento de US$ 20, guardas de custo, o domínio `kaehm.dev` e o bucket de recuperação. O uploader dedicado está ativo e um snapshot real do etcd foi validado no S3. O token do servidor está protegido no SSM e a automação de DNS e HTTPS possui credenciais separadas, mínimas e seladas para publicar nomes como `api.taeria.kaehm.dev`.

Leia [arquitetura](docs/architecture.md), [DNS e HTTPS](docs/dns-and-tls.md), [inventário](docs/inventory.md), [fundação AWS](docs/aws-foundation.md), [bootstrap](bootstrap/README.md), [entrega](docs/delivery.md) e [recuperação](docs/recovery.md).
