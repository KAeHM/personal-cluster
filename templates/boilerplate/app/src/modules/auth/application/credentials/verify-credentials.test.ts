import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Credentials } from "../../domain/credentials/credentials";

const repo = {
  findByEmail: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
};

const verify = vi.fn();

vi.mock("../../infrastructure/credentials/factory", () => ({
  getCredentialsRepository: () => Promise.resolve(repo),
}));

vi.mock("../../infrastructure/security/password-hasher", () => ({
  passwordHasher: {
    hash: vi.fn(),
    verify: (...args: unknown[]) => verify(...args),
  },
}));

import { verifyCredentials } from "./verify-credentials";

const creds: Credentials = {
  userId: "u1",
  email: "ada@example.com",
  passwordHash: "hash",
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyCredentials", () => {
  it("retorna null quando o email não existe", async () => {
    repo.findByEmail.mockResolvedValue(null);
    await expect(
      verifyCredentials("ghost@example.com", "x"),
    ).resolves.toBeNull();
    expect(verify).not.toHaveBeenCalled();
  });

  it("retorna null quando a senha não confere", async () => {
    repo.findByEmail.mockResolvedValue(creds);
    verify.mockResolvedValue(false);
    await expect(
      verifyCredentials("ada@example.com", "wrong"),
    ).resolves.toBeNull();
  });

  it("retorna o AuthUser mínimo quando a senha confere", async () => {
    repo.findByEmail.mockResolvedValue(creds);
    verify.mockResolvedValue(true);
    await expect(
      verifyCredentials("ada@example.com", "right"),
    ).resolves.toEqual({ id: "u1", email: "ada@example.com" });
    expect(verify).toHaveBeenCalledWith("right", "hash");
  });
});
