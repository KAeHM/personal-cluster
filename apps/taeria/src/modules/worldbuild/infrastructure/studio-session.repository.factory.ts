import { createSupabaseStudioSessionRepository } from "./adapters/supabase/studio-session.repository";

let cached: ReturnType<typeof createSupabaseStudioSessionRepository> | null =
  null;

export async function getStudioSessionRepository() {
  if (!cached) {
    cached = createSupabaseStudioSessionRepository();
  }
  return cached;
}
