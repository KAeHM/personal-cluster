import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn(() => ({
  data: {
    publicUrl:
      "https://cdn.example.com/codex-assets/weapon/espada/banner_url-abc.jpg",
  },
}));

vi.mock("@/common/adapters/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      })),
    },
  })),
}));

import { uploadCodexAsset } from "@/common/adapters/supabase/storage";

function createFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new Uint8Array(sizeBytes);
  return new File([buffer], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  uploadMock.mockResolvedValue({ error: null });
});

describe("uploadCodexAsset", () => {
  it("envia imagem válida e retorna URL pública", async () => {
    const file = createFile("banner.jpg", "image/jpeg", 1024);

    const result = await uploadCodexAsset({
      kindSlug: "weapon",
      entrySlug: "espada",
      fieldKey: "banner_url",
      file,
    });

    expect(uploadMock).toHaveBeenCalledOnce();
    expect(result.url).toContain("banner_url");
    expect(result.path).toMatch(/^weapon\/espada\/banner_url-/);
  });

  it("rejeita mime inválido", async () => {
    const file = createFile("doc.pdf", "application/pdf", 1024);

    await expect(
      uploadCodexAsset({
        kindSlug: "weapon",
        entrySlug: "espada",
        fieldKey: "banner_url",
        file,
      }),
    ).rejects.toThrow("Formato inválido");
  });

  it("rejeita arquivo grande demais", async () => {
    const file = createFile("big.jpg", "image/jpeg", 6 * 1024 * 1024);

    await expect(
      uploadCodexAsset({
        kindSlug: "weapon",
        entrySlug: "espada",
        fieldKey: "banner_url",
        file,
      }),
    ).rejects.toThrow("Arquivo muito grande");
  });
});
