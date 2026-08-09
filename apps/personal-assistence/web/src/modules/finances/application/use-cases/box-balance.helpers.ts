import type { FinanceBoxWithBalance } from "../../domain/box.entity";
import { computeProgressPercent } from "../../domain/balance";
import type { FinanceBox } from "../../domain/box.entity";
import { getBoxRepository } from "../../infrastructure/box.repository.factory";
import { getMovementRepository } from "../../infrastructure/movement.repository.factory";

export async function attachBalanceToBoxes(
  userId: string,
  boxes: FinanceBox[],
): Promise<FinanceBoxWithBalance[]> {
  const movementRepo = getMovementRepository();
  const balances = await movementRepo.getBalancesByBox(userId);

  return boxes.map((box) => {
    const balanceCents = balances.get(box.id) ?? 0;

    return {
      ...box,
      balanceCents,
      progressPercent: computeProgressPercent(
        balanceCents,
        box.targetAmountCents,
      ),
      isNegative: balanceCents < 0,
    };
  });
}

export async function getBoxWithBalance(
  userId: string,
  boxId: string,
): Promise<FinanceBoxWithBalance | null> {
  const boxRepo = getBoxRepository();
  const box = await boxRepo.findById(userId, boxId);

  if (!box) {
    return null;
  }

  const [withBalance] = await attachBalanceToBoxes(userId, [box]);
  return withBalance;
}
