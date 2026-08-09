import { drizzleIncomeSourceRepository } from "./adapters/drizzle/income-source.repository";

export function getIncomeSourceRepository() {
  return drizzleIncomeSourceRepository;
}
