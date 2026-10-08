# Inventário Contabo

Os valores sensíveis e endereços completos ficam em `inventory/contabo/hosts.yaml`, ignorado pelo Git. Este arquivo registra apenas identidades estáveis.

| Display name | Instância | Produto | Região | Papel |
| --- | --- | --- | --- | --- |
| `personal-k8s-cp-1` | `vmi3647685` | Cloud VPS 6 | EU | K3s server + etcd |
| `personal-k8s-cp-2` | `vmi3647686` | Cloud VPS 6 | EU | K3s server + etcd |
| `personal-k8s-cp-3` | `vmi3647687` | Cloud VPS 6 | EU | K3s server + etcd + edge |
| `personal-k8s-worker-1` | `vmi3647688` | Cloud VPS 6 | EU | K3s agent + edge |

## Pendências antes do bootstrap

- `PENDING`: escolher Contabo Private Networking ou WireGuard gerenciado por nós.
- `PENDING`: confirmar/reinstalar Ubuntu 24.04 LTS.
- `PENDING`: criar chave SSH exclusiva e validar fingerprints dos hosts.
- `PENDING`: definir domínio pessoal e hosted zone do Route 53.
- `PENDING`: criar bucket e credencial de recuperação por CloudFormation.
- `PENDING`: definir canal de alertas.
