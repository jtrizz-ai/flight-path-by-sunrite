import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import { checkLoginGate, upsertAppUser } from "@/lib/auth/gate";
import { query } from "@/lib/db";
import type { UserRole } from "@/lib/types";

// Our private JWT fields (cached at first sign-in). We type these explicitly
// rather than via module augmentation, which is brittle across Auth.js betas.
// Phase 1: Updated to use the new 5-role system
type AppJWT = JWT & { uid?: string; role?: UserRole };

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
      console.log(`[auth] signIn callback triggered for: ${email || 'NO EMAIL'}`);
      
      if (!email) {
        console.error('[auth] signIn failed: no email provided');
        return false;
      }

      const result = await checkLoginGate(email);
      console.log(`[auth] gate check result for ${email}:`, result);
      
      if (!result.allowed) {
        // Safe, secret-free log so the admin can see who was turned away.
        console.warn(`[auth] login denied (${result.reason}): ${email}`);
        return false;
      }

      // Allowed: make sure a row exists in app_users (with their role).
      console.log(`[auth] creating/updating app_user for ${email}`);
      await upsertAppUser(email, user.name ?? null, user.image ?? null);
      console.log(`[auth] signIn successful for ${email}`);
      return true;
    },

    // ── JWT: refresh uid + role from DB on every call ──────────────────
    // Originally this only ran on first sign-in (when account/profile are
    // present), which meant role changes by an admin didn't take effect
    // until the user signed out and back in. Now we always query so admin
    // role/status changes propagate immediately.
    async jwt({ token, account, profile }) {
      const t = token as AppJWT;
      const email =
        (profile as { email?: string })?.email?.toLowerCase() ??
        (t.email as string | undefined)?.toLowerCase();

      if (!email) return token;

      try {
        const { rows } = await query<{ id: string; role: UserRole }>(
          `SELECT id, role FROM app_users WHERE lower(email) = $1 LIMIT 1`,
          [email]
        );
        if (rows[0]) {
          t.uid = rows[0].id;
          t.role = rows[0].role;
        }
      } catch {
        // DB error — keep existing token values
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
