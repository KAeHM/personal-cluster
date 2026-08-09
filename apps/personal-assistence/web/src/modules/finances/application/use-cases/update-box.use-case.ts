import { FINANCE_ERRORS } from "../../domain/errors";
import { getBoxRepository } from "../../infrastructure/box.repository.factory";
import type { UpdateBoxInput } from "../schemas/box.schema";
import { attachBalanceToBoxes } from "./box-balance.helpers";

export async function updateBox(
  userId: string,
  boxId: string,
  input: UpdateBoxInput,
) {
  const boxRepo = getBoxRepository();
  const existing = await boxRepo.findById(userId, boxId);

  if (!existing) {
    throw FINANCE_ERRORS.create("BOX_NOT_FOUND");
  }

  const updated = await boxRepo.update(userId, boxId, input);

  if (!updated) {
    throw FINANCE_ERRORS.create("BOX_NOT_FOUND");
  }

  const [withBalance] = await attachBalanceToBoxes(userId, [updated]);
  return withBalance;
}
