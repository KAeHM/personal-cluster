import { beforeEach, describe, expect, it, vi } from "vitest";

const codexRepo = {
  delete: vi.fn(),
};

vi.mock("../../infrastructure/codex.repository.factory", () => ({
  getCodexRepository: () => Promise.resolve(codexRepo),
}));

import { deleteCodexEntry } from "./delete-codex-entry";

beforeEach(() => {
  vi.clearAllMocks();
  codexRepo.delete.mockResolvedValue(true);
});

describe("deleteCodexEntry", () => {
  it("remove entrada existente", async () => {
    await deleteCodexEntry("entry-1");
    expect(codexRepo.delete).toHaveBeenCalledWith("entry-1");
  });

  it("falha quando entrada não existe", async () => {
    codexRepo.delete.mockResolvedValue(false);

    await expect(deleteCodexEntry("missing")).rejects.toMatchObject({
      code: "CODEX_NOT_FOUND",
    });
  });
});
