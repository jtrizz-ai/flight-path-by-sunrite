import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import { checkLoginGate, upsertAppUser } from "@/lib/auth/gate";
import { query } from "@/lib/db";

// Our private JWT fields (cached at first sign-in). We type these explicitly
// rather than via module augmentation, which is brittle across Auth.js betas.
type AppJWT = JWT & { uid?: string; role?: "member" | "admin" };

// ─────────────────────────────────────────────────────────────────────────
// Auth.js (NextAuth v5) central config.
//
// Exported pieces:
//   handlers  -> mounted at app/api/auth/[...nextauth]/route.ts
//   auth      -> call in server components / route handlers to read the session
//   signIn    -> server action to start Google sign-in
//   signOut   -> server action to log out
//
// Login model: Google proves identity; the GATE (lib/auth/gate.ts) decides
// who is allowed. Sessions are signed JWT cookies (no extra DB lookup per
// request; the internal user id + role are cached in the token).
// ─────────────────────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Needed so AUTH_URL / request host is trusted on non-Vercel hosting.
  trustHost: true,
  session: { strategy: "jwt" },

  providers: [
    Google({
      // Always show the account chooser so people pick the right Workspace account.
      authorization: { params: { prompt: "select_account" } },
    }),
  ],

  pages: {
    // The landing page at "/" doubles as the sign-in + error page.
    signIn: "/",
    error: "/",
  },

  callbacks: {
    // ── THE GATE ────────────────────────────────────────────────────────
    // Runs after Google verifies the email but BEFORE a session is created.
    // Returning false denies the login and sends the user to `pages.error`.
    async signIn({ user }) {
      const email = user?.email?.trim().toLowerCase();
      if (!email) return false;

      const result = await checkLoginGate(email);
      if (!result.allowed) {
        // Safe, secret-free log so the admin can see who was turned away.
        console.warn(`[auth] login denied (${result.reason}): ${email}`);
        return false;
      }

      // Allowed: make sure a row exists in app_users (with their role).
      await upsertAppUser(email, user.name ?? null, user.image ?? null);
      return true;
    },

    // ── FIRST SIGN-IN ONLY ──────────────────────────────────────────────
    // `account`/`profile` are present only on the initial OAuth exchange, so
    // the DB lookup happens once and is then cached in the JWT.
    async jwt({ token, account, profile }) {
      const t = token as AppJWT;
      if (account && profile) {
        const email = (profile as { email?: string })?.email?.toLowerCase();
        if (email) {
          const { rows } = await query<{ id: string; role: "member" | "admin" }>(
            `SELECT id, role FROM app_users WHERE lower(email) = $1 LIMIT 1`,
            [email]
          );
          if (rows[0]) {
            t.uid = rows[0].id;
            t.role = rows[0].role;
          }
        }
      }
      return token;
    },

    // ── EXPOSE TO SERVER COMPONENTS ─────────────────────────────────────
    // Pure mapping (no DB) so it is safe wherever auth() runs.
    async session({ session, token }) {
      const t = token as AppJWT;
      if (t.uid) session.user.id = t.uid;
      if (t.role) session.user.role = t.role;
      return session;
    },
  },
});
