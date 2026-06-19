import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkLoginGate, upsertAppUser } from "@/lib/auth/gate";
import {
  generateToken,
  hashToken,
} from "@/lib/auth/resolveSession";
import type { UserProfile, UserRole, UserStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/exchange (iOS-only).
//
// Body: { googleIdToken: string }
//
// Flow (spec section 6):
//   1. Verify the Google ID token with Google's tokeninfo endpoint.
//   2. Run checkLoginGate (allowed domain + invite + active status).
//   3. Upsert the app_user row (mirrors the web signIn callback).
//   4. Load the profile (we need the internal id + role).
//   5. Mint a 32-byte opaque token, store its SHA-256 in sessions (60 days).
//   6. Return { token, expiresIn, user }.
//
// The response uses the same "Email not allowed" message for every gate
// failure to avoid leaking which check failed.
// ─────────────────────────────────────────────────────────────────────────

const SESSION_TTL_DAYS = 60;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

type GoogleTokenInfo = {
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo | null> {
  // Google's tokeninfo is the simplest verification path; for higher traffic
  // swap to local JWT verification against Google's public keys.
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GoogleTokenInfo;
    if (!data.email) return null;
    return data;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: { googleIdToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idToken = body.googleIdToken;
  if (typeof idToken !== "string" || idToken.length === 0) {
    return NextResponse.json({ error: "googleIdToken required" }, { status: 400 });
  }

  // 1. Verify with Google.
  const info = await verifyGoogleIdToken(idToken);
  if (!info || !info.email) {
    return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
  }
  if (info.email_verified !== true && info.email_verified !== "true") {
    return NextResponse.json({ error: "Email not verified" }, { status: 401 });
  }

  const email = info.email.trim().toLowerCase();

  // 2. Run the same gate the web uses.
  const gate = await checkLoginGate(email);
  if (!gate.allowed) {
    // Single message; do not leak which check failed.
    return NextResponse.json({ error: "Email not allowed" }, { status: 403 });
  }

  // 3. Upsert the app_user row (mirrors the web signIn callback).
  await upsertAppUser(email, info.name ?? null, info.picture ?? null);

  // 4. Load the profile (we need the internal id + role).
  const { rows: userRows } = await query<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    town: string | null;
    hire_date: Date | null;
    role: UserRole;
    status: UserStatus;
  }>(
    `SELECT id, email, full_name, avatar_url, phone, town, hire_date, role, status
       FROM app_users WHERE lower(email) = $1 LIMIT 1`,
    [email]
  );
  const u = userRows[0];
  if (!u) {
    return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
  }

  // 5. Mint token, store hash. NOTE: the sessions table has columns
  //    (id, app_user_id, token_hash, expires_at, created_at) — no email column.
  //    id has DEFAULT uuid_generate_v4() so we omit it.
  const token = generateToken();
  await query(
    `INSERT INTO sessions (app_user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
    [u.id, hashToken(token), String(SESSION_TTL_DAYS)]
  );

  // 6. Return token + safe user profile.
  const profile: UserProfile = {
    id: u.id,
    email,
    fullName: u.full_name ?? "",
    avatarUrl: u.avatar_url,
    phone: u.phone,
    town: u.town,
    hireDate: u.hire_date ? u.hire_date.toISOString().slice(0, 10) : null,
    role: u.role,
    status: u.status,
  };

  return NextResponse.json({
    token,
    expiresIn: SESSION_TTL_SECONDS,
    user: profile,
  });
}
