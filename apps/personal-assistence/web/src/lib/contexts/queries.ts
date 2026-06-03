import type { ContextsData } from "@/lib/contexts/types";
import { listWorkGroupsWithAliases } from "@/lib/groups/queries";

export async function getContextsData(userId: string): Promise<ContextsData> {
  const contexts = await listWorkGroupsWithAliases(userId);

  return {
    contexts,
    fetchedAt: new Date().toISOString(),
  };
}
