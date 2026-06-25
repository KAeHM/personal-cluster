"use server";

import { revalidatePath } from "next/cache";
import { isAppError, logError } from "@/common/errors";
import { requireAuth } from "@/modules/auth";
import { createUser } from "../../application/use-cases/create-user";
import { deleteUser } from "../../application/use-cases/delete-user";
import { updateUser } from "../../application/use-cases/update-user";
import {
  createUserSchema,
  updateUserSchema,
} from "../../application/schemas/user.schema";
import type { UserActionState } from "./types";

/**
 * Entrada interna (RSC/forms). Diferente do Route Handler externo: autentica
 * por sessão (NextAuth) via `requireAuth`, mas chama os mesmos use cases.
 */
const REVALIDATE_PATH = "/preview";

function toFailure(error: unknown, fallback: string): UserActionState {
  logError(error);
  if (isAppError(error) && error.exposeToClient) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: fallback };
}

export async function createUserAction(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  try {
    await requireAuth();

    const rawName = formData.get("name");
    const rawRole = formData.get("role");
    const parsed = createUserSchema.safeParse({
      email: formData.get("email"),
      name: rawName ? String(rawName) : null,
      role: rawRole ? String(rawRole) : undefined,
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: "Verifique os campos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    await createUser(parsed.data);
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Usuário criado." };
  } catch (error) {
    return toFailure(error, "Não foi possível criar o usuário.");
  }
}

export async function updateUserAction(
  id: string,
  input: unknown,
): Promise<UserActionState> {
  try {
    await requireAuth();

    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Verifique os campos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    await updateUser(id, parsed.data);
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Usuário atualizado." };
  } catch (error) {
    return toFailure(error, "Não foi possível atualizar o usuário.");
  }
}

export async function deleteUserAction(id: string): Promise<UserActionState> {
  try {
    await requireAuth();
    await deleteUser(id);
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Usuário removido." };
  } catch (error) {
    return toFailure(error, "Não foi possível remover o usuário.");
  }
}
