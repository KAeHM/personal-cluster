import { FINANCE_ERRORS } from "../../domain/errors";
import { getMovementRepository } from "../../infrastructure/movement.repository.factory";
import type { TransferInput } from "../schemas/movement.schema";
import { getBoxWithBalance } from "./box-balance.helpers";
import { assertActiveBox } from "./record-movement.use-case";

export async function transferBetweenBoxes(
  userId: string,
  input: TransferInput,
) {
  if (input.fromBoxId === input.toBoxId) {
    throw FINANCE_ERRORS.create("INVALID_TRANSFER");
  }

  await assertActiveBox(userId, input.fromBoxId);
  await assertActiveBox(userId, input.toBoxId);

  const movementRepo = getMovementRepository();
  const result = await movementRepo.createTransfer({
    userId,
    fromBoxId: input.fromBoxId,
    toBoxId: input.toBoxId,
    amountCents: input.amountCents,
    description: input.description ?? null,
    occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
  });

  const [fromBox, toBox] = await Promise.all([
    getBoxWithBalance(userId, input.fromBoxId),
    getBoxWithBalance(userId, input.toBoxId),
  ]);

  return {
    ...result,
    fromBox,
    toBox,
  };
}
