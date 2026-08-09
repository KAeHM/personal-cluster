import type {
  ListCodexEntriesParams,
  ListCodexEntriesResult,
} from "../../domain/codex-entry";
import { getCodexRepository } from "../../infrastructure/codex.repository.factory";

export async function listCodexEntries(
  params: ListCodexEntriesParams = {},
): Promise<ListCodexEntriesResult> {
  const repo = await getCodexRepository();
  return repo.list(params);
}
