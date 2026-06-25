import { existsSync } from "node:fs";
import type { UserRole } from "../src/modules/users/domain/role";
import { getUserRepository } from "../src/modules/users/infrastructure/user.repository.factory";
import { getCredentialsRepository } from "../src/modules/auth/infrastructure/credentials/factory";
import { passwordHasher } from "../src/modules/auth/infrastructure/security/password-hasher";

// Carrega envs do .env.local / .env (Node >= 20.12 tem process.loadEnvFile).
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

type SeedUser = {
  email: string;
  name: string;
  role: UserRole;
  password: string;
};

const SEED_USERS: SeedUser[] = [
  {
    email: "admin@example.com",
    name: "Admin",
    role: "admin",
    password: "admin1234",
  },
  {
    email: "ana@example.com",
    name: "Ana Silva",
    role: "user",
    password: "user1234",
  },
  {
    email: "bruno@example.com",
    name: "Bruno Costa",
    role: "user",
    password: "user1234",
  },
];

async function main(): Promise<void> {
  const users = await getUserRepository();
  const credentials = await getCredentialsRepository();

  for (const seed of SEED_USERS) {
    const existing = await users.findByEmail(seed.email);
    if (existing) {
      console.log(`skip  ${seed.email} (já existe)`);
      continue;
    }

    const user = await users.create({
      email: seed.email,
      name: seed.name,
      role: seed.role,
    });
    const passwordHash = await passwordHasher.hash(seed.password);
    await credentials.create({
      userId: user.id,
      email: seed.email,
      passwordHash,
    });

    console.log(`seed  ${seed.email} (senha: ${seed.password})`);
  }

  console.log("Seed concluído.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Falha no seed:", error);
  process.exit(1);
});
