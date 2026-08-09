import { describe, expect, it } from "vitest";
import { createUserSchema, updateUserSchema } from "./user.schema";

describe("createUserSchema", () => {
  it("aceita um input completo e válido", () => {
    const result = createUserSchema.safeParse({
      email: "ada@example.com",
      name: "Ada",
      role: "admin",
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      email: "ada@example.com",
      name: "Ada",
      role: "admin",
    });
  });

  it("aceita apenas o email (name e role são opcionais)", () => {
    const result = createUserSchema.safeParse({ email: "ada@example.com" });
    expect(result.success).toBe(true);
  });

  it("aceita name nulo (nullish)", () => {
    const result = createUserSchema.safeParse({
      email: "ada@example.com",
      name: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    const result = createUserSchema.safeParse({ email: "não-é-email" });
    expect(result.success).toBe(false);
  });

  it("rejeita name vazio", () => {
    const result = createUserSchema.safeParse({
      email: "ada@example.com",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita role fora do enum", () => {
    const result = createUserSchema.safeParse({
      email: "ada@example.com",
      role: "superadmin",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("aceita atualização parcial de name", () => {
    expect(updateUserSchema.safeParse({ name: "Ada Lovelace" }).success).toBe(
      true,
    );
  });

  it("aceita atualização apenas de role", () => {
    expect(updateUserSchema.safeParse({ role: "user" }).success).toBe(true);
  });

  it("rejeita objeto vazio (nada para atualizar)", () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejeita role inválida", () => {
    expect(updateUserSchema.safeParse({ role: "owner" }).success).toBe(false);
  });
});
