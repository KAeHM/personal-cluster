import { describe, expect, it } from "vitest";

import {
  formatCodexValidationDetails,
  humanizeIssue,
} from "./format-codex-action-error";

describe("humanizeIssue", () => {
  it("traduz campos obrigatórios tipados", () => {
    expect(
      humanizeIssue(
        "write_at: Invalid input: expected number, received undefined",
      ),
    ).toBe("write_at é obrigatório (número)");
    expect(
      humanizeIssue("term: Invalid input: expected string, received undefined"),
    ).toBe("term é obrigatório (texto)");
  });
});

describe("formatCodexValidationDetails", () => {
  it("prefixa facetas e lista identityErrors", () => {
    expect(
      formatCodexValidationDetails({
        identityErrors: [
          "title: Invalid input: expected string, received undefined",
        ],
        errors: {
          lore: [
            "write_at: Invalid input: expected number, received undefined",
          ],
          lexicon: ["term: Invalid input: expected string, received undefined"],
        },
      }),
    ).toEqual([
      "title é obrigatório (texto)",
      "Lore — write_at é obrigatório (número)",
      "Léxico — term é obrigatório (texto)",
    ]);
  });

  it("retorna vazio sem meta", () => {
    expect(formatCodexValidationDetails(undefined)).toEqual([]);
  });
});
