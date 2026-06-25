import { z } from "zod";
import { USER_ROLES } from "../../domain/role";

/**
 * Schemas de validação de input (fronteira). Fonte única consumida tanto pela
 * Server Action quanto pelo Route Handler; os use cases assumem input já válido.
 */
export const createUserSchema = z.object({
  email: z.string().email("Email inválido."),
  name: z.string().min(1, "Nome obrigatório.").max(120).nullish(),
  role: z.enum(USER_ROLES).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1, "Nome obrigatório.").max(120).nullish(),
    role: z.enum(USER_ROLES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
