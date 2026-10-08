# Inventário Contabo

Os valores sensíveis e endereços completos ficam em `inventory/contabo/hosts.yaml`, ignorado pelo Git. Este arquivo registra apenas identidades estáveis.

| Display name | Instância | Produto | Região | Papel |
| --- | --- | --- | --- | --- |
| `personal-k8s-cp-1` | `vmi3647685` | Cloud VPS 6 | EU | K3s server + etcd |
| `personal-k8s-cp-2` | `vmi3647686` | Cloud VPS 6 | EU | K3s server + etcd |
| `personal-k8s-cp-3` | `vmi3647687` | Cloud VPS 6 | EU | K3s server + etcd + edge |
| `personal-k8s-worker-1` | `vmi3647688` | Cloud VPS 6 | EU | K3s agent + edge |

## Estado do bootstrap

- `DONE`: WireGuard gerenciado pela plataforma em `10.70.0.0/24`.
- `DONE`: Ubuntu 24.04 LTS reinstalado nas quatro VPS.
- `DONE`: acesso exclusivo por `platform-admin` e chave `personal-cluster_ed25519`; senha e login SSH de root desabilitados.
- `DONE`: firewalls `personal-k8s-control-plane` e `personal-k8s-edge` atribuídos às quatro VPS.
- `DONE`: K3s HA e Argo CD reconciliados com a branch `main`.

## Pendências externas

- `DONE`: domínio `kaehm.dev` e hosted zone do Route 53 criados na conta de gerenciamento.
- `DONE`: AWS Organization, IAM Identity Center, orçamento mensal de US$ 20 e guardas de custo configurados.
- `DONE`: stack `personal-contabo-recovery`, bucket versionado e usuário IAM limitado criados na conta `personal-platform`.
- `PENDING`: criar a access key do uploader e selar a credencial no cluster.
- `PENDING`: definir canal de alertas.
