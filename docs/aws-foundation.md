# Fundação AWS

## Organização e acesso

A conta `kaehm` é a conta de gerenciamento da AWS Organization. A conta-membro `personal-platform` pertence à OU `Workloads` e deve receber os recursos da plataforma. Essa separação preserva faturamento e segurança fora da conta de execução.

O IAM Identity Center está na região `eu-central-1`, usando o diretório nativo. O usuário `samuel` recebe o conjunto `PlatformAdministrator` nas duas contas, com sessões de uma hora. O acesso diário deve acontecer pelo portal SSO; a conta root fica somente para recuperação.

O usuário IAM legado `samuel-lima`, que ainda tinha login por senha, uma access key antiga e `AdministratorAccess`, foi removido em 9 de outubro de 2026. O acesso humano permanece exclusivamente no IAM Identity Center.

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

A stack `personal-contabo-recovery` está em `UPDATE_COMPLETE` na conta `personal-platform`, região `eu-central-1`. Ela criou o bucket versionado `personal-contabo-recovery-snapshotbucket-zogopah73wen` e o usuário IAM `personal-contabo-etcd-uploader`. O usuário pode verificar/listar o bucket dedicado e gravar somente em `etcd/`; ele não pode ler nem excluir objetos.

Uma access key dedicada foi criada em 9 de outubro de 2026. A credencial está armazenada no cluster pelo `SealedSecret` em `platform/recovery`; nenhum valor em texto puro foi incluído no Git. Um snapshot manual foi enviado e confirmado no bucket após a implantação.

O token do servidor K3s está armazenado como `SecureString` padrão em `/personal/platform/personal-contabo/k3s/server-token`, no Parameter Store da conta `personal-platform` em `eu-central-1`. O valor foi comparado com o token atual do cluster após a gravação.

## DNS automatizado

A stack `personal-contabo-dns-automation` está em `CREATE_COMPLETE` na conta de gerenciamento. As credenciais separadas de ExternalDNS e cert-manager usam políticas mínimas para a hosted zone de `kaehm.dev`, estão seladas no Git e não permanecem em arquivos locais em texto aberto.

## Próximas operações

1. Validar a publicação automática e o certificado do endereço de prova após a reconciliação do Argo CD.
2. Definir um canal de alertas de custo e operação.
3. Revisar a transferência do registro do domínio após 22 de outubro de 2026.
