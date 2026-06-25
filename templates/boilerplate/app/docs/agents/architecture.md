# Agent: Architect

## Pergunta-guia

“Em qual camada isso vive e quem pode importar quem?”

## Mapa mental

```
src/
  app/              # rotas Next (finas)
  common/           # infra compartilhada, sem domínio
  modules/<feat>/   # features em 4 camadas
```

## Fluxo de dependência

```
presentation → application → domain ← infrastructure
```

- `domain` não conhece Zod, Drizzle, NextAuth, React.
- `application` orquestra ports; não faz SQL nem HTTP direto.
- `infrastructure` implementa ports e expõe factories.
- `presentation` traduz HTTP/UI para chamadas de application.

## Decisões rápidas

| Preciso de…                 | Onde                                        |
| --------------------------- | ------------------------------------------- |
| Regra de negócio            | `application/use-cases/`                    |
| Contrato de persistência    | `domain/*.repository.ts`                    |
| Tabela SQL                  | `infrastructure/adapters/drizzle/schema.ts` |
| Validação de formulário/API | `application/schemas/`                      |
| Erro de negócio tipado      | `domain/errors.ts`                          |
| Login / sessão              | módulo `auth` (facade + guards)             |

## Anti-padrões

- Importar `getDb()` em use case.
- Importar `next-auth` fora de `infrastructure/session/`.
- Barrel `@/modules/x` em Client Component.
