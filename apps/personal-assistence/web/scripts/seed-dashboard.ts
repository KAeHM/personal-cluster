/**
 * Popula o banco com tarefas finalizadas semi-aleatórias para testar o dashboard.
 *
 * Uso:
 *   npm run db:seed
 *   npm run db:seed -- --count 500
 *   npm run db:seed -- --count 200 --from 2026-01-01 --to 2026-05-29
 *   npm run db:seed -- --months 12 --email dev@example.com
 *
 * Opções:
 *   --count <n>     Quantidade de tarefas (padrão: 500)
 *   --months <n>    Intervalo em meses até hoje se --from/--to omitidos (padrão: 3)
 *   --from <date>   Início do intervalo (yyyy-MM-dd)
 *   --to <date>     Fim do intervalo (yyyy-MM-dd, padrão: hoje)
 *   --email <email> Usuário alvo (senão: primeiro usuário do banco)
 *   --phone <phone> Usuário alvo por telefone
 */
import { config } from "dotenv";
import { subMonths } from "date-fns";
import { and, eq } from "drizzle-orm";

import { db } from "../src/lib/db";
import { taskEvents, tasks, users, workGroups } from "../src/lib/db/schema";
import {
  formatGroupLabel,
  normalizeGroupKey,
} from "../src/lib/groups/normalize";

config({ path: ".env.local" });
config({ path: ".env" });

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.ALLOW_DB_SEED === "true";

if (!isDev) {
  console.error(
    "seed-dashboard só pode rodar em desenvolvimento ou com ALLOW_DB_SEED=true.",
  );
  process.exit(1);
}

const CONTEXT_LABELS = [
  "Cliente Acme",
  "Projeto interno",
  "Rosane",
  "Suporte",
] as const;

const TASK_DESCRIPTIONS = [
  "Relatório mensal",
  "Revisão de código",
  "Reunião com cliente",
  "Documentação técnica",
  "Correção de bugs",
  "Planejamento da sprint",
  "Deploy em produção",
  "Análise de requisitos",
  "Testes de integração",
  "Refatoração do módulo",
  "Suporte ao time",
  "Alinhamento semanal",
  "Proposta comercial",
  "Onboarding de cliente",
  "Migração de dados",
] as const;

const BATCH_SIZE = 100;

type CliOptions = {
  count: number;
  from: Date;
  to: Date;
  email?: string;
  phone?: string;
};

function parseArgs(argv: string[]): CliOptions {
  let count = 500;
  let months = 3;
  let fromStr: string | undefined;
  let toStr: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--count" && next) {
      count = Number(next);
      index += 1;
    } else if (arg === "--months" && next) {
      months = Number(next);
      index += 1;
    } else if (arg === "--from" && next) {
      fromStr = next;
      index += 1;
    } else if (arg === "--to" && next) {
      toStr = next;
      index += 1;
    } else if (arg === "--email" && next) {
      email = next;
      index += 1;
    } else if (arg === "--phone" && next) {
      phone = next;
      index += 1;
    }
  }

  if (!Number.isFinite(count) || count < 1) {
    throw new Error("--count deve ser um número positivo");
  }

  const to = toStr ? parseDateOnly(toStr, "fim do dia") : endOfToday();
  let from: Date;

  if (fromStr) {
    from = parseDateOnly(fromStr, "início do dia");
  } else {
    if (!Number.isFinite(months) || months < 1) {
      throw new Error("--months deve ser um número positivo");
    }
    from = subMonths(to, months);
    from.setHours(0, 0, 0, 0);
  }

  if (from >= to) {
    throw new Error("A data --from deve ser anterior a --to");
  }

  return { count, from, to, email, phone };
}

