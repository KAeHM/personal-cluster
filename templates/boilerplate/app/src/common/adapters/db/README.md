# Database adapters

Slot dos **clients de conexão** de banco. Na `main` a stack default é **Drizzle + Postgres**:
o client vive em [`drizzle/client.ts`](drizzle/client.ts).

## O padrão (duas camadas)

```
common/adapters/db/            # CLIENTS de conexão (compartilhado, sem domínio)
  drizzle/client.ts            # instância do Drizzle (postgres-js), singleton lazy

modules/<m>/                    # ACESSO a dados (por módulo, com domínio)
  domain/<entity>.repository.ts          # a PORT (interface, agnóstica)
  infrastructure/
    adapters/<tool>/<entity>.repository.ts  # impl concreta (mapeia row → domínio)
    adapters/<tool>/schema.ts               # schema da tabela (Drizzle)
    <entity>.repository.factory.ts          # seam que entrega a impl
```

Regras do padrão (válidas em qualquer stack):

- A aplicação acessa dados **só pela port** (`domain/<entity>.repository.ts`), nunca
  importando um client de banco direto em regra de negócio.
- A implementação concreta mora em `infrastructure/adapters/<tool>/` e **mapeia a linha do
  banco para a entidade de domínio** (`toDomain`). Nunca vaze o tipo bruto do tool.
- O **factory** é o ponto de costura: retorna a impl da stack default; trocar de tool é
  implementar outro adapter e apontar o factory aqui.

## Schema e migrations

Cada módulo é dono do próprio `schema.ts` (em `infrastructure/**/drizzle/schema.ts`). O
[`drizzle.config.ts`](../../../../drizzle.config.ts) agrega todos via glob.

```bash
npm run db:generate   # gera migration a partir dos schemas
npm run db:migrate    # aplica no banco (DATABASE_URL)
npm run db:studio     # Drizzle Studio
npm run db:seed       # popula dados de exemplo
```

## Trocar de stack (numa branch)

1. Crie uma branch a partir da `main`.
2. Adicione o novo client em `common/adapters/db/<tool>/client.ts` e a dep no `package.json`.
3. Implemente os repositórios em `modules/<m>/infrastructure/adapters/<tool>/`.
4. Faça o factory retornar a nova impl. `domain`/`application` não mudam.
