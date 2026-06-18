import { query } from "@/lib/db";
import type { AppUser, UserStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// THE LOGIN GATE (spec sections 2.3, 8).
// UPDATED Phase 1: Now also blocks PAUSED users.
//
// Google OAuth only PROVES identity ("you really own this email"). It does NOT
// decide who is allowed in. That decision lives here, against the database:
//   1. The email's domain must be in `allowed_domains`, AND
//   2. If invite-required is on, the exact email must be in `invites`, AND
//   3. The user's status must be 'active' (not 'paused').
// Allowed domains are NEVER hard-coded — they are read from the DB so the
// admin can change them in the portal without touching code.
// ─────────────────────────────────────────────────────────────────────────

export interface GateResult {
  allowed: boolean;
  /** Machine-readable reason when denied, for logs / friendly UI. */
  reason?: "no_email" | "domain_not_allowed" | "not_invited" | "user_paused";
}

/** Extract and normalize the domain part of an email. */
function domainOf(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

/** Is this company domain on the allowlist? */
export async function isDomainAllowed(email: string): Promise<boolean> {
  const domain = domainOf(email);
  if (!domain) return false;
  const { rows } = await query(
    `SELECT 1 FROM allowed_domains WHERE lower(domain) = $1 LIMIT 1`,
    [domain]
  );
  return rows.length > 0;
}

/** Has this exact email been invited (and not revoked)? */
export async function isInvited(email: string): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM invites WHERE lower(email) = $1 AND status <> 'revoked' LIMIT 1`,
    [email.trim().toLowerCase()]
  );
  return rows.length > 0;
}

/** Read the invite-required flag from admin_settings.auth_config. */
export async function getInviteRequired(): Promise<boolean> {
  const { rows } = await query<{ value: { inviteRequired?: boolean } }>(
    `SELECT value FROM admin_settings WHERE key = 'auth_config' LIMIT 1`
  );
  return Boolean(rows[0]?.value?.inviteRequired);
}

/** Check if this user exists and is not paused. */
export async function isUserActive(email: string): Promise<boolean> {
  const { rows } = await query<{ status: UserStatus }>(
    `SELECT status FROM app_users WHERE lower(email) = $1 LIMIT 1`,
    [email.trim().toLowerCase()]
  );
  // If user doesn't exist yet (first login), allow through - they'll be created in upsertAppUser
  if (rows.length === 0) return true;
  // If user exists, check status
  return rows[0].status === "active";
}

/** The full gate: domain allowed AND (if required) email invited AND user not paused. */
export async function checkLoginGate(rawEmail: string): Promise<GateResult> {
  const email = rawEmail?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { allowed: false, reason: "no_email" };
  }
  if (!(await isDomainAllowed(email))) {
    return { allowed: false, reason: "domain_not_allowed" };
  }
  if (await getInviteRequired()) {
    if (!(await isInvited(email))) {
      return { allowed: false, reason: "not_invited" };
    }
  }
  // Phase 1: Block paused users
  if (!(await isUserActive(email))) {
    return { allowed: false, reason: "user_paused" };
  }
  return { allowed: true };
}

/**
 * Insert the user on first login, refresh display details, and return their
 * current role. Role is the source of truth for admin access.
 * Phase 1: Now also returns status, phone, town (full AppUser shape).
 */
export async function upsertAppUser(
  rawEmail: string,
  fullName: string | null,
  avatarUrl: string | null
): Promise<AppUser> {
  const email = rawEmail.trim().toLowerCase();
  const { rows } = await query<AppUser>(
    `INSERT INTO app_users (email, full_name, avatar_url)
       VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE
       SET full_name   = COALESCE(EXCLUDED.full_name,   app_users.full_name),
           avatar_url  = COALESCE(EXCLUDED.avatar_url,  app_users.avatar_url),
           last_active_at = NOW()
     RETURNING id, email, full_name, avatar_url, role, status, phone, town, created_at, last_active_at`,
    [email, fullName, avatarUrl]
  );
  return rows[0];
}
