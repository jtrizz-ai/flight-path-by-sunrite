import { auth } from "@/auth";
import { query } from "@/lib/db";
import { randomBytes, createHash } from "node:crypto";
import type { UserProfile, UserRole, UserStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// Unified session resolution (spec section 4: Auth bridge).
//
// Every API route calls resolveSession() to learn who is calling. It accepts
// EITHER:
//   1. The NextAuth cookie (web browser) - resolved via auth()
//   2. An Authorization: Bearer <token> header (iOS app), where <token> was
//      minted by POST /api/auth/exchange and stored as a SHA-256 hash in the
//      sessions table.
//
// Both paths resolve to the same UserProfile shape so route handlers don't
// care which client is calling.
// ─────────────────────────────────────────────────────────────────────────

export type ResolveSessionResult =
  | { ok: true; user: UserProfile; source: "cookie" | "bearer" }
  | { ok: false; reason: "unauthenticated" };

/** Hash a bearer token with SHA-256 (we never store the raw token). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Mint a 32-byte cryptographically random opaque token. */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Look up an app_users row by id and shape it as UserProfile. */
async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  const { rows } = await query<{
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    town: string | null;
    hire_date: Date | null;
    role: UserRole;
    status: UserStatus;
  }>(
    `SELECT id, email, full_name, avatar_url, phone, town, hire_date, role, status
       FROM app_users
      WHERE id = $1
      LIMIT 1`,
    [userId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name ?? "",
    avatarUrl: r.avatar_url,
    phone: r.phone,
    town: r.town,
    hireDate: r.hire_date ? r.hire_date.toISOString().slice(0, 10) : null,
    role: r.role,
    status: r.status,
  };
}

/**
 * Resolve the current caller. Pass the Request so we can pull the bearer
 * header; NextAuth's cookie is read from the same request under the hood.
 */
export async function resolveSession(
  req?: Request
): Promise<ResolveSessionResult> {
  // 1. Try the NextAuth cookie path first.
  try {
    const session = await auth();
    if (session?.user?.id) {
      const user = await loadUserProfile(session.user.id);
      if (user) return { ok: true, user, source: "cookie" };
    }
  } catch {
    // Cookie path failed; fall through to bearer.
  }

  // 2. Try Authorization: Bearer <token>.
  if (req) {
    const header = req.headers.get("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (match) {
      const token = match[1].trim();
      const { rows } = await query<{ app_user_id: string }>(
        `SELECT s.app_user_id
           FROM sessions s
           JOIN app_users u ON u.id = s.app_user_id
          WHERE s.token_hash = $1
            AND s.expires_at > now()
            AND u.status = 'active'
          LIMIT 1`,
        [hashToken(token)]
      );
      const row = rows[0];
      if (row) {
        const user = await loadUserProfile(row.app_user_id);
        if (user) return { ok: true, user, source: "bearer" };
      }
    }
  }

  return { ok: false, reason: "unauthenticated" };
}

/** Convenience: returns the user or a 401 Response. */
export async function requireUser(
  req?: Request
): Promise<UserProfile | Response> {
  const result = await resolveSession(req);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return result.user;
}

/** Returns true iff the resolved user is an Admin. */
export function isAdmin(user: UserProfile): boolean {
  return user.role === "Admin";
}
