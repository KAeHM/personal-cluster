import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { eq } from "drizzle-orm";
import type { Provider } from "next-auth/providers";

import { authConfig } from "@/auth.config";
import { db, getDb } from "@/lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";
import { getOrCreateUserByEmail } from "@/lib/tasks/queries";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
    );
  }

  if (process.env.AUTH_RESEND_KEY && process.env.AUTH_EMAIL_FROM) {
    providers.push(
      Resend({
        apiKey: process.env.AUTH_RESEND_KEY,
        from: process.env.AUTH_EMAIL_FROM,
      }),
    );
  }

  if (process.env.NODE_ENV === "development" || providers.length === 0) {
    providers.push(
      Credentials({
        name: "E-mail",
        credentials: {
          name: { label: "Nome", type: "text" },
          email: { label: "E-mail", type: "email" },
        },
        async authorize(credentials) {
          const email = credentials?.email?.toString().trim().toLowerCase();
          const name = credentials?.name?.toString().trim();

          if (!email) return null;

          const user = await getOrCreateUserByEmail(email, name);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        },
      }),
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  ...(process.env.DATABASE_URL
    ? {
        adapter: DrizzleAdapter(getDb(), {
          usersTable: users,
          accountsTable: accounts,
          sessionsTable: sessions,
          verificationTokensTable: verificationTokens,
        }),
      }
    : {}),
  providers: buildProviders(),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.email) token.email = user.email;
      }

      if (token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, String(token.email).toLowerCase()),
        });
        if (dbUser) {
          token.id = dbUser.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
