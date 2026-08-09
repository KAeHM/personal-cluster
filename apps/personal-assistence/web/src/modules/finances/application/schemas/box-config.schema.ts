import { z } from "zod";

export const allocationRuleSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["percent", "percent_conditional", "fixed_amount"]),
  percent: z.number().min(0).max(100).optional(),
  fixedAmountCents: z.number().int().positive().optional(),
  condition: z
    .object({
      field: z.enum(["income_amount", "eligible_income_amount"]),
      operator: z.enum([">", ">="]),
      valueCents: z.number().int().nonnegative(),
    })
    .optional(),
});

export const boxConfigSchema = z.object({
  eligibleSourceIds: z.array(z.string().uuid()).optional(),
  receiveRemainder: z.boolean().optional(),
  allocationRules: z.array(allocationRuleSchema).optional(),
});

export type BoxConfigInput = z.infer<typeof boxConfigSchema>;
