# Recuperação AWS

`stack.yaml` cria um bucket versionado compartilhado por prefixos isolados:

- `etcd/`: snapshots do K3s, mantidos por 30 dias;
- `postgres/taeria/`: WALs e backups físicos do PostgreSQL do Taeria, mantidos por 21 dias no S3.

O usuário do Taeria só pode listar esse prefixo e ler, gravar ou excluir seus próprios objetos. A exclusão é necessária para a política de retenção do Barman Cloud. As access keys e o parâmetro SSM `SecureString` com o token do K3s são criados fora do CloudFormation e nunca entram no Git nem no histórico de parâmetros da stack.

## Implantação atual

- Conta: `personal-platform` (`756917284699`).
- Região: `eu-central-1`.
- Stack: `personal-contabo-recovery` (`CREATE_COMPLETE`).
- Bucket: `personal-contabo-recovery-snapshotbucket-zogopah73wen`.
- Usuário IAM de etcd: `personal-contabo-etcd-uploader`.
- Usuário IAM de backup do Taeria: `personal-contabo-taeria-postgres-backup` (criado ao atualizar a stack).
- Access keys: criadas separadamente somente quando cada consumidor estiver pronto para recebê-las como Sealed Secret.
