# Bootstrap

O bootstrap só começa depois que `docs/inventory.md` não tiver pendências de rede, sistema operacional e SSH.

1. Garantir Ubuntu 24.04 LTS limpo nas quatro VPS.
2. Instalar a chave pública exclusiva e validar o acesso antes de desabilitar senha/root.
3. Configurar a interconexão privada escolhida e testar conectividade entre os quatro endereços internos.
4. Criar o mesmo token aleatório em `/etc/rancher/k3s/cluster-token` nos quatro nós, permissão `0600`.
5. Executar `install-k3s.sh` na ordem `cp-1`, `cp-2`, `cp-3`, `worker-1`.
6. Etiquetar `cp-3` e `worker-1` como borda:

   ```sh
   kubectl label node cp-3 svccontroller.k3s.cattle.io/enablelb=true personal.platform/edge=true
   kubectl label node worker-1 svccontroller.k3s.cattle.io/enablelb=true personal.platform/edge=true
   ```

7. Instalar Argo CD HA `v3.5.3` com o manifesto oficial fixado.
8. Usar HTTPS anônimo enquanto este repositório for público. Se ele se tornar privado, configurar GitHub App ou deploy key somente leitura.
9. Aplicar `clusters/contabo/root.yaml`.
10. Confirmar todas as Applications `Synced` e `Healthy` antes de configurar DNS público.
11. Instalar `bootstrap/etcd-s3.yaml` como `/etc/rancher/k3s/config.yaml.d/90-etcd-s3.yaml` nos três servidores e reiniciar um servidor por vez, aguardando o nó voltar a `Ready` antes de seguir.
12. Criar um snapshot manual e confirmar o objeto correspondente no prefixo `etcd/` do bucket de recuperação.

O kubeconfig local fica em `~/.kube/personal-contabo.yaml`, com contexto `personal-contabo`. Não o mescle com o arquivo da ITRTech. Use `ops/kube.ps1` para abrir o túnel SSH e executar `kubectl` nesse contexto isolado.
