import { getCodexRepository } from "../../infrastructure/codex.repository.factory";

export async function searchCodexEntries(query: string, kindSlug?: string) {
  const repo = await getCodexRepository();
  return repo.search({ query, kindSlug, limit: 20 });
}
