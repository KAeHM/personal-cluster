/**
 * Popula 1 mês de tarefas realistas no contexto Rosane.
 *
 * Uso:
 *   npm run db:seed-rosane
 *   npm run db:seed-rosane -- --from 2026-05-01 --to 2026-05-31 --email seu@email.com
 *
 * Opções:
 *   --from <date>   Início do intervalo (yyyy-MM-dd, padrão: 1 mês antes de --to)
 *   --to <date>     Fim do intervalo (yyyy-MM-dd, padrão: hoje)
 *   --email <email> Usuário alvo
 *   --phone <phone> Usuário alvo por telefone
 */
import { TZDate } from "@date-fns/tz";
import { config } from "dotenv";
import { and, eq, sql } from "drizzle-orm";

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
    "seed-rosane-month só pode rodar em desenvolvimento ou com ALLOW_DB_SEED=true.",
  );
  process.exit(1);
}

const CONTEXT_LABEL = "Rosane";
const MAX_DAILY_MINUTES = 10 * 60;
const MIN_MONTH_MINUTES = 72 * 60;
const MAX_PR_MONTH_MINUTES = 3 * 60;
const PAUSE_BETWEEN_TASKS_MIN = 20;
const PAUSE_BETWEEN_TASKS_MAX = 120;

type TaskType = {
  title: string;
  weight: number;
  minMinutes: number;
  maxMinutes: number;
  longBias: number;
  commercialOnly?: boolean;
  monthlyCapMinutes?: number;
};

const TASK_TYPES: TaskType[] = [
  {
    title: "Diana",
    weight: 0.5,
    minMinutes: 121,
    maxMinutes: 240,
    longBias: 0.85,
  },
  {
    title: "Correção de PR",
    weight: 0.27,
    minMinutes: 30,
    maxMinutes: 120,
    longBias: 0.5,
    monthlyCapMinutes: MAX_PR_MONTH_MINUTES,
  },
  {
    title: "Manutenção",
    weight: 0.1,
    minMinutes: 30,
    maxMinutes: 90,
    longBias: 0.35,
  },
  {
    title: "Duvidas",
    weight: 0.07,
    minMinutes: 1,
    maxMinutes: 10,
    longBias: 0,
  },
  {
    title: "Reunião",
    weight: 0.06,
    minMinutes: 120,
    maxMinutes: 180,
    longBias: 0.1,
    commercialOnly: true,
  },
];

const DIANA_TYPE = TASK_TYPES.find((type) => type.title === "Diana")!;

type CliOptions = {
  from: Date;
  to: Date;
  email?: string;
  phone?: string;
};

type PlannedTask = {
  description: string;
  startedAt: Date;
  endedAt: Date;
  durationMinutes: number;
};

type MonthState = {
  prMinutesUsed: number;
  totalMinutes: number;
  tasksByDay: Map<string, PlannedTask[]>;
  days: TZDate[];
};

function parseArgs(argv: string[]): CliOptions {
  let fromStr: string | undefined;
  let toStr: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--from" && next) {
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

  const to = toStr ? parseDateOnly(toStr, true) : endOfToday();
  const from = fromStr
    ? parseDateOnly(fromStr, false)
    : (() => {
        const date = new Date(to);
        date.setMonth(date.getMonth() - 1);
        date.setHours(0, 0, 0, 0);
        return date;
      })();

  if (from >= to) {
    throw new Error("A data --from deve ser anterior a --to");
  }

  return { from, to, email, phone };
}

