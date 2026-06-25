# Cursor rules (versionadas)

Regras em `.mdc` aplicadas automaticamente pelo Cursor conforme arquivos abertos ou
`alwaysApply`.

| Arquivo            | Escopo                         |
| ------------------ | ------------------------------ |
| `global.mdc`       | Sempre                         |
| `architecture.mdc` | `src/**`                       |
| `modules.mdc`      | `src/modules/**`               |
| `drizzle.mdc`      | schemas, migrations, db client |
| `auth.mdc`         | `src/modules/auth/**`          |
| `api.mdc`          | `src/app/api/**`               |
| `presentation.mdc` | presentation + `src/app`       |
| `errors.mdc`       | erros tipados                  |
| `testing.mdc`      | testes                         |
| `devops.mdc`       | CI, Docker, deploy             |

Hub e guias longos: [`AGENTS.md`](../../AGENTS.md), [`docs/agents/`](../../docs/agents/).
