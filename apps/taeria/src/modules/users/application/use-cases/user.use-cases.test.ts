import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../domain/user";

const repo = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../../infrastructure/user.repository.factory", () => ({
  getUserRepository: () => Promise.resolve(repo),
}));

import { createUser } from "./create-user";
import { deleteUser } from "./delete-user";
import { getUser } from "./get-user";
import { listUsers } from "./list-users";
import { updateUser } from "./update-user";

const sampleUser: User = {
  id: "u1",
  email: "ada@example.com",
  name: "Ada",
  role: "user",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createUser", () => {
  it("cria quando o email está livre", async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(sampleUser);

    const result = await createUser({ email: "ada@example.com", name: "Ada" });

    expect(repo.findByEmail).toHaveBeenCalledWith("ada@example.com");
    expect(repo.create).toHaveBeenCalledWith({
      email: "ada@example.com",
      name: "Ada",
      role: undefined,
    });
    expect(result).toEqual(sampleUser);
  });

  it("normaliza name ausente para null ao criar", async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(sampleUser);

    await createUser({ email: "ada@example.com" });

    expect(repo.create).toHaveBeenCalledWith({
      email: "ada@example.com",
      name: null,
      role: undefined,
    });
  });

  it("lança USER_EMAIL_TAKEN quando o email já existe", async () => {
    repo.findByEmail.mockResolvedValue(sampleUser);

    await expect(
      createUser({ email: "ada@example.com" }),
    ).rejects.toMatchObject({
      code: "USER_EMAIL_TAKEN",
    });
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe("getUser", () => {
  it("retorna o usuário quando existe", async () => {
    repo.findById.mockResolvedValue(sampleUser);
    await expect(getUser("u1")).resolves.toEqual(sampleUser);
  });

  it("lança USER_NOT_FOUND quando não existe", async () => {
    repo.findById.mockResolvedValue(null);
    await expect(getUser("missing")).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });
  });
});

describe("updateUser", () => {
  it("retorna o usuário atualizado", async () => {
    const updated = { ...sampleUser, name: "Ada Lovelace" };
    repo.update.mockResolvedValue(updated);

    await expect(updateUser("u1", { name: "Ada Lovelace" })).resolves.toEqual(
      updated,
    );
    expect(repo.update).toHaveBeenCalledWith("u1", { name: "Ada Lovelace" });
  });

  it("lança USER_NOT_FOUND quando o id não existe", async () => {
    repo.update.mockResolvedValue(null);
    await expect(updateUser("missing", { name: "x" })).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });
  });
});

describe("deleteUser", () => {
  it("resolve quando o repositório remove", async () => {
    repo.delete.mockResolvedValue(true);
    await expect(deleteUser("u1")).resolves.toBeUndefined();
  });

  it("lança USER_NOT_FOUND quando nada foi removido", async () => {
    repo.delete.mockResolvedValue(false);
    await expect(deleteUser("missing")).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });
  });
});

describe("listUsers", () => {
  it("repassa a lista do repositório", async () => {
    repo.list.mockResolvedValue([sampleUser]);
    await expect(listUsers()).resolves.toEqual([sampleUser]);
  });
});
