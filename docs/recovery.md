# Recuperação

## Cluster

- Snapshots etcd a cada seis horas nos três servidores.
- Cópias em bucket S3 privado, versionado, criptografado e com lifecycle.
- Token do servidor K3s guardado separadamente no SSM Parameter Store.
- Teste de restauração em ambiente isolado antes de considerar a plataforma pronta.

O acesso ao S3 usa o Secret `k3s-etcd-snapshot-s3-config`, do tipo `etcd.k3s.cattle.io/s3-config-secret`, no namespace `kube-system`. O manifesto versionado é um `SealedSecret`: somente o controlador deste cluster consegue recuperar a credencial.

O usuário IAM `personal-contabo-etcd-uploader` pode verificar/listar o bucket dedicado e gravar objetos apenas no prefixo `etcd/`. Ele não recebe `GetObject` nem `DeleteObject`. Por isso, a retenção do K3s fica em `1000` e a expiração efetiva é controlada pelo lifecycle do S3: 30 dias para versões atuais e 7 dias para versões não atuais.

Nos três control-planes, `/etc/rancher/k3s/config.yaml.d/90-etcd-s3.yaml` habilita S3 e referencia esse Secret. Mudanças no Secret são lidas a cada operação de snapshot; mudanças nesse arquivo de configuração exigem reinício sequencial dos servidores.

Em 9 de outubro de 2026, um snapshot manual do `cp-1` foi criado e confirmado no prefixo `etcd/` do bucket, validando a credencial, a política IAM e o envio do K3s de ponta a ponta.

## Operação

1. Verificar se o `SealedSecret` está `Synced` e se o Secret resultante possui as nove chaves `etcd-s3-*` esperadas, sem imprimir seus valores.
2. Confirmar que os três servidores estão `Ready` e com o arquivo `90-etcd-s3.yaml` instalado.
3. Executar `sudo k3s etcd-snapshot save --name offsite-smoke-AAAAmmdd-HHMMSS` em um control-plane.
4. Confirmar o objeto correspondente no prefixo `etcd/` do bucket.
5. Fazer um teste de restauração isolado antes de declarar RPO e RTO atendidos.

## Aplicações

Snapshot etcd não contém dados de PVC. Cada aplicação com dados duráveis declara RPO, RTO, rotina de backup e procedimento de restauração. Banco e arquivos usam destinos externos separados do cluster.

## Segredos

A chave privada do Sealed Secrets faz parte do estado do cluster e precisa estar coberta pelo snapshot. Uma cópia criptografada offline será mantida para recuperação em cluster novo. Se a chave for perdida, todas as credenciais seladas precisam ser rotacionadas.
