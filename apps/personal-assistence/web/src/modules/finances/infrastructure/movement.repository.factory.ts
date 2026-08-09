import { drizzleMovementRepository } from "./adapters/drizzle/movement.repository";

export function getMovementRepository() {
  return drizzleMovementRepository;
}
