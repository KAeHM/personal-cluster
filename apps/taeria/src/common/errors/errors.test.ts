import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError, COMMON_ERRORS, getHttpStatus, toClientError } from "./index";

describe("getHttpStatus", () => {
  it("usa o httpStatus do AppError", () => {
    expect(getHttpStatus(COMMON_ERRORS.create("NOT_FOUND"))).toBe(404);
  });

  it("usa o fallback para erros genéricos", () => {
    expect(getHttpStatus(new Error("boom"))).toBe(500);
    expect(getHttpStatus(new Error("boom"), 400)).toBe(400);
  });
});

describe("toClientError", () => {
  it("expõe a mensagem quando exposeToClient é true", () => {
    const err = COMMON_ERRORS.create("NOT_FOUND");
    expect(toClientError(err)).toEqual({
      errorId: err.errorId,
      code: "COMMON_NOT_FOUND",
      message: err.message,
    });
  });

  it("omite a mensagem quando exposeToClient é false", () => {
    const err = COMMON_ERRORS.create("INTERNAL");
    const payload = toClientError(err);
    expect(payload).toEqual({ errorId: err.errorId, code: "COMMON_INTERNAL" });
    expect(payload.message).toBeUndefined();
  });

  it("usa o digest quando o erro o possui (ex.: erro do React/Next)", () => {
    const err = Object.assign(new Error("boom"), { digest: "digest-xyz" });
    expect(toClientError(err)).toEqual({ digest: "digest-xyz" });
  });

  it("expõe a mensagem de Error genérico em desenvolvimento", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(toClientError(new Error("detalhe de dev"))).toEqual({
      message: "detalhe de dev",
    });
  });

  it("não vaza detalhes de erros genéricos fora de desenvolvimento", () => {
    expect(toClientError(new Error("segredo interno"))).toEqual({});
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AppError", () => {
  it("aplica messageOverride e preserva o cause", () => {
    const cause = new Error("origem");
    const err = COMMON_ERRORS.create("INTERNAL", {
      messageOverride: "mensagem customizada",
      cause,
    });
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe("mensagem customizada");
    expect(err.cause).toBe(cause);
  });

  it("gera um errorId único por instância", () => {
    const a = COMMON_ERRORS.create("INTERNAL");
    const b = COMMON_ERRORS.create("INTERNAL");
    expect(a.errorId).not.toBe(b.errorId);
  });

  it("respeita um errorId fornecido", () => {
    const err = COMMON_ERRORS.create("INTERNAL", { errorId: "fixo-1" });
    expect(err.errorId).toBe("fixo-1");
  });
});

describe("defineErrorCatalog", () => {
  it("get retorna a definição da chave", () => {
    expect(COMMON_ERRORS.get("NOT_FOUND")).toMatchObject({
      code: "COMMON_NOT_FOUND",
      httpStatus: 404,
    });
  });

  it("create lança para uma chave desconhecida", () => {
    expect(() => COMMON_ERRORS.create("NOPE" as never)).toThrow(
      /Unknown error/,
    );
  });

  it("get lança para uma chave desconhecida", () => {
    expect(() => COMMON_ERRORS.get("NOPE" as never)).toThrow(/Unknown error/);
  });

  it("toMarkdown inclui os códigos do catálogo", () => {
    const md = COMMON_ERRORS.toMarkdown();
    expect(md).toContain("COMMON_INTERNAL");
    expect(md).toContain("COMMON_NOT_FOUND");
  });
});
