import { createSupabaseWikiCodexRepository } from "./adapters/supabase/wiki-codex.repository";

export async function getWikiCodexRepository() {
  return createSupabaseWikiCodexRepository();
}
