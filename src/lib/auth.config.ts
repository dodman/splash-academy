import type { NextAuthConfig } from "next-auth";

// Reject known-weak / placeholder secrets. A predictable AUTH_SECRET lets
// anyone forge JWT session tokens (including OVERALL_ADMIN), so this must be a
// high-entropy value in production.
const AUTH_SECRET = process.env.AUTH_SECRET;
const WEAK_SECRETS = new Set([
  "splash-academy-dev-secret-change-in-production",
  "secret",
  "changeme",
  "development",
]);

function assertStrongSecret() {
  const invalid =
    !AUTH_SECRET || AUTH_SECRET.length < 32 || WEAK_SECRETS.has(AUTH_SECRET);
  if (invalid) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET is missing or too weak. Set a high-entropy value " +
          "(e.g. `openssl rand -base64 48`) before starting in production."
      );
    }
    // eslint-disable-next-line no-console
    console.warn(
      "[auth] AUTH_SECRET is missing or weak — this is only tolerated outside production."
    );
  }
}

assertStrongSecret();

// This config is Edge-compatible (no Node.js/Prisma imports)
export const authConfig: NextAuthConfig = {
  secret: AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // Providers are added in auth.ts (server-only)
  session: {
    strategy: "jwt",
  },
};
