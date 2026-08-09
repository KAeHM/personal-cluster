import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  color: z.string().trim().max(20).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
