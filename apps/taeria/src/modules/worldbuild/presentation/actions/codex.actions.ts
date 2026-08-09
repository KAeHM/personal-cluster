"use server";

import { revalidatePath } from "next/cache";
import { isAppError, logError } from "@/common/errors";
import { uploadCodexAsset } from "@/common/adapters/supabase/storage";
import { requireRole } from "@/modules/auth";
import { createCodexEntry } from "../../application/use-cases/create-codex-entry";
import { createCodexFromDraft } from "../../application/use-cases/create-codex-from-draft";
import { deleteCodexEntry } from "../../application/use-cases/delete-codex-entry";
import { searchCodexEntries } from "../../application/use-cases/search-codex-entries";
import { updateCodexEntry } from "../../application/use-cases/update-codex-entry";
import type { CodexDraft } from "../../domain/codex-draft";
import type { CodexEntryPayload } from "../../application/schemas/validate-codex-entry";
import type { CodexActionState, CodexSearchActionState } from "./types";
import { formatCodexValidationDetails } from "./format-codex-action-error";

const REVALIDATE_PATHS = [
  "/studio/create",
  "/studio/entries",
  "/wiki",
] as const;

function revalidateCodexPaths(entryId?: string) {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  if (entryId) {
    revalidatePath(`/studio/entries/${entryId}`);
    revalidatePath(`/studio/entries/${entryId}/edit`);
  }
  revalidatePath("/wiki");
}

function toClientMessage(error: unknown, fallback: string): string {
  if (isAppError(error) && error.exposeToClient) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim() !== ""
  ) {
    return error.message;
  }

  return fallback;
}

function toFailure(error: unknown, fallback: string): CodexActionState {
  logError(error);
  const details = isAppError(error)
    ? formatCodexValidationDetails(error.meta)
    : [];

  const message =
    details.length > 0
      ? "Alguns campos precisam ser corrigidos antes de salvar."
      : toClientMessage(error, fallback);

  return {
    ok: false,
    message,
    ...(details.length > 0 ? { details } : {}),
  };
}

export async function createCodexFromDraftAction(
  draft: CodexDraft,
): Promise<CodexActionState> {
  try {
    await requireRole("admin");

    const entry = await createCodexFromDraft(draft);
    revalidateCodexPaths(entry.id);
    return {
      ok: true,
      message: "Entidade criada no codex.",
      entryId: entry.id,
      entrySlug: entry.slug,
    };
  } catch (error) {
    return toFailure(error, "Não foi possível criar a entidade.");
  }
}

export async function createCodexEntryAction(
  kindSlug: string,
  payload: CodexEntryPayload,
): Promise<CodexActionState> {
  try {
    await requireRole("admin");

    const entry = await createCodexEntry(kindSlug, payload);
    revalidateCodexPaths(entry.id);
    return {
      ok: true,
      message: "Entrada criada no codex.",
      entryId: entry.id,
      entrySlug: entry.slug,
    };
  } catch (error) {
    return toFailure(error, "Não foi possível criar a entrada.");
  }
}

export async function updateCodexEntryAction(
  id: string,
  payload: CodexEntryPayload,
): Promise<CodexActionState> {
  try {
    await requireRole("admin");

    const entry = await updateCodexEntry(id, payload);
    revalidateCodexPaths(entry.id);
    return {
      ok: true,
      message: "Entrada atualizada.",
      entryId: entry.id,
      entrySlug: entry.slug,
    };
  } catch (error) {
    return toFailure(error, "Não foi possível atualizar a entrada.");
  }
}

export async function searchCodexEntriesAction(
  query: string,
  kindSlug?: string,
): Promise<CodexSearchActionState> {
  try {
    await requireRole("admin");

    const entries = await searchCodexEntries(query, kindSlug);
    return {
      ok: true,
      entries: entries.map((entry) => ({
        slug: entry.slug,
        title: entry.title,
        kindSlug: entry.kindSlug,
      })),
    };
  } catch (error) {
    logError(error);
    return { ok: false, entries: [] };
  }
}

export async function deleteCodexEntryAction(
  id: string,
): Promise<CodexActionState> {
  try {
    await requireRole("admin");

    await deleteCodexEntry(id);
    revalidateCodexPaths(id);
    return { ok: true, message: "Entrada removida." };
  } catch (error) {
    return toFailure(error, "Não foi possível remover a entrada.");
  }
}

export async function uploadCodexImageAction(
  formData: FormData,
): Promise<CodexActionState> {
  try {
    await requireRole("admin");

    const file = formData.get("file");
    const kindSlug = formData.get("kindSlug");
    const entrySlug = formData.get("entrySlug");
    const fieldKey = formData.get("fieldKey");

    if (!(file instanceof File)) {
      return { ok: false, message: "Arquivo inválido." };
    }

    if (
      typeof kindSlug !== "string" ||
      typeof entrySlug !== "string" ||
      typeof fieldKey !== "string" ||
      !kindSlug.trim() ||
      !entrySlug.trim() ||
      !fieldKey.trim()
    ) {
      return { ok: false, message: "Metadados do upload incompletos." };
    }

    const result = await uploadCodexAsset({
      kindSlug: kindSlug.trim(),
      entrySlug: entrySlug.trim(),
      fieldKey: fieldKey.trim(),
      file,
    });

    return {
      ok: true,
      url: result.url,
      message: "Imagem enviada.",
    };
  } catch (error) {
    return toFailure(error, "Não foi possível enviar a imagem.");
  }
}
