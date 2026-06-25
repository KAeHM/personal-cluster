import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserRepository } from "@/modules/users/infrastructure/user.repository.factory";
import { DEFAULT_USER_ROLE } from "@/modules/users/domain/role";
import { verifyCredentials } from "../../../../application/credentials/verify-credentials";

/**
 * Config do NextAuth (Auth.js v5). Estratégia `jwt` porque o Credentials
 * provider não usa database adapter. O `authorize` costura com o use case
 * agnóstico `verifyCredentials` e enriquece a sessão com a `role` do perfil.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const authUser = await verifyCredentials(email, password);
        if (!authUser) {
          return null;
        }

        const profile = await (await getUserRepository()).findById(authUser.id);

        return {
          id: authUser.id,
          email: authUser.email ?? profile?.email,
          name: profile?.name ?? undefined,
          role: profile?.role ?? DEFAULT_USER_ROLE,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      return session;
    },
  },
};
