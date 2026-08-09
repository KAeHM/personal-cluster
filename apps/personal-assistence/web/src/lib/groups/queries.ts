import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { groupAliases, workGroups } from "@/lib/db/schema";
import type { WorkGroup } from "@/lib/db/schema";
import { formatGroupLabel, normalizeGroupKey } from "@/lib/groups/normalize";

export async function listWorkGroupsForUser(
  userId: string,
): Promise<WorkGroup[]> {
  return db.query.workGroups.findMany({
    where: eq(workGroups.userId, userId),
    orderBy: [desc(workGroups.lastUsedAt), desc(workGroups.usageCount)],
  });
}

async function findGroupByNormalizedKey(
  userId: string,
  normalizedKey: string,
): Promise<WorkGroup | null> {
  const direct = await db.query.workGroups.findFirst({
    where: and(
      eq(workGroups.userId, userId),
      eq(workGroups.normalizedKey, normalizedKey),
    ),
  });

  if (direct) return direct;

  const aliasMatch = await db
    .select({ group: workGroups })
    .from(groupAliases)
    .innerJoin(workGroups, eq(groupAliases.groupId, workGroups.id))
    .where(
      and(
        eq(workGroups.userId, userId),
        eq(groupAliases.aliasNormalized, normalizedKey),
      ),
    )
    .limit(1);

  return aliasMatch[0]?.group ?? null;
}

export async function getWorkGroupForUser(
  userId: string,
  groupId: string,
): Promise<WorkGroup | null> {
  const group = await db.query.workGroups.findFirst({
    where: and(eq(workGroups.id, groupId), eq(workGroups.userId, userId)),
  });

  return group ?? null;
}

export async function createWorkGroup(
  userId: string,
  label: string,
): Promise<WorkGroup> {
  const normalizedKey = normalizeGroupKey(label);
  if (!normalizedKey) {
    throw new Error("Nome do grupo inválido");
  }

  const existing = await findGroupByNormalizedKey(userId, normalizedKey);
  if (existing) return existing;

  const inserted = await db
    .insert(workGroups)
    .values({
      userId,
      label: formatGroupLabel(label),
      normalizedKey,
      usageCount: 0,
    })
    .onConflictDoNothing({
      target: [workGroups.userId, workGroups.normalizedKey],
    })
    .returning();

  if (inserted[0]) return inserted[0];

  const afterConflict = await findGroupByNormalizedKey(userId, normalizedKey);
  if (!afterConflict) {
    throw new Error("Não foi possível criar o grupo");
  }

  return afterConflict;
}

export async function touchWorkGroup(groupId: string): Promise<void> {
  await db
    .update(workGroups)
    .set({
      usageCount: sql`${workGroups.usageCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(eq(workGroups.id, groupId));
}

export async function listWorkGroupsWithAliases(userId: string) {
  const groups = await db.query.workGroups.findMany({
    where: eq(workGroups.userId, userId),
    with: { aliases: true },
    orderBy: [desc(workGroups.lastUsedAt), desc(workGroups.usageCount)],
  });

  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    normalizedKey: group.normalizedKey,
    usageCount: group.usageCount,
    lastUsedAt: group.lastUsedAt?.toISOString() ?? null,
    aliases: group.aliases.map(
      (alias) => alias.aliasLabel ?? alias.aliasNormalized,
    ),
  }));
}
