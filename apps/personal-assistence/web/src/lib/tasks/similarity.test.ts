import { describe, expect, it } from "vitest";

import { areTaskDescriptionsSimilar } from "@/lib/tasks/similarity";

describe("areTaskDescriptionsSimilar", () => {
  it("considera descrições idênticas após normalização", () => {
    expect(areTaskDescriptionsSimilar("Revisar PR", "revisar pr")).toBe(true);
  });

  it("detecta descrições parecidas", () => {
    expect(
      areTaskDescriptionsSimilar("Implementar login", "implementar logim"),
    ).toBe(true);
  });

  it("rejeita descrições distintas", () => {
    expect(areTaskDescriptionsSimilar("Deploy produção", "Reunião daily")).toBe(
      false,
    );
  });
});
