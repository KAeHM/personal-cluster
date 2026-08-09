import { drizzleBoxRepository } from "./adapters/drizzle/box.repository";

export function getBoxRepository() {
  return drizzleBoxRepository;
}
