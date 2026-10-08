# Recuperação

## Cluster

- Snapshots etcd a cada seis horas nos três servidores.
- Cópias em bucket S3 privado, versionado, criptografado e com lifecycle.
- Token do servidor K3s guardado separadamente no SSM Parameter Store.
- Teste de restauração em ambiente isolado antes de considerar a plataforma pronta.

## Aplicações

Snapshot etcd não contém dados de PVC. Cada aplicação com dados duráveis declara RPO, RTO, rotina de backup e procedimento de restauração. Banco e arquivos usam destinos externos separados do cluster.

## Segredos

A chave privada do Sealed Secrets faz parte do estado do cluster e precisa estar coberta pelo snapshot. Uma cópia criptografada offline será mantida para recuperação em cluster novo. Se a chave for perdida, todas as credenciais seladas precisam ser rotacionadas.
