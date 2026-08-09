"use server";

import { revalidatePath } from "next/cache";
import { isAppError, logError } from "@/common/errors";
import { requireRole } from "@/modules/auth";
import { createKind } from "../../application/use-cases/create-kind";
import { deleteKind } from "../../application/use-cases/delete-kind";
import { updateKind } from "../../application/use-cases/update-kind";
import {
  createKindSchema,
  updateKindSchema,
} from "../../application/schemas/kind.schema";
import type { KindActionState } from "./types";

const REVALIDATE_PATH = "/studio/kinds";

function toFailure(error: unknown, fallback: string): KindActionState {
  logError(error);
  if (isAppError(error) && error.exposeToClient) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: fallback };
}

export async function createKindAction(
  input: unknown,
): Promise<KindActionState> {
  try {
    await requireRole("admin");

    const parsed = createKindSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Verifique os campos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    await createKind(parsed.data);
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Tipo de entidade criado." };
  } catch (error) {
    return toFailure(error, "Não foi possível criar o tipo de entidade.");
  }
}

export async function updateKindAction(
  id: string,
  input: unknown,
): Promise<KindActionState> {
  try {
    await requireRole("admin");

    const parsed = updateKindSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Verifique os campos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    await updateKind(id, parsed.data);
    revalidatePath(REVALIDATE_PATH);
    revalidatePath(`${REVALIDATE_PATH}/${id}/edit`);
    return { ok: true, message: "Tipo de entidade atualizado." };
  } catch (error) {
    return toFailure(error, "Não foi possível atualizar o tipo de entidade.");
  }
}

export async function deleteKindAction(id: string): Promise<KindActionState> {
  try {
    await requireRole("admin");
    await deleteKind(id);
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Tipo de entidade removido." };
  } catch (error) {
    return toFailure(error, "Não foi possível remover o tipo de entidade.");
  }
}
