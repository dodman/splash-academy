import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

// A precomputed hash of a random string. When an account doesn't exist we still
// run a bcrypt comparison against this so response timing doesn't reveal whether
// the email is registered (prevents user enumeration via timing).
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO3f7z1x9y0aBcDeFgHiJkLmNoPqRsTuW";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Node-only override (middleware keeps the Edge-safe version from
    // authConfig): re-check the user in the DB whenever the token is read so
    // that deleting an account or changing its role takes effect immediately,
    // instead of whenever the JWT happens to expire. Returning null here is
    // Auth.js's supported way to invalidate a session.
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in — authorize() just validated this user.
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        return token;
      }

      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, approved: true },
        });

        // Account deleted — invalidate the session outright.
        if (!dbUser) return null;

        // Mirror the login rule: elevated roles must be approved.
        const elevated = ["INSTRUCTOR", "ADMIN", "OVERALL_ADMIN"].includes(dbUser.role);
        if (elevated && !dbUser.approved) return null;

        // Use the live role so promotions/demotions apply instantly.
        token.role = dbUser.role;
      }

      return token;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();

        // Throttle password guessing per account.
        try {
          rateLimit(`login:${email}`, LIMITS.auth);
        } catch (err) {
          if (err instanceof RateLimitError) {
            throw new Error("Too many login attempts. Please try again shortly.");
          }
          throw err;
        }

        const user = await db.user.findUnique({ where: { email } });

        // Always run a comparison to keep timing constant whether or not the
        // account exists.
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user?.passwordHash ?? DUMMY_HASH
        );

        if (!user || !passwordMatch) return null;

        // Block unapproved instructor/admin accounts
        if (!user.approved && (user.role === "INSTRUCTOR" || user.role === "ADMIN" || user.role === "OVERALL_ADMIN")) {
          throw new Error("Your account is pending admin approval.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
