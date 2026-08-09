# Agent: Architect

## Pergunta-guia

“Em qual camada isso vive e quem pode importar quem?”

## Mapa mental

```
src/
  app/              # rotas Next (finas)
  common/           # infra compartilhada, sem domínio
  modules/<feat>/   # features em 4 camadas
supabase/
  migrations/       # schema SQL versionado (Supabase Cloud)
```

## Fluxo de dependência

```
presentation → application → domain ← infrastructure
```

- `domain` não conhece Zod, Supabase SDK, React.
- `application` orquestra ports; não faz SQL nem HTTP direto.
- `infrastructure` implementa ports e expõe factories.
- `presentation` traduz HTTP/UI para chamadas de application.

## Decisões rápidas

| Preciso de…                 | Onde                            |
| --------------------------- | ------------------------------- |
| Regra de negócio            | `application/use-cases/`        |
| Contrato de persistência    | `domain/*.repository.ts`        |
| Tabela SQL / RLS            | `supabase/migrations/*.sql`     |
| Validação de formulário/API | `application/schemas/`          |
| Erro de negócio tipado      | `domain/errors.ts`              |
| Login / sessão              | módulo `auth` (facade + guards) |

## Anti-padrões

- Importar client Supabase em use case.
- Importar `@supabase/*` fora de `infrastructure/` e `common/adapters/supabase/`.
- Barrel `@/modules/x` em Client Component.
