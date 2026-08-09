import { beforeEach, describe, expect, it, vi } from "vitest";

const codexRepo = {
  list: vi.fn(),
};

vi.mock("../../infrastructure/codex.repository.factory", () => ({
  getCodexRepository: () => Promise.resolve(codexRepo),
}));

import { listCodexEntries } from "./list-codex-entries";

beforeEach(() => {
  vi.clearAllMocks();
  codexRepo.list.mockResolvedValue({
    entries: [
      {
        id: "e1",
        kindId: "k1",
        kindSlug: "weapon",
        slug: "espada",
        title: "Espada",
        visibility: "private",
        updatedAt: new Date(),
      },
    ],
    total: 1,
  });
});

describe("listCodexEntries", () => {
  it("delega ao repositório", async () => {
    const result = await listCodexEntries({ limit: 10, query: "esp" });
    expect(result.total).toBe(1);
    expect(codexRepo.list).toHaveBeenCalledWith({ limit: 10, query: "esp" });
  });
});
