import type { UserRole } from "@/modules/users/domain/role";
import { createSupabaseServerClient } from "@/common/adapters/supabase/server";
import type { AuthProviderPort } from "../../../../domain/session/auth-provider.port";
import type { AuthSession, AuthUser } from "../../../../domain/session/session";

type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data as ProfileRow | null;
}

function toAuthUser(
  user: { id: string; email?: string },
  profile: ProfileRow | null,
): AuthUser {
  return {
    id: user.id,
    email: profile?.email ?? user.email,
    name: profile?.name ?? undefined,
    roles: profile?.role ? [profile.role] : [],
  };
}

/**
 * Adapter que satisfaz a `AuthProviderPort` via Supabase Auth + perfil.
 */
export function createSupabaseAuthProvider(): AuthProviderPort {
  return {
    async getSession(): Promise<AuthSession | null> {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const profile = await fetchProfile(user.id);
      const authUser = toAuthUser(user, profile);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      return {
        user: authUser,
        expiresAt: session?.expires_at ? session.expires_at * 1000 : undefined,
      };
    },

    async getCurrentUser(): Promise<AuthUser | null> {
      const session = await this.getSession();
      return session?.user ?? null;
    },

    async signOut(): Promise<void> {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    },
  };
}
