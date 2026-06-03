import {
  and,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { CONTEXT_NONE_ID } from "@/lib/dashboard/filters";
import type { DashboardFilters } from "@/lib/dashboard/types";
import { tasks } from "@/lib/db/schema";

export function periodDateCondition(
  timezone: string,
  filters: DashboardFilters,
) {
  const startedDate = sql`(${tasks.startedAt} AT TIME ZONE ${timezone})::date`;
  const today = sql`(now() AT TIME ZONE ${timezone})::date`;

  switch (filters.period) {
    case "today":
      return sql`${startedDate} = ${today}`;
    case "week":
      return gte(startedDate, sql`(${today} - interval '6 days')`);
    case "month":
      return gte(
        startedDate,
        sql`date_trunc('month', now() AT TIME ZONE ${timezone})::date`,
      );
    case "quarter":
      return gte(startedDate, sql`(${today} - interval '89 days')`);
    case "year":
      return gte(
        startedDate,
        sql`date_trunc('year', now() AT TIME ZONE ${timezone})::date`,
      );
    case "custom":
      if (filters.from && filters.to) {
        return and(
          gte(startedDate, sql`${filters.from}::date`),
          lte(startedDate, sql`${filters.to}::date`),
        );
      }
      return gte(startedDate, sql`(${today} - interval '6 days')`);
    default:
      return sql`${startedDate} = ${today}`;
  }
}

export function groupCondition(filters: DashboardFilters) {
  const groupIds = filters.groupIds;
  if (!groupIds || groupIds.length === 0) return undefined;

  const includesNone = groupIds.includes(CONTEXT_NONE_ID);
  const realIds = groupIds.filter((id) => id !== CONTEXT_NONE_ID);

  if (includesNone && realIds.length > 0) {
    return or(isNull(tasks.groupId), inArray(tasks.groupId, realIds));
  }

  if (includesNone) return isNull(tasks.groupId);
  if (realIds.length === 1) return eq(tasks.groupId, realIds[0]);
  return inArray(tasks.groupId, realIds);
}

export function searchCondition(filters: DashboardFilters) {
  const search = filters.search?.trim();
  if (!search) return undefined;
  return ilike(tasks.description, `%${search}%`);
}
