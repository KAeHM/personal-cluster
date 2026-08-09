import { drizzleAllocationRepository } from "./adapters/drizzle/allocation.repository";

export function getAllocationRepository() {
  return drizzleAllocationRepository;
}
