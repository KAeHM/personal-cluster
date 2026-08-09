import { z } from "zod";

import { boxConfigSchema } from "./box-config.schema";

export const financeBoxProfileSchema = z.enum([
  "debt",
  "investment",
  "fixed_cost",
  "goal",
  "spending",
  "other",
]);

export const createBoxSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  description: z.string().trim().max(500).optional(),
  profile: financeBoxProfileSchema.optional(),
  targetAmountCents: z.number().int().positive().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  color: z.string().trim().max(20).optional(),
  icon: z.string().trim().max(50).optional(),
  config: boxConfigSchema.optional(),
});

export const updateBoxSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  profile: financeBoxProfileSchema.optional(),
  targetAmountCents: z.number().int().positive().nullable().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  color: z.string().trim().max(20).nullable().optional(),
  icon: z.string().trim().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
  config: boxConfigSchema.nullable().optional(),
});

export type CreateBoxInput = z.infer<typeof createBoxSchema>;
export type UpdateBoxInput = z.infer<typeof updateBoxSchema>;
