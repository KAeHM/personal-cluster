import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient } from "@/common/adapters/supabase/admin";

const CODEX_ASSETS_BUCKET = "codex-assets";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export type UploadCodexAssetInput = {
  kindSlug: string;
  entrySlug: string;
  fieldKey: string;
  file: File;
};

export type UploadCodexAssetResult = {
  url: string;
  path: string;
};

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

function buildAssetPath(input: UploadCodexAssetInput): string {
  const ext = extensionForMime(input.file.type);
  return `${input.kindSlug}/${input.entrySlug}/${input.fieldKey}-${randomUUID()}.${ext}`;
}

function publicUrlForPath(path: string): string {
  const admin = createSupabaseAdminClient();
  const { data } = admin.storage.from(CODEX_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCodexAsset(
  input: UploadCodexAssetInput,
): Promise<UploadCodexAssetResult> {
  if (!ALLOWED_MIME_TYPES.has(input.file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG ou WebP.");
  }

  if (input.file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Arquivo muito grande. Máximo de 5 MB.");
  }

  const path = buildAssetPath(input);
  const admin = createSupabaseAdminClient();
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error } = await admin.storage
    .from(CODEX_ASSETS_BUCKET)
    .upload(path, buffer, {
      contentType: input.file.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return {
    path,
    url: publicUrlForPath(path),
  };
}
