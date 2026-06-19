import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashToken } from "@/lib/auth/resolveSession";

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/signout (iOS-only).
//
// Body: none. Reads Authorization: Bearer <token>, deletes the matching
// sessions row. Web sign-out continues to use NextAuth's /api/auth/signout.
//
// Always returns 200 { ok: true } so a stale/revoked token on the client
// does not strand the user in a "couldn't sign out" state.
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (match) {
    const tokenHash = hashToken(match[1].trim());
    await query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
  }
  return NextResponse.json({ ok: true });
}
