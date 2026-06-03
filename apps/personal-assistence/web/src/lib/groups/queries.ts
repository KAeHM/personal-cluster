import { and, desc, eq, gt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  groupAliases,
  pendingGroupClarifications,
  workGroups,
} from "@/lib/db/schema";
import type { WorkGroup } from "@/lib/db/schema";
import { formatGroupLabel, normalizeGroupKey } from "@/lib/groups/normalize";
import { areGroupKeysSimilar } from "@/lib/groups/similarity";

const PENDING_TTL_HOURS = 24;

export async function listWorkGroupsForUser(userId: string): Promise<WorkGroup[]> {
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

async function findSimilarGroup(
  userId: string,
  suggestedNormalized: string,
  suggestedLabel: string,
): Promise<WorkGroup | null> {
  const groups = await listWorkGroupsForUser(userId);

  for (const group of groups) {
    if (
      areGroupKeysSimilar(suggestedNormalized, group.normalizedKey) ||
      areGroupKeysSimilar(suggestedLabel, group.label)
    ) {
      if (group.normalizedKey !== suggestedNormalized) {
        return group;
      }
    }

    const aliases = await db.query.groupAliases.findMany({
      where: eq(groupAliases.groupId, group.id),
    });

    for (const alias of aliases) {
      if (areGroupKeysSimilar(suggestedNormalized, alias.aliasNormalized)) {
        if (alias.aliasNormalized !== suggestedNormalized) {
          return group;
        }
      }
    }
  }

  return null;
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

export async function addGroupAlias(
  groupId: string,
  aliasLabel: string,
): Promise<void> {
  const aliasNormalized = normalizeGroupKey(aliasLabel);
  if (!aliasNormalized) return;

  await db
    .insert(groupAliases)
    .values({
      groupId,
      aliasNormalized,
      aliasLabel: formatGroupLabel(aliasLabel),
    })
    .onConflictDoNothing();
}

export type ResolveGroupInput = {
  userId: string;
  groupId?: string;
  grupoSugerido?: string;
};

export type ResolveGroupResult =
  | { status: "resolved"; groupId: string }
  | {
      status: "needs_clarification";
      candidateGroup: WorkGroup;
      suggestedLabel: string;
      suggestedNormalized: string;
    }
  | { status: "none" };

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

export async function resolveGroupForTask(
  input: ResolveGroupInput,
): Promise<ResolveGroupResult> {
  const { userId, groupId, grupoSugerido } = input;

  if (groupId) {
    const group = await getWorkGroupForUser(userId, groupId);
    if (!group) {
      throw new Error("Grupo não encontrado");
    }

    if (grupoSugerido?.trim()) {
      const suggestedLabel = formatGroupLabel(grupoSugerido);
      const suggestedNormalized = normalizeGroupKey(grupoSugerido);

      if (suggestedNormalized && suggestedNormalized !== group.normalizedKey) {
        if (
          areGroupKeysSimilar(suggestedNormalized, group.normalizedKey) ||
          areGroupKeysSimilar(suggestedLabel, group.label)
        ) {
          return {
            status: "needs_clarification",
            candidateGroup: group,
            suggestedLabel,
            suggestedNormalized,
          };
        }

        const created = await createWorkGroup(userId, suggestedLabel);
        return { status: "resolved", groupId: created.id };
      }
    }

    return { status: "resolved", groupId: group.id };
  }

  if (!grupoSugerido?.trim()) {
    return { status: "none" };
  }

  const suggestedLabel = formatGroupLabel(grupoSugerido);
  const suggestedNormalized = normalizeGroupKey(grupoSugerido);

  if (!suggestedNormalized) {
    return { status: "none" };
  }

  const exact = await findGroupByNormalizedKey(userId, suggestedNormalized);
  if (exact) {
    return { status: "resolved", groupId: exact.id };
  }

  const similar = await findSimilarGroup(
    userId,
    suggestedNormalized,
    suggestedLabel,
  );

  if (similar) {
    return {
      status: "needs_clarification",
      candidateGroup: similar,
      suggestedLabel,
      suggestedNormalized,
    };
  }

  const created = await createWorkGroup(userId, suggestedLabel);
  return { status: "resolved", groupId: created.id };
}

export async function savePendingGroupClarification(input: {
  userId: string;
  suggestedLabel: string;
  suggestedNormalized: string;
  candidateGroupId: string;
  taskDescription: string;
  estimatedMinutes?: number;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + PENDING_TTL_HOURS * 60 * 60 * 1000);

  await db
    .delete(pendingGroupClarifications)
    .where(eq(pendingGroupClarifications.userId, input.userId));

  await db.insert(pendingGroupClarifications).values({
    userId: input.userId,
    suggestedLabel: input.suggestedLabel,
    suggestedNormalized: input.suggestedNormalized,
    candidateGroupId: input.candidateGroupId,
    taskDescription: input.taskDescription,
    estimatedMinutes: input.estimatedMinutes,
    expiresAt,
  });
}

export async function getActivePendingClarification(userId: string) {
  const now = new Date();

  const pending = await db.query.pendingGroupClarifications.findFirst({
    where: and(
      eq(pendingGroupClarifications.userId, userId),
      gt(pendingGroupClarifications.expiresAt, now),
    ),
    with: { candidateGroup: true },
  });

  return pending ?? null;
}

export async function clearPendingClarification(userId: string): Promise<void> {
  await db
    .delete(pendingGroupClarifications)
    .where(eq(pendingGroupClarifications.userId, userId));
}