function parseDateOnly(value: string, endOfDay: boolean): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Data inválida: use yyyy-MM-dd (${value})`);
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
    throw new Error(`Data inválida: ${value}`);
  }

  if (endOfDay) {
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

function random(): number {
  return Math.random();
}

function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

function pickWeighted(items: readonly TaskType[]): TaskType {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * total;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }

  return items[items.length - 1]!;
}

function getPrRemaining(state: MonthState): number {
  return Math.max(0, MAX_PR_MONTH_MINUTES - state.prMinutesUsed);
}

function getTypeMaxDuration(
  type: TaskType,
  remaining: number,
  state: MonthState,
): number {
  let max = Math.min(type.maxMinutes, remaining);

  if (type.title === "Correção de PR") {
    max = Math.min(max, getPrRemaining(state));
  }

  return max;
}

function canPickType(
  type: TaskType,
  remaining: number,
  state: MonthState,
): boolean {
  const max = getTypeMaxDuration(type, remaining, state);
  return max >= type.minMinutes;
}

function pickAvailableType(
  remaining: number,
  state: MonthState,
): TaskType | null {
  const available = TASK_TYPES.filter((type) =>
    canPickType(type, remaining, state),
  );

  if (available.length === 0) return null;
  return pickWeighted(available);
}

function pickDuration(
  type: TaskType,
  remaining: number,
  state: MonthState,
): number {
  const max = getTypeMaxDuration(type, remaining, state);
  if (max < type.minMinutes) return 0;

  let duration = randomInt(type.minMinutes, max);

  if (type.title === "Diana" && duration <= 120) {
    duration = 121;
  }

  if (duration >= 90 && random() < type.longBias) {
    duration = Math.min(max, duration + randomInt(15, 45));
  }

  if (type.title === "Diana" && duration <= 120) {
    duration = Math.min(max, 121);
  }

  if (type.title === "Duvidas") {
    duration = Math.min(10, duration);
  }

  if (type.title === "Manutenção") {
    duration = Math.max(30, Math.min(90, duration));
  }

  return duration;
}

function isWeekend(date: TZDate): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function atTime(base: TZDate, hour: number, minute = 0): TZDate {
  return TZDate.tz(
    base.timeZone,
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hour,
    minute,
  );
}

function nextDayAt(base: TZDate, hour: number, minute = 0): TZDate {
  return TZDate.tz(
    base.timeZone,
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + 1,
    hour,
    minute,
  );
}

function pickWeekdayDailyMinutes(): number {
  const roll = random();
  if (roll < 0.06) return 0;
  if (roll < 0.72) return randomInt(60, 210);
  if (roll < 0.9) return randomInt(211, 360);
  return randomInt(361, MAX_DAILY_MINUTES);
}

function pickWeekendDailyMinutes(): number {
  const roll = random();
  if (roll < 0.05) return 0;
  if (roll < 0.65) return randomInt(90, 300);
  if (roll < 0.9) return randomInt(301, 480);
  return randomInt(481, MAX_DAILY_MINUTES);
}

function pickSlotHour(
  slots: { start: number; end: number; weight: number }[],
): number {
  const total = slots.reduce((sum, slot) => sum + slot.weight, 0);
  let roll = random() * total;

  for (const slot of slots) {
    roll -= slot.weight;
    if (roll <= 0) {
      const latestStartHour = Math.max(slot.start, slot.end - 1);
      return randomInt(slot.start, latestStartHour);
    }
  }

  return slots[0]!.start;
}

function pickWeekdayStart(
  day: TZDate,
  durationMinutes: number,
  isLongTask: boolean,
  commercialOnly: boolean,
): TZDate | null {
  const slots = commercialOnly
    ? [{ start: 9, end: 18, weight: 1 }]
    : isLongTask
      ? [
          { start: 19, end: 22, weight: 0.7 },
          { start: 9, end: 18, weight: 0.2 },
          { start: 8, end: 9, weight: 0.05 },
          { start: 22, end: 23, weight: 0.05 },
        ]
      : [
          { start: 19, end: 22, weight: 0.35 },
          { start: 9, end: 18, weight: 0.45 },
          { start: 8, end: 9, weight: 0.1 },
          { start: 22, end: 23, weight: 0.1 },
        ];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const hour = pickSlotHour(slots);
    const minute = randomInt(0, 59);
    const start = atTime(day, hour, minute);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const dayEnd = atTime(day, 23, 59);

    if (end.getTime() <= dayEnd.getTime()) {
      return start;
    }
  }

  return null;
}

function pickWeekendStart(day: TZDate, durationMinutes: number): TZDate | null {
  const latestEnd = nextDayAt(day, 1, 0);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const evening = random() < 0.65;
    const hour = evening ? randomInt(18, 23) : randomInt(8, 17);
    const minute = randomInt(0, 59);
    const start = atTime(day, hour, minute);
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    if (
      start.getTime() >= atTime(day, 8, 0).getTime() &&
      end.getTime() <= latestEnd.getTime()
    ) {
      return start;
    }
  }

  return null;
}

function pickStartTime(
  day: TZDate,
  durationMinutes: number,
  isLongTask: boolean,
  taskType: TaskType,
): TZDate | null {
  if (isWeekend(day)) {
    return pickWeekendStart(day, durationMinutes);
  }

  return pickWeekdayStart(
    day,
    durationMinutes,
    isLongTask,
    taskType.commercialOnly === true,
  );
}

function pickStartAfter(
  day: TZDate,
  earliest: Date,
  durationMinutes: number,
  isLongTask: boolean,
  taskType: TaskType,
): TZDate | null {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = pickStartTime(day, durationMinutes, isLongTask, taskType);
    if (!candidate) continue;
    if (candidate.getTime() >= earliest.getTime()) {
      return candidate;
    }
  }

  const start = new TZDate(earliest, day.timeZone);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const dayEnd = isWeekend(day) ? nextDayAt(day, 1, 0) : atTime(day, 23, 59);

  if (end.getTime() <= dayEnd.getTime()) {
    return start;
  }

  return null;
}

function placeTaskOnDay(
  day: TZDate,
  taskType: TaskType,
  duration: number,
  existing: PlannedTask[],
): PlannedTask | null {
  const isLongTask = duration >= 90;
  let startedAt: TZDate | null = null;

  if (existing.length === 0) {
    startedAt = pickStartTime(day, duration, isLongTask, taskType);
  } else {
    const lastTask = existing[existing.length - 1]!;
    const pauseMs =
      randomInt(PAUSE_BETWEEN_TASKS_MIN, PAUSE_BETWEEN_TASKS_MAX) * 60_000;
    const earliest = new Date(lastTask.endedAt.getTime() + pauseMs);
    startedAt = pickStartAfter(day, earliest, duration, isLongTask, taskType);
  }

  if (!startedAt) return null;

  return {
    description: taskType.title,
    startedAt,
    endedAt: new Date(startedAt.getTime() + duration * 60_000),
    durationMinutes: duration,
  };
}

function registerTask(state: MonthState, day: TZDate, task: PlannedTask): void {
  const dayKey = formatDayLabel(day);
  const dayTasks = state.tasksByDay.get(dayKey) ?? [];
  dayTasks.push(task);
  state.tasksByDay.set(
    dayKey,
    dayTasks.sort(
      (left, right) => left.startedAt.getTime() - right.startedAt.getTime(),
    ),
  );
  state.totalMinutes += task.durationMinutes;

  if (task.description === "Correção de PR") {
    state.prMinutesUsed += task.durationMinutes;
  }
}

function planDay(day: TZDate, state: MonthState): void {
  const dailyBudget = isWeekend(day)
    ? pickWeekendDailyMinutes()
    : pickWeekdayDailyMinutes();

  if (dailyBudget === 0) return;

  const dayKey = formatDayLabel(day);
  let remaining = dailyBudget;
  const maxTasks = dailyBudget >= 360 ? randomInt(2, 4) : randomInt(1, 3);

  while (remaining > 0) {
    const existing = state.tasksByDay.get(dayKey) ?? [];
    if (existing.length >= maxTasks) break;

    const taskType = pickAvailableType(remaining, state);
    if (!taskType) break;

    const duration = pickDuration(taskType, remaining, state);
    if (duration <= 0) break;

    const task = placeTaskOnDay(day, taskType, duration, existing);
    if (!task) break;

    remaining -= duration;
    registerTask(state, day, task);
  }
}

function fillMonthToMinimum(state: MonthState): void {
  let attempts = 0;
  const maxAttempts = 500;

  while (state.totalMinutes < MIN_MONTH_MINUTES && attempts < maxAttempts) {
    attempts += 1;
    const day = pick(state.days);
    const dayKey = formatDayLabel(day);
    const existing = state.tasksByDay.get(dayKey) ?? [];

    const remainingBudget =
      MAX_DAILY_MINUTES -
      existing.reduce((sum, task) => sum + task.durationMinutes, 0);

    if (remainingBudget < DIANA_TYPE.minMinutes) continue;

    const duration = pickDuration(DIANA_TYPE, remainingBudget, state);

    if (duration < DIANA_TYPE.minMinutes) continue;

    const task = placeTaskOnDay(day, DIANA_TYPE, duration, existing);
    if (!task) continue;

    registerTask(state, day, task);
  }

  if (state.totalMinutes < MIN_MONTH_MINUTES) {
    throw new Error(
      `Não foi possível atingir o mínimo de ${MIN_MONTH_MINUTES / 60}h no mês (atingido: ${(state.totalMinutes / 60).toFixed(1)}h)`,
    );
  }
}

function* iterateDays(
  from: Date,
  to: Date,
  timezone: string,
): Generator<TZDate> {
  let current = TZDate.tz(
    timezone,
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
  );

  const end = TZDate.tz(
    timezone,
    to.getFullYear(),
    to.getMonth(),
    to.getDate(),
  );

  while (current.getTime() <= end.getTime()) {
    yield current;
    current = TZDate.tz(
      timezone,
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + 1,
    );
  }
}

function formatDayLabel(day: TZDate): string {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function planMonth(from: Date, to: Date, timezone: string): MonthState {
  const days = [...iterateDays(from, to, timezone)];
  const state: MonthState = {
    prMinutesUsed: 0,
    totalMinutes: 0,
    tasksByDay: new Map(),
    days,
  };

  for (const day of days) {
    planDay(day, state);
  }

  fillMonthToMinimum(state);
  return state;
}

async function resolveUser(email?: string) {
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${normalizedEmail}`,
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

