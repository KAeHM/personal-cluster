"use server";

import { requireRole } from "@/modules/auth";
import { listKinds } from "../../application/use-cases/list-kinds";
import type { Kind } from "../../domain/kind";

export type ListKindsActionState = {
  ok: boolean;
  kinds?: Kind[];
  message?: string;
};

export async function listKindsAction(): Promise<ListKindsActionState> {
  try {
    await requireRole("admin");
    const kinds = await listKinds();
    return { ok: true, kinds };
  } catch {
    return { ok: false, message: "Não foi possível carregar os tipos." };
  }
}
