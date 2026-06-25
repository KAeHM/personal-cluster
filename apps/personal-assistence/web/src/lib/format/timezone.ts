import { TZDate } from "@date-fns/tz";

export function formatTimeInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function parseDateTimeInTimezone(
  input: string,
  timezone: string,
): Date {
  const parsed = new TZDate(input, timezone);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data/hora inválida: ${input}`);
  }
  return parsed;
}

export function parseEndTime(
  input: string | undefined,
  timezone: string,
  reference: Date = new Date(),
): Date {
  if (!input) return new Date();

  if (/[-T]/.test(input)) {
    const parsed = new TZDate(input, timezone);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Horário inválido: ${input}`);
    }
    return parsed;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!match) {
    throw new Error(`Horário inválido: ${input}`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const ref = TZDate.tz(timezone, reference);

  return TZDate.tz(
    timezone,
    ref.getFullYear(),
    ref.getMonth(),
    ref.getDate(),
    hours,
    minutes,
  );
}
