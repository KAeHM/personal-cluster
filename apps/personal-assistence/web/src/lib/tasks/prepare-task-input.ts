import { buildTaskDescription } from "@/lib/groups/task-description";
import { getWorkGroupForUser, touchWorkGroup } from "@/lib/groups/queries";

export async function prepareTaskInput(
  userId: string,
  description: string,
  groupId?: string,
): Promise<{ description: string; groupId?: string }> {
  const trimmed = description.trim();
  if (!trimmed) {
    throw new Error("Descrição é obrigatória");
  }

  if (!groupId) {
    return { description: trimmed };
  }

  const group = await getWorkGroupForUser(userId, groupId);
  if (!group) {
    throw new Error("Contexto não encontrado");
  }

  await touchWorkGroup(groupId);

  return {
    description: buildTaskDescription(trimmed, group.label),
    groupId: group.id,
  };
}
