import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase para Client Components (Realtime, Storage, etc.).
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios.",
    );
  }

  return createBrowserClient(url, anonKey);
}
