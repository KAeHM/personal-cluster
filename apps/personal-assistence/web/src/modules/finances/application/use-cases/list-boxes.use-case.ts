import { getBoxRepository } from "../../infrastructure/box.repository.factory";
import { attachBalanceToBoxes } from "./box-balance.helpers";

export async function listBoxes(userId: string) {
  const boxRepo = getBoxRepository();
  const boxes = await boxRepo.listByUser(userId);
  return attachBalanceToBoxes(userId, boxes);
}
