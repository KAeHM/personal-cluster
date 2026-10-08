# Fundação AWS

## Organização e acesso

A conta `kaehm` é a conta de gerenciamento da AWS Organization. A conta-membro `personal-platform` pertence à OU `Workloads` e deve receber os recursos da plataforma. Essa separação preserva faturamento e segurança fora da conta de execução.

O IAM Identity Center está na região `eu-central-1`, usando o diretório nativo. O usuário `samuel` recebe o conjunto `PlatformAdministrator` nas duas contas, com sessões de uma hora. O acesso diário deve acontecer pelo portal SSO; a conta root fica somente para recuperação.

O gerenciamento centralizado de root está habilitado para contas-membro, incluindo gerenciamento de credenciais e sessões privilegiadas. A conta de gerenciamento não possui access keys de root e mantém MFA.

## Custos

O orçamento consolidado `Personal-Monthly-USD20` cobre todos os serviços da organização e renova mensalmente. Os alertas são:

| Tipo | Limite |
| --- | ---: |
| custo real | US$ 5 |
| custo real | US$ 10 |
| custo real | US$ 15 |
| custo real | US$ 18 |
| custo previsto | US$ 18 |

Alertas de nível gratuito e métricas de faturamento do CloudWatch estão habilitados. A detecção de anomalias usa o monitor gerenciado para todos os serviços e envia resumo diário quando o impacto supera simultaneamente US$ 1 e 10% do gasto esperado.

AWS Budgets e Cost Anomaly Detection são mecanismos de aviso, não um limite rígido. A SCP em `aws/organization` é a barreira preventiva contra as classes de gasto mais perigosas. Qualquer exceção deve ser intencional, pequena e registrada no Git antes de ser aplicada.

## Domínio

`kaehm.dev` e sua hosted zone foram criados na conta de gerenciamento. O registro não pode ser transferido entre contas AWS nos primeiros 14 dias após o registro de 8 de outubro de 2026. Até 22 de outubro de 2026, o DNS pode operar normalmente nessa conta.

O registro do domínio e a hosted zone são recursos separados. Quando o bloqueio terminar, mover o registro não move a zona automaticamente. A opção de menor risco é manter a hosted zone atual durante a primeira publicação e migrá-la somente em uma janela planejada, copiando os registros e atualizando os nameservers no registrador.

## Recuperação

A stack `personal-contabo-recovery` está em `CREATE_COMPLETE` na conta `personal-platform`, região `eu-central-1`. Ela criou o bucket versionado `personal-contabo-recovery-snapshotbucket-zogopah73wen` e o usuário IAM `personal-contabo-etcd-uploader`, limitado a listar o prefixo `etcd/` e enviar objetos para ele. Nenhuma access key foi criada.

O caminho recomendado para o token do servidor continua sendo `/personal/platform/personal-contabo/k3s/server-token` no Parameter Store.

## Próximas operações

1. Criar a credencial limitada do uploader fora do CloudFormation e selá-la no cluster.
2. Implantar `aws/dns/stack.yaml` na conta que hospeda a zona, depois de definir os dois IPs de borda.
3. Revisar a transferência do registro do domínio após 22 de outubro de 2026.
