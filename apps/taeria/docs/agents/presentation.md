# Agent: Presentation

## Server Actions

- Arquivo com `"use server"` no topo.
- Validar `FormData`/input com Zod do módulo.
- Chamar use case; retornar estado tipado (`types.ts`) para `useActionState`.
- Mutação que afeta página: `revalidatePath`.

## Client Components

Problema clássico: barrel export re-exporta actions e puxa código server-only para o bundle.

**Sempre:**

- Actions: `@/modules/<m>/presentation/actions/<name>.actions`
- Types: `@/modules/<m>/presentation/actions/types`

**Tipos de domínio** (`User`, `UserRole`): ok importar de `domain/` em client.

## UI

- Componentes base: `@/common/components/ui/*`
- Layouts: `@/common/components/layouts/`
- Util: `cn()` de `@/common/utils/cn`

## App Router

- Páginas em `src/app/` — preferir Server Components; `"use client"` só quando precisar de estado/efeito.

## Wiki (jogador)

Rotas em `src/app/wiki/` — Server Components + use cases de `worldbuild`.

| Rota                 | Papel                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| `/wiki`              | Hub agrupado (`WikiHubKindSections`)                                        |
| `/wiki/kinds/[slug]` | Browse por kind (`WikiKindBrowseView` — grid, árvore, receita, equipamento) |
| `/wiki/[slug]`       | Artigo (`WikiEntryLayoutVariant` por `getWikiEntryLayoutMode`)              |

Config declarativa por kind: `src/modules/worldbuild/application/wiki/wiki-kind-config.ts`. Componentes wiki importam helpers desse módulo ou de `load-entry-card-meta.ts`; não duplicar mapeamentos na UI.

Browse colapsável (`WikiTaxonomyTree`) e filtros de equipamento são Client Components; páginas permanecem server-rendered e passam dados já resolvidos.