async function ensureRosaneGroup(userId: string) {
  const normalizedKey = normalizeGroupKey(CONTEXT_LABEL);
  const existing = await db.query.workGroups.findFirst({
    where: and(
      eq(workGroups.userId, userId),
      eq(workGroups.normalizedKey, normalizedKey),
    ),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(workGroups)
    .values({
      userId,
      label: formatGroupLabel(CONTEXT_LABEL),
      normalizedKey,
      usageCount: 0,
      lastUsedAt: new Date(),
    })
    .returning();

  if (!created) {
    throw new Error("Não foi possível criar o contexto Rosane");
  }

  return created;
}

async function insertTasks(
  userId: string,
  groupId: string,
  planned: PlannedTask[],
): Promise<number> {
  if (planned.length === 0) return 0;

  const rows = planned.map((task) => ({
    userId,
    groupId,
    description: task.description,
    status: "closed" as const,
    trackedMinutes: task.durationMinutes,
    activatedAt: null,
    startedAt: task.startedAt,
    endedAt: task.endedAt,
    durationMinutes: task.durationMinutes,
    createdAt: task.startedAt,
    updatedAt: task.endedAt,
  }));

  const inserted = await db.insert(tasks).values(rows).returning({
    id: tasks.id,
    userId: tasks.userId,
    startedAt: tasks.startedAt,
    endedAt: tasks.endedAt,
    durationMinutes: tasks.durationMinutes,
  });

  const eventRows = inserted.flatMap((task) => {
    const duration = task.durationMinutes ?? 0;

    return [
      {
        taskId: task.id,
        userId: task.userId,
        type: "started" as const,
        occurredAt: task.startedAt,
        segmentMinutes: null,
        trackedMinutesAfter: 0,
      },
      {
        taskId: task.id,
        userId: task.userId,
        type: "finished" as const,
        occurredAt: task.endedAt!,
        segmentMinutes: duration,
        trackedMinutesAfter: duration,
      },
    ];
  });

  await db.insert(taskEvents).values(eventRows);
  return inserted.length;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const user = await resolveUser(options.email);
  const group = await ensureRosaneGroup(user.id);
  const monthPlan = planMonth(options.from, options.to, user.timezone);

  console.log("=== Seed Rosane — mês realista ===\n");
  console.log(`Usuário: ${user.name ?? user.email ?? user.id}`);
  console.log(`Timezone: ${user.timezone}`);
  console.log(
    `Intervalo: ${options.from.toISOString().slice(0, 10)} → ${options.to.toISOString().slice(0, 10)}`,
  );
  console.log(`Mínimo mensal: ${MIN_MONTH_MINUTES / 60}h`);
  console.log(`Máximo Correção de PR: ${MAX_PR_MONTH_MINUTES / 60}h`);
  console.log(
    `Pausa entre tarefas: ${PAUSE_BETWEEN_TASKS_MIN}-${PAUSE_BETWEEN_TASKS_MAX} min\n`,
  );

  let totalTasks = 0;
  const stats: Record<string, { count: number; minutes: number }> = {};

  const sortedDays = [...monthPlan.tasksByDay.entries()].sort(
    ([left], [right]) => left.localeCompare(right),
  );

  for (const [dayLabel, planned] of sortedDays) {
    const count = await insertTasks(user.id, group.id, planned);
    totalTasks += count;

    for (const task of planned) {
      const current = stats[task.description] ?? { count: 0, minutes: 0 };
      current.count += 1;
      current.minutes += task.durationMinutes;
      stats[task.description] = current;
    }

    const dayMinutes = planned.reduce(
      (sum, task) => sum + task.durationMinutes,
      0,
    );
    console.log(
      `  ${dayLabel}: ${planned.length} tarefa(s), ${(dayMinutes / 60).toFixed(1)}h`,
    );
  }

  console.log(`\n✓ ${totalTasks} tarefas criadas no contexto Rosane`);
  console.log(`  Total: ${(monthPlan.totalMinutes / 60).toFixed(1)} horas`);
  console.log(
    `  Correção de PR: ${(monthPlan.prMinutesUsed / 60).toFixed(1)}h / ${MAX_PR_MONTH_MINUTES / 60}h`,
  );
  console.log("\nDistribuição por tipo:");
  for (const [title, data] of Object.entries(stats).sort(
    (left, right) => right[1].minutes - left[1].minutes,
  )) {
    const pct =
      totalTasks > 0 ? ((data.count / totalTasks) * 100).toFixed(1) : "0";
    console.log(
      `  ${title}: ${data.count} tarefa(s) (${pct}%), ${(data.minutes / 60).toFixed(1)}h`,
    );
  }

  const fromIso = options.from.toISOString().slice(0, 10);
  const toIso = options.to.toISOString().slice(0, 10);
  console.log("\nPara ver no dashboard, ajuste o período:");
  console.log(`  /dashboard?period=custom&from=${fromIso}&to=${toIso}`);
  console.log("  ou selecione “3 meses” no filtro de datas.");
}

main().catch((error) => {
  console.error("Seed falhou:", error);
  process.exit(1);
});
