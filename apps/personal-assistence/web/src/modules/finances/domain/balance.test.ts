import { describe, expect, it } from "vitest";

import {
  computeBoxBalance,
  computeBalancesByBox,
  computeMonthlyTotals,
  computeProgressPercent,
} from "./balance";

describe("computeBoxBalance", () => {
  it("calculates income minus expense for a box", () => {
    const movements = [
      {
        boxId: "a",
        type: "income" as const,
        amountCents: 500_000,
        occurredAt: new Date(),
      },
      {
        boxId: "a",
        type: "expense" as const,
        amountCents: 150_000,
        occurredAt: new Date(),
      },
      {
        boxId: "b",
        type: "income" as const,
        amountCents: 100_000,
        occurredAt: new Date(),
      },
    ];

    expect(computeBoxBalance(movements, "a")).toBe(350_000);
    expect(computeBoxBalance(movements, "b")).toBe(100_000);
    expect(computeBoxBalance(movements, "missing")).toBe(0);
  });
});

describe("computeBalancesByBox", () => {
  it("returns a map of balances per box", () => {
    const movements = [
      {
        boxId: "a",
        type: "income" as const,
        amountCents: 1000,
        occurredAt: new Date(),
      },
      {
        boxId: "a",
        type: "expense" as const,
        amountCents: 300,
        occurredAt: new Date(),
      },
      {
        boxId: "b",
        type: "expense" as const,
        amountCents: 200,
        occurredAt: new Date(),
      },
    ];

    const balances = computeBalancesByBox(movements);

    expect(balances.get("a")).toBe(700);
    expect(balances.get("b")).toBe(-200);
  });
});

describe("computeProgressPercent", () => {
  it("returns null when no target", () => {
    expect(computeProgressPercent(1000, null)).toBeNull();
    expect(computeProgressPercent(1000, 0)).toBeNull();
  });

  it("caps progress at 100%", () => {
    expect(computeProgressPercent(2500, 2000)).toBe(100);
    expect(computeProgressPercent(1000, 2000)).toBe(50);
  });
});

describe("computeMonthlyTotals", () => {
  it("sums income and expense within month bounds", () => {
    const monthStart = new Date("2026-07-01T00:00:00.000Z");
    const monthEnd = new Date("2026-08-01T00:00:00.000Z");

    const movements = [
      {
        boxId: "a",
        type: "income" as const,
        amountCents: 5000,
        occurredAt: new Date("2026-07-15T12:00:00.000Z"),
      },
      {
        boxId: "a",
        type: "expense" as const,
        amountCents: 1200,
        occurredAt: new Date("2026-07-20T12:00:00.000Z"),
      },
      {
        boxId: "a",
        type: "income" as const,
        amountCents: 9000,
        occurredAt: new Date("2026-06-20T12:00:00.000Z"),
      },
    ];

    expect(computeMonthlyTotals(movements, monthStart, monthEnd)).toEqual({
      totalIncomeCents: 5000,
      totalExpenseCents: 1200,
    });
  });
});
