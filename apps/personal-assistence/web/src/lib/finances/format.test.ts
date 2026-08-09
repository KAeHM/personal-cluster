import { describe, expect, it } from "vitest";

import { parseReaisToCents, formatCents } from "./format";

describe("parseReaisToCents", () => {
  it("parses Brazilian currency input", () => {
    expect(parseReaisToCents("150,00")).toBe(15000);
    expect(parseReaisToCents("1.500,50")).toBe(150050);
    expect(parseReaisToCents("5000")).toBe(500000);
  });

  it("returns null for invalid values", () => {
    expect(parseReaisToCents("")).toBeNull();
    expect(parseReaisToCents("abc")).toBeNull();
    expect(parseReaisToCents("-10")).toBeNull();
  });
});

describe("formatCents", () => {
  it("formats cents as BRL", () => {
    expect(formatCents(15000)).toContain("150");
  });
});
