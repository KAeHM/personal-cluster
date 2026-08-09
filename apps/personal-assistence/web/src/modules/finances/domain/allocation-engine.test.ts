import { describe, expect, it } from "vitest";

import {
  computeAllocationPreview,
  computeFixedIncomeCommitment,
} from "./allocation-engine";

const boxes = [
  {
    id: "provi",
    name: "Proví",
    priority: 10,
    profile: "debt",
    config: {
      eligibleSourceIds: ["salary"],
      allocationRules: [
        {
          id: "provi-17",
          type: "percent_conditional" as const,
          percent: 17,
          condition: {
            field: "eligible_income_amount" as const,
            operator: ">" as const,
            valueCents: 300_000,
          },
        },
      ],
    },
  },
  {
    id: "invest",
    name: "Investimento",
    priority: 5,
    profile: "investment",
    config: {
      allocationRules: [
        {
          id: "inv-15",
          type: "percent" as const,
          percent: 15,
        },
      ],
    },
  },
  {
    id: "fixed",
    name: "Custos fixos",
    priority: 8,
    profile: "fixed_cost",
    config: {
      allocationRules: [
        {
          id: "fixed-1800",
          type: "fixed_amount" as const,
          fixedAmountCents: 180_000,
        },
      ],
    },
  },
  {
    id: "spending",
    name: "Passar o mês",
    priority: 1,
    profile: "spending",
    config: {
      receiveRemainder: true,
    },
  },
];

describe("computeAllocationPreview", () => {
  it("distributes salary with Proví conditional, percent and remainder", () => {
    const preview = computeAllocationPreview({
      incomeAmountCents: 500_000,
      incomeSourceId: "salary",
      boxes,
    });

    const provi = preview.lines.find((line) => line.boxId === "provi");
    const invest = preview.lines.find((line) => line.boxId === "invest");
    const fixed = preview.lines.find((line) => line.boxId === "fixed");
    const spending = preview.lines.find((line) => line.boxId === "spending");

    expect(provi?.amountCents).toBe(85_000);
    expect(invest?.amountCents).toBe(75_000);
    expect(fixed?.amountCents).toBe(180_000);
    expect(spending?.amountCents).toBe(160_000);
    expect(preview.allocatedTotalCents).toBe(500_000);
    expect(preview.remainderCents).toBe(0);
  });

  it("skips Proví when source is not eligible", () => {
    const preview = computeAllocationPreview({
      incomeAmountCents: 500_000,
      incomeSourceId: "freelance",
      boxes,
    });

    expect(
      preview.lines.find((line) => line.boxId === "provi"),
    ).toBeUndefined();
  });

  it("skips Proví when eligible income below threshold", () => {
    const preview = computeAllocationPreview({
      incomeAmountCents: 200_000,
      incomeSourceId: "salary",
      boxes,
    });

    expect(
      preview.lines.find((line) => line.boxId === "provi"),
    ).toBeUndefined();
  });
});

describe("computeFixedIncomeCommitment", () => {
  it("warns when commitments exceed fixed income", () => {
    const result = computeFixedIncomeCommitment(boxes, 250_000);

    expect(result.committedCents).toBeGreaterThan(250_000);
    expect(result.warning).not.toBeNull();
  });
});