function parseDateOnly(value: string, label: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Data inválida (${label}): use yyyy-MM-dd`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    throw new Error(`Data inválida (${label}): ${value}`);
  }

  if (label.startsWith("fim")) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

function endOfToday(): Date {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

function randomStartedAndEnded(
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number,
): { startedAt: Date; endedAt: Date } {
  const durationMs = durationMinutes * 60_000;
  const latestStart = rangeEnd.getTime() - durationMs;

  if (latestStart <= rangeStart.getTime()) {
    throw new Error(
      "Intervalo de datas muito curto para a duração mínima das tarefas",
    );
  }

  const startedAt = new Date(
    rangeStart.getTime() + Math.random() * (latestStart - rangeStart.getTime()),
  );
  const endedAt = new Date(startedAt.getTime() + durationMs);

  return { startedAt, endedAt };
}

async function resolveUser(email?: string) {
  if (email) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) throw new Error(`Usuário não encontrado: ${email}`);
    return user;
  }

  const user = await db.query.users.findFirst();
  if (!user) {
    throw new Error(
      "Nenhum usuário no banco. Faça login uma vez ou use --email.",
    );
  }

  return user;
}

async function ensureWorkGroups(userId: string) {
  const groups: { id: string; label: string }[] = [];

  for (const label of CONTEXT_LABELS) {
    const normalizedKey = normalizeGroupKey(label);
    const existing = await db.query.workGroups.findFirst({
      where: and(
        eq(workGroups.userId, userId),
        eq(workGroups.normalizedKey, normalizedKey),
      ),
    });

    if (existing) {
      groups.push({ id: existing.id, label: existing.label });
      continue;
    }

    const [row] = await db
      .insert(workGroups)
      .values({
        userId,
        label: formatGroupLabel(label),
        normalizedKey,
        usageCount: 0,
        lastUsedAt: new Date(),
      })
      .returning({ id: workGroups.id, label: workGroups.label });

    if (row) groups.push(row);
  }

  return groups;
}

function pickGroupId(groups: { id: string }[]): string | null {
  const roll = Math.random();
  if (roll < 0.2) return null;
  return pick(groups).id;
}

async function insertTaskBatch(
  userId: string,
  groups: { id: string }[],
  rangeStart: Date,
  rangeEnd: Date,
  batchCount: number,
) {
  const taskRows: (typeof tasks.$inferInsert)[] = [];

  for (let index = 0; index < batchCount; index += 1) {
    const durationMinutes = randomInt(15, 180);
    const { startedAt, endedAt } = randomStartedAndEnded(
      rangeStart,
      rangeEnd,
      durationMinutes,
    );

    taskRows.push({
      userId,
      description: pick(TASK_DESCRIPTIONS),
      status: "closed",
      groupId: pickGroupId(groups),
      trackedMinutes: durationMinutes,
      activatedAt: null,
      startedAt,
      endedAt,
      durationMinutes,
      estimatedMinutes: randomInt(30, 240),
      createdAt: startedAt,
      updatedAt: endedAt,
    });
  }

  const inserted = await db.insert(tasks).values(taskRows).returning({
    id: tasks.id,
    userId: tasks.userId,
    startedAt: tasks.startedAt,
    endedAt: tasks.endedAt,
    durationMinutes: tasks.durationMinutes,
  });

  const eventRows: (typeof taskEvents.$inferInsert)[] = [];

  for (const task of inserted) {
    const duration = task.durationMinutes ?? 0;

    eventRows.push({
      taskId: task.id,
      userId: task.userId,
      type: "started",
      occurredAt: task.startedAt,
      segmentMinutes: null,
      trackedMinutesAfter: 0,
    });

    eventRows.push({
      taskId: task.id,
      userId: task.userId,
      type: "finished",
      occurredAt: task.endedAt!,
      segmentMinutes: duration,
      trackedMinutesAfter: duration,
    });
  }

  if (eventRows.length > 0) {
    await db.insert(taskEvents).values(eventRows);
  }

  return inserted.length;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log("=== Seed dashboard — tarefas aleatórias ===\n");

  const user = await resolveUser(options.email);
  console.log(`Usuário: ${user.name ?? user.email ?? user.id}`);
  console.log(
    `Intervalo: ${options.from.toISOString().slice(0, 10)} → ${options.to.toISOString().slice(0, 10)}`,
  );
  console.log(`Quantidade: ${options.count}\n`);

  const groups = await ensureWorkGroups(user.id);
  console.log(`Contextos: ${groups.map((group) => group.label).join(", ")}`);

  let created = 0;

  while (created < options.count) {
    const remaining = options.count - created;
    const batchCount = Math.min(BATCH_SIZE, remaining);
    const inserted = await insertTaskBatch(
      user.id,
      groups,
      options.from,
      options.to,
      batchCount,
    );
    created += inserted;
    console.log(`  ${created}/${options.count} tarefas…`);
  }

  console.log(
    `\n✓ ${created} tarefas finalizadas criadas com eventos de timeline.`,
  );
}

main().catch((error) => {
  console.error("Seed falhou:", error);
  process.exit(1);
});
