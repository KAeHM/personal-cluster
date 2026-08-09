import { drizzleUserSettingsRepository } from "./adapters/drizzle/user-settings.repository";

export function getUserSettingsRepository() {
  return drizzleUserSettingsRepository;
}
