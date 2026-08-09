import { createSupabaseCodexRepository } from "./adapters/supabase/codex.repository";

let cached: ReturnType<typeof createSupabaseCodexRepository> | null = null;

export async function getCodexRepository() {
  if (!cached) {
    cached = createSupabaseCodexRepository();
  }
  return cached;
}
