import type { UserRole } from "../../../domain/role";
import type { NewUser, UpdateUser, User } from "../../../domain/user";
import type { UserRepository } from "../../../domain/user.repository";
import { createSupabaseAdminClient } from "@/common/adapters/supabase/admin";

type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

function toDomain(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function generatePassword(): string {
  return crypto.randomUUID().replace(/-/g, "") + "Aa1!";
}

/**
 * Repositório de perfis via Supabase (tabela `profiles` + auth.users).
 * Usa service role no servidor; autorização fica nos guards/use cases.
 */
export function createSupabaseUserRepository(): UserRepository {
  const admin = createSupabaseAdminClient();

  return {
    async findById(id: string): Promise<User | null> {
      const { data, error } = await admin
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data ? toDomain(data as ProfileRow) : null;
    },

    async findByEmail(email: string): Promise<User | null> {
      const { data, error } = await admin
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data ? toDomain(data as ProfileRow) : null;
    },

    async list(): Promise<User[]> {
      const { data, error } = await admin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }
      return (data as ProfileRow[]).map(toDomain);
    },

    async create(data: NewUser): Promise<User> {
      const password = data.password ?? generatePassword();

      const { data: authData, error: authError } =
        await admin.auth.admin.createUser({
          email: data.email,
          password,
          email_confirm: true,
          user_metadata: { name: data.name ?? undefined },
          app_metadata: { role: data.role ?? "user" },
        });

      if (authError) {
        throw authError;
      }

      const userId = authData.user.id;

      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      return toDomain(profile as ProfileRow);
    },

    async update(id: string, data: UpdateUser): Promise<User | null> {
      const payload: Partial<Pick<ProfileRow, "name" | "role">> = {};
      if (data.name !== undefined) {
        payload.name = data.name;
      }
      if (data.role !== undefined) {
        payload.role = data.role;
      }

      if (Object.keys(payload).length === 0) {
        return this.findById(id);
      }

      if (data.role !== undefined) {
        const { error: metaError } = await admin.auth.admin.updateUserById(id, {
          app_metadata: { role: data.role },
        });
        if (metaError) {
          throw metaError;
        }
      }

      const { data: row, error } = await admin
        .from("profiles")
        .update(payload)
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (error) {
        throw error;
      }
      return row ? toDomain(row as ProfileRow) : null;
    },

    async delete(id: string): Promise<boolean> {
      const existing = await this.findById(id);
      if (!existing) {
        return false;
      }

      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) {
        throw error;
      }
      return true;
    },
  };
}
