import { getBoxRepository } from "../../infrastructure/box.repository.factory";
import type { CreateBoxInput } from "../schemas/box.schema";
import { attachBalanceToBoxes } from "./box-balance.helpers";

export async function createBox(userId: string, input: CreateBoxInput) {
  const boxRepo = getBoxRepository();
  const box = await boxRepo.create({
    userId,
    name: input.name,
    description: input.description ?? null,
    profile: input.profile,
    targetAmountCents: input.targetAmountCents ?? null,
    priority: input.priority,
    color: input.color ?? null,
    icon: input.icon ?? null,
    config: input.config ?? null,
  });

  const [withBalance] = await attachBalanceToBoxes(userId, [box]);
  return withBalance;
}
