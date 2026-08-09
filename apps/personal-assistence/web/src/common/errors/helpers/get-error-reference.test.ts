import { describe, expect, it } from "vitest";
import { COMMON_ERRORS } from "../catalog/common.errors";
import { getErrorReference } from "./get-error-reference";

describe("getErrorReference", () => {
  it("retorna o errorId de um AppError", () => {
    const err = COMMON_ERRORS.create("INTERNAL");
    expect(getErrorReference(err)).toBe(err.errorId);
  });

  it("retorna o errorId presente num Error comum", () => {
    const err = Object.assign(new Error("boom"), { errorId: "ref-123" });
    expect(getErrorReference(err)).toBe("ref-123");
  });

  it("cai no digest quando não há errorId", () => {
    const err = Object.assign(new Error("boom"), { digest: "digest-abc" });
    expect(getErrorReference(err)).toBe("digest-abc");
  });

  it("retorna undefined quando não há referência alguma", () => {
    expect(getErrorReference(new Error("boom"))).toBeUndefined();
  });
});
