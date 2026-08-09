import { describe, expect, it, vi } from "vitest";

import { listPlayersForShare } from "./list-players-for-share";

vi.mock("@/modules/users/application/use-cases/list-users", () => ({
  listUsers: vi.fn(async () => [
    {
      id: "u1",
      email: "gm@example.com",
      name: "GM",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "u2",
      email: "player@example.com",
      name: "Jogador",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
}));

describe("listPlayersForShare", () => {
  it("retorna apenas jogadores com role user", async () => {
    await expect(listPlayersForShare()).resolves.toEqual([
      {
        id: "u2",
        email: "player@example.com",
        name: "Jogador",
      },
    ]);
  });
});
