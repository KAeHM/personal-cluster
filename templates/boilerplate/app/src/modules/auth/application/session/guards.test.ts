import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSession } from "../../domain/session/session";

const getSession = vi.fn<() => Promise<AuthSession | null>>();

vi.mock("./facade", () => ({
  getSession: () => getSession(),
}));

import { requireAuth, requireRole } from "./guards";

beforeEach(() => {
  getSession.mockReset();
});

describe("requireAuth", () => {
  it("retorna a sessão quando autenticado", async () => {
    const session: AuthSession = { user: { id: "u1", roles: ["user"] } };
    getSession.mockResolvedValue(session);
    await expect(requireAuth()).resolves.toBe(session);
  });

  it("lança AUTH_UNAUTHORIZED quando não há sessão", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireAuth()).rejects.toMatchObject({
      code: "AUTH_UNAUTHORIZED",
    });
  });
});

describe("requireRole", () => {
  it("retorna a sessão quando a role está presente", async () => {
    const session: AuthSession = { user: { id: "u1", roles: ["admin"] } };
    getSession.mockResolvedValue(session);
    await expect(requireRole("admin")).resolves.toBe(session);
  });

  it("lança AUTH_FORBIDDEN quando falta a role", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", roles: ["user"] } });
    await expect(requireRole("admin")).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN",
    });
  });

  it("lança AUTH_UNAUTHORIZED quando não há sessão", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireRole("admin")).rejects.toMatchObject({
      code: "AUTH_UNAUTHORIZED",
    });
  });
});
