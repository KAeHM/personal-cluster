import { z } from "zod";

export const createIncomeSourceSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  type: z.enum(["fixed", "variable"]).optional(),
  expectedAmountCents: z.number().int().positive().optional(),
});

export const updateIncomeSourceSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: z.enum(["fixed", "variable"]).optional(),
  expectedAmountCents: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateFinanceSettingsSchema = z.object({
  monthlyFixedIncomeCents: z.number().int().positive().nullable().optional(),
});

export const previewAllocationSchema = z.object({
  incomeSourceId: z.string().uuid(),
  amountCents: z.number().int().positive(),
});

export const executeAllocationSchema = previewAllocationSchema.extend({
  description: z.string().trim().max(500).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

export type PreviewAllocationInput = z.infer<typeof previewAllocationSchema>;
export type ExecuteAllocationInput = z.infer<typeof executeAllocationSchema>;
