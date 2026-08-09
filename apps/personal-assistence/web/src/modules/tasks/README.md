# Módulo Tasks

Use cases de tarefas (iniciar, pausar, retomar, finalizar, lançamento manual).

## Estrutura

- `application/queries.ts` — use cases (antes em `lib/tasks/queries.ts`)
- `domain/errors.ts` — catálogo `TASK_ERRORS`

## Import

Preferir:

```typescript
import { startTask } from "@/modules/tasks/application/queries";
import { TASK_ERRORS } from "@/modules/tasks/domain/errors";
```

`@/lib/tasks/queries` reexporta por compatibilidade.
