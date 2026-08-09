import { z } from "zod";

export const recordMovementSchema = z.object({
  type: z.enum(["income", "expense"]),
  amountCents: z
    .number()
    .int("Valor deve ser inteiro (centavos)")
    .positive("Valor deve ser maior que zero"),
  description: z.string().trim().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

export const transferSchema = z.object({
  fromBoxId: z.string().uuid(),
  toBoxId: z.string().uuid(),
  amountCents: z
    .number()
    .int("Valor deve ser inteiro (centavos)")
    .positive("Valor deve ser maior que zero"),
  description: z.string().trim().max(500).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

export const listMovementsQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export type RecordMovementInput = z.infer<typeof recordMovementSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
