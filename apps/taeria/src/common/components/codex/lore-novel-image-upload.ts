"use client";

import { toast } from "sonner";
import { createImageUpload, type UploadFn } from "novel";

import { uploadCodexImageAction } from "@/modules/worldbuild/presentation/actions/codex.actions";

export type LoreNovelUploadContext = {
  kindSlug: string;
  entrySlug: string;
  /** Chave do campo no storage (ex.: lore_md, historia). */
  fieldKey?: string;
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

async function uploadCodexImageFile(
  file: File,
  uploadContext: LoreNovelUploadContext,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kindSlug", uploadContext.kindSlug.trim());
  formData.append("entrySlug", uploadContext.entrySlug.trim());
  formData.append("fieldKey", uploadContext.fieldKey?.trim() || "lore_md");

  const result = await uploadCodexImageAction(formData);
  if (!result.ok || !result.url) {
    throw new Error(result.message ?? "Não foi possível enviar a imagem.");
  }

  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Falha ao carregar a imagem."));
    image.src = result.url!;
  });

  return result.url;
}

function createLoreNovelUploadFn(
  uploadContext: LoreNovelUploadContext | undefined,
): UploadFn {
  return createImageUpload({
    validateFn: (file) => {
      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error("Formato inválido. Use JPEG, PNG ou WebP.");
        return false;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Arquivo muito grande. Máximo de 5 MB.");
        return false;
      }
      if (
        !uploadContext?.kindSlug?.trim() ||
        !uploadContext?.entrySlug?.trim()
      ) {
        toast.error("Defina o tipo e o slug antes de enviar imagens.");
        return false;
      }
      return true;
    },
    onUpload: (file) => {
      if (!uploadContext) {
        return Promise.reject(new Error("Contexto de upload indisponível."));
      }

      const promise = uploadCodexImageFile(file, uploadContext);

      return new Promise<string>((resolve, reject) => {
        toast.promise(promise, {
          loading: "Enviando imagem…",
          success: (url) => {
            resolve(url);
            return "Imagem enviada.";
          },
          error: (error) => {
            reject(error);
            return error instanceof Error
              ? error.message
              : "Não foi possível enviar a imagem.";
          },
        });
      });
    },
  });
}

export { createLoreNovelUploadFn };
