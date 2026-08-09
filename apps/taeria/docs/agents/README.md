# Agentes especialistas

Guias curtos para IAs (e humanos) entenderem **como** codar neste boilerplate. O hub principal
é [`AGENTS.md`](../../AGENTS.md); regras automáticas no Cursor ficam em
[`.cursor/rules/`](../../.cursor/rules/).

**Projeto derivado:** escopo de negócio em `PROJECT.md` (criar a partir de
[`PROJECT.md.example`](../../PROJECT.md.example)); roteiro em
[`docs/derive-project.md`](../derive-project.md).

| Agente         | Arquivo                            | Quando ler                           |
| -------------- | ---------------------------------- | ------------------------------------ |
| Architect      | [architecture.md](architecture.md) | Novo código, dúvida de camada/import |
| Feature module | [modules.md](modules.md)           | CRUD, novo módulo, use cases         |
| Data           | [data.md](data.md)                 | Schema, migration, repositório       |
| Auth           | [auth.md](auth.md)                 | Login, sessão, guards, credentials   |
| API            | [api.md](api.md)                   | Route Handlers, `/api/v1`            |
| Presentation   | [presentation.md](presentation.md) | Server Actions, Client Components    |
| Errors         | [errors.md](errors.md)             | Catálogo, HTTP, logging              |
| Testing        | [testing.md](testing.md)           | Unit, integração, E2E                |
| DevOps         | [devops.md](devops.md)             | CI, CD, Docker, cluster              |

Documentação profunda (não duplicar aqui):

- [`src/modules/users/README.md`](../../src/modules/users/README.md) — exemplo end-to-end
- [`src/modules/auth/README.md`](../../src/modules/auth/README.md)
- [`src/common/adapters/db/README.md`](../../src/common/adapters/db/README.md)
- [`src/common/errors/README.md`](../../src/common/errors/README.md)
