import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/common/env";

let cached: SupabaseClient | null = null;

/**
 * Client com service role — bypassa RLS. Usar apenas no servidor para
 * operações administrativas (seed, API externa, CRUD via use cases).
 */
export function createSupabaseAdminClient(): SupabaseClient {
  if (cached) {
    return cached;
  }

  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();

  cached = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cached;
}
