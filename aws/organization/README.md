# AWS Organizations

A organização separa governança e faturamento dos workloads:

- `kaehm`: conta de gerenciamento, faturamento, IAM Identity Center e registro do domínio.
- `Workloads`: unidade organizacional para contas que executam recursos.
- `personal-platform`: conta-membro que recebe os recursos da plataforma pessoal.

`personal-cost-guardrails.json` é a fonte de verdade da SCP `PersonalCostGuardrails`, anexada à OU `Workloads`. Ela usa uma estratégia de negação explícita sobre a política gerenciada `FullAWSAccess`: impede saída/encerramento da conta, compromissos financeiros e a criação acidental de serviços de custo alto. S3, SSM, IAM, CloudFormation e os recursos de DNS necessários à plataforma permanecem disponíveis.

Alterações devem ser validadas primeiro em `personal-platform`. A gestão de custos e permissões continua na conta de gerenciamento; não anexe a política à raiz sem revisar o efeito sobre novas contas.
