import { FINANCE_ERRORS } from "../../domain/errors";
import { getBoxRepository } from "../../infrastructure/box.repository.factory";

export async function deleteBox(userId: string, boxId: string) {
  const boxRepo = getBoxRepository();
  const existing = await boxRepo.findById(userId, boxId);

  if (!existing) {
    throw FINANCE_ERRORS.create("BOX_NOT_FOUND");
  }

  const updated = await boxRepo.update(userId, boxId, { isActive: false });

  if (!updated) {
    throw FINANCE_ERRORS.create("BOX_NOT_FOUND");
  }

  return { success: true as const };
}
