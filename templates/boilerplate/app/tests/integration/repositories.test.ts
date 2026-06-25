import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { schema, type Database } from "@/common/adapters/db/drizzle/client";
import { createDrizzleCredentialsRepository } from "@/modules/auth/infrastructure/credentials/adapters/drizzle/credentials.repository";
import { createDrizzleUserRepository } from "@/modules/users/infrastructure/adapters/drizzle/user.repository";

let container: StartedPostgreSqlContainer;
let client: ReturnType<typeof postgres>;
let db: Database;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16").start();
  client = postgres(container.getConnectionUri(), { max: 1 });
  db = drizzle(client, { schema });
  // Aplica as mesmas migrations versionadas usadas em produção.
  await migrate(db, { migrationsFolder: "drizzle" });
});

afterAll(async () => {
  await client?.end({ timeout: 5 });
  await container?.stop();
});

describe("UserRepository (Drizzle + Postgres real)", () => {
  it("cria e lê por id e email", async () => {
    const repo = createDrizzleUserRepository(db);

    const created = await repo.create({
      email: "ada@itest.dev",
      name: "Ada",
      role: "admin",
    });

    expect(created.id).toBeTruthy();
    expect(created.role).toBe("admin");
    expect(created.createdAt).toBeInstanceOf(Date);

    expect(await repo.findById(created.id)).toMatchObject({
      email: "ada@itest.dev",
    });
    expect(await repo.findByEmail("ada@itest.dev")).toMatchObject({
      id: created.id,
    });
  });

  it("aplica o default role 'user' quando não informado", async () => {
    const repo = createDrizzleUserRepository(db);
    const user = await repo.create({ email: "norole@itest.dev", name: null });
    expect(user.role).toBe("user");
  });

  it("atualiza o name e retorna a entidade atualizada", async () => {
    const repo = createDrizzleUserRepository(db);
    const user = await repo.create({ email: "update@itest.dev", name: "Old" });

    const updated = await repo.update(user.id, { name: "New" });
    expect(updated?.name).toBe("New");
  });

  it("update retorna null para id inexistente", async () => {
    const repo = createDrizzleUserRepository(db);
    const result = await repo.update("00000000-0000-0000-0000-000000000000", {
      name: "x",
    });
    expect(result).toBeNull();
  });

  it("deleta e reflete a remoção", async () => {
    const repo = createDrizzleUserRepository(db);
    const user = await repo.create({ email: "delete@itest.dev", name: null });

    expect(await repo.delete(user.id)).toBe(true);
    expect(await repo.findById(user.id)).toBeNull();
    expect(await repo.delete(user.id)).toBe(false);
  });

  it("garante unicidade de email (constraint do banco)", async () => {
    const repo = createDrizzleUserRepository(db);
    await repo.create({ email: "dup@itest.dev", name: null });

    await expect(
      repo.create({ email: "dup@itest.dev", name: null }),
    ).rejects.toThrow();
  });
});

describe("CredentialsRepository (cascade)", () => {
  it("remove as credenciais ao deletar o usuário (FK cascade)", async () => {
    const users = createDrizzleUserRepository(db);
    const credentials = createDrizzleCredentialsRepository(db);

    const user = await users.create({ email: "cascade@itest.dev", name: null });
    await credentials.create({
      userId: user.id,
      email: "cascade@itest.dev",
      passwordHash: "hash",
    });

    expect(await credentials.findByUserId(user.id)).toMatchObject({
      userId: user.id,
    });

    await users.delete(user.id);
    expect(await credentials.findByUserId(user.id)).toBeNull();
  });
});
