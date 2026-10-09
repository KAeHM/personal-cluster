# Arquitetura

## Objetivos

- Hospedar aplicações pessoais sem dar credenciais do cluster ao CI.
- Tolerar a falha de um control plane e de um dos endpoints de entrada.
- Manter API Kubernetes, Argo CD, Prometheus e Grafana fora da internet pública.
- Tornar reinstalação e recuperação reproduzíveis.
- Separar plataforma, aplicações e segredos.

## Cluster

O cluster usa três servidores K3s com etcd embarcado e um agente. Com três membros, o etcd mantém quorum após a perda de um servidor. Servidores continuam schedulable para aproveitar a capacidade das quatro VPS.

O registro inicial dos nós usa `personal-k8s-cp-1`. Todos os endereços privados dos control planes entram em `tls-san`. Um endereço de registro estável pode ser introduzido depois sem alterar a topologia.

## Entrada

O Traefik incluído no K3s é configurado com duas réplicas. Somente `personal-k8s-cp-3` e `personal-k8s-worker-1` recebem as etiquetas de borda e ServiceLB. O ExternalDNS publica no Route 53 os nomes declarados pelas aplicações, sempre apontando para os dois IPs de borda.

Aplicações públicas usam cert-manager com ACME DNS-01. Isso permite tanto `taeria.kaehm.dev` quanto nomes aninhados como `api.taeria.kaehm.dev`, sem registros manuais. Serviços administrativos ficam em `ClusterIP` e são acessados por túnel SSH ou rede administrativa privada.

## GitOps

O bootstrap instala Argo CD manualmente uma única vez. Depois disso, a Application raiz reconcilia `clusters/contabo/apps`.

Cada aplicação possui repositório próprio. GitHub Actions testa e publica imagens no GHCR por digest. A entrega altera um manifesto GitOps; Argo CD puxa o estado desejado com credencial GitHub somente leitura. CI não recebe kubeconfig.

## Dados

Volumes `local-path` são aceitos para dados descartáveis. PostgreSQL e arquivos duráveis exigem replicação por aplicação, backup externo, alerta e ensaio de restauração. Snapshot do etcd recupera o estado Kubernetes, não o conteúdo dos PVCs.

## Segurança

- Chave SSH exclusiva e `IdentitiesOnly yes`.
- API Kubernetes não publicada.
- Firewall público na Contabo e firewall no sistema operacional.
- Pod Security Baseline com auditoria de Restricted.
- NetworkPolicy default-deny por namespace de aplicação.
- Segredos novos por Sealed Secrets; chave privada incluída no plano de recuperação.
- Charts, K3s e imagens fixados por versão ou digest.
