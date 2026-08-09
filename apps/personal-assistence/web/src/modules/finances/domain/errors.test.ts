import { describe, expect, it } from "vitest";

import { FINANCE_ERRORS } from "./errors";

describe("FINANCE_ERRORS", () => {
  it("creates box not found error", () => {
    const error = FINANCE_ERRORS.create("BOX_NOT_FOUND");

    expect(error.code).toBe("FINANCE_BOX_NOT_FOUND");
    expect(error.httpStatus).toBe(404);
  });

  it("creates invalid transfer error", () => {
    const error = FINANCE_ERRORS.create("INVALID_TRANSFER");

    expect(error.code).toBe("FINANCE_INVALID_TRANSFER");
    expect(error.httpStatus).toBe(400);
  });
});
