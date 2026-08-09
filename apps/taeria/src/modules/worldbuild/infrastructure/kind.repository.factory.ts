import type { KindRepository } from "../domain/kind.repository";
import { createSupabaseKindRepository } from "./adapters/supabase/kind.repository";

let cached: KindRepository | null = null;

export async function getKindRepository(): Promise<KindRepository> {
  if (!cached) {
    cached = createSupabaseKindRepository();
  }
  return cached as KindRepository;
}
