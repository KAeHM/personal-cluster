# Agent: Presentation

## Server Actions

- Arquivo com `"use server"` no topo.
- Validar `FormData`/input com Zod do módulo.
- Chamar use case; retornar estado tipado (`types.ts`) para `useActionState`.
- Mutação que afeta página: `revalidatePath`.

## Client Components

Problema clássico: barrel export re-exporta actions e puxa Drizzle/postgres para o bundle.

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
