import { FINANCE_ERRORS } from "../../domain/errors";
import { getBoxRepository } from "../../infrastructure/box.repository.factory";
import { getCategoryRepository } from "../../infrastructure/category.repository.factory";
import { getMovementRepository } from "../../infrastructure/movement.repository.factory";
import type { RecordMovementInput } from "../schemas/movement.schema";
import { getBoxWithBalance } from "./box-balance.helpers";

export async function assertActiveBox(userId: string, boxId: string) {
  const boxRepo = getBoxRepository();
  const box = await boxRepo.findById(userId, boxId);

  if (!box) {
    throw FINANCE_ERRORS.create("BOX_NOT_FOUND");
  }

  if (!box.isActive) {
    throw FINANCE_ERRORS.create("BOX_INACTIVE");
  }

  return box;
}

async function assertCategory(userId: string, categoryId?: string) {
  if (!categoryId) {
    return;
  }

  const categoryRepo = getCategoryRepository();
  const category = await categoryRepo.findById(userId, categoryId);

  if (!category) {
    throw FINANCE_ERRORS.create("CATEGORY_NOT_FOUND");
  }
}

export async function recordMovement(
  userId: string,
  boxId: string,
  input: RecordMovementInput,
) {
  await assertActiveBox(userId, boxId);
  await assertCategory(userId, input.categoryId);

  const movementRepo = getMovementRepository();
  const movement = await movementRepo.create({
    userId,
    boxId,
    type: input.type,
    amountCents: input.amountCents,
    categoryId: input.categoryId ?? null,
    description: input.description ?? null,
    occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
  });

  const box = await getBoxWithBalance(userId, boxId);

  return { movement, box };
}

export async function recordIncome(
  userId: string,
  boxId: string,
  input: Omit<RecordMovementInput, "type">,
) {
  return recordMovement(userId, boxId, { ...input, type: "income" });
}

export async function recordExpense(
  userId: string,
  boxId: string,
  input: Omit<RecordMovementInput, "type">,
) {
  return recordMovement(userId, boxId, { ...input, type: "expense" });
}
