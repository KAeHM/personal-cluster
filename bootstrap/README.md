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

7. Instalar Argo CD HA com versão fixa.
8. Configurar GitHub App ou deploy key somente leitura para este repositório.
9. Aplicar `clusters/contabo/root.yaml`.
10. Confirmar todas as Applications `Synced` e `Healthy` antes de configurar DNS público.

O kubeconfig local deve ser salvo como `~/.kube/personal-contabo.yaml`, com contexto `personal-contabo`. Não mesclar com o arquivo da ITRTech.
