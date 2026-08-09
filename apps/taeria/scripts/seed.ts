import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "../src/modules/users/domain/role";
import { seedTaeriaKinds } from "./seed-kinds";
import { seedTaeriaTaxonomy } from "./seed-taxonomy";

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

/** Usuários temporários de desenvolvimento — remover antes de produção. */
const SEED_USERS: SeedUser[] = [
  {
    email: "mestre.taeria@camp.dev",
    name: "Mestre Aldric",
    role: "admin",
    password: "MestreTaeria!726",
  },
  {
    email: "lyra.vento@camp.dev",
    name: "Lyra Vento",
    role: "user",
    password: "JogadorTaeria!837",
  },
  {
    email: "thorn.raiz@camp.dev",
    name: "Thorn Raiz",
    role: "user",
    password: "JogadorTaeria!948",
  },
];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      throw error;
    }

    const match = data.users.find((user) => user.email === email);
    if (match) {
      return match.id;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

async function ensureProfile(
  admin: SupabaseClient,
  userId: string,
  seed: SeedUser,
): Promise<void> {
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: seed.email,
      name: seed.name,
      role: seed.role,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function syncSeedUser(
  admin: SupabaseClient,
  seed: SeedUser,
): Promise<void> {
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", seed.email)
    .maybeSingle();

  if (existingProfile) {
    console.log(`skip  ${seed.email} (perfil já existe)`);
    return;
  }

  let userId = await findAuthUserIdByEmail(admin, seed.email);

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: seed.email,
      password: seed.password,
      email_confirm: true,
      user_metadata: { name: seed.name },
      app_metadata: { role: seed.role },
    });

    if (error) {
      throw error;
    }

    userId = data.user.id;
    console.log(`seed  ${seed.email} (senha: ${seed.password})`);
  } else {
    console.log(`sync  ${seed.email} (auth existente, criando perfil)`);
  }

  await ensureProfile(admin, userId, seed);
}

async function main(): Promise<void> {
  const admin = getAdminClient();

  const { error: tableError } = await admin
    .from("profiles")
    .select("id")
    .limit(1);
  if (tableError) {
    throw new Error(
      `Tabela profiles indisponível (${tableError.message}). Rode make db-push antes do seed.`,
    );
  }

  for (const seed of SEED_USERS) {
    await syncSeedUser(admin, seed);
  }

  await seedTaeriaKinds(admin);
  await seedTaeriaTaxonomy(admin);

  console.log("Seed concluído.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Falha no seed:", error);
  process.exit(1);
});
