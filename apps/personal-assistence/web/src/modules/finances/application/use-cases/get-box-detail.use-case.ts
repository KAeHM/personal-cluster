import { FINANCE_ERRORS } from "../../domain/errors";
import { getBoxRepository } from "../../infrastructure/box.repository.factory";
import { getMovementRepository } from "../../infrastructure/movement.repository.factory";
import { getBoxWithBalance } from "./box-balance.helpers";

export async function getBoxDetail(
  userId: string,
  boxId: string,
  options?: { movementLimit?: number },
) {
  const box = await getBoxWithBalance(userId, boxId);

  if (!box) {
    throw FINANCE_ERRORS.create("BOX_NOT_FOUND");
  }

  const movementRepo = getMovementRepository();
  const movements = await movementRepo.listByBox(userId, boxId, {
    limit: options?.movementLimit ?? 50,
  });

  return { box, movements };
}

export async function getBoxDetailOrNull(userId: string, boxId: string) {
  const boxRepo = getBoxRepository();
  const box = await boxRepo.findById(userId, boxId);

  if (!box) {
    return null;
  }

  return getBoxDetail(userId, boxId);
}
