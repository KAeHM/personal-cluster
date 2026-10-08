# Recuperação AWS

`stack.yaml` cria o bucket versionado para snapshots etcd e um usuário IAM de envio sem permissão de exclusão. A access key e o parâmetro SSM `SecureString` com o token do K3s são criados fora do CloudFormation e nunca entram no Git nem no histórico de parâmetros da stack.
