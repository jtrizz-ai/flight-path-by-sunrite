/**
 * Admin Access — Invites API
 *
 * GET    /api/admin/invites            -> list invites (most recent 50)
 * POST   /api/admin/invites            -> invite an email  { email }
 * DELETE /api/admin/invites?email=...  -> revoke an invite
 *
 * Invites live in the `invites` table. The corresponding `app_users` row is
 * created automatically when the person first signs in (handled by the auth
 * callback), so this endpoint only manages the invite rows.
 */

import { auth } from "@/auth";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";

type InviteRow = { email: string; status: string; created_at: string };

async function listInvites(): Promise<InviteRow[]> {
  const { rows } = await query<InviteRow>(
    `SELECT email, status, created_at FROM invites ORDER BY created_at DESC LIMIT 50`
  );
  return rows;
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const invites = await listInvites();
  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const raw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!raw || !raw.includes("@") || !raw.includes(".")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  try {
    await query(
      `INSERT INTO invites (email, status, invited_by)
       VALUES ($1, 'pending', $2)
       ON CONFLICT (email) DO UPDATE SET status = 'pending', invited_by = $2`,
      [raw, session.user.id]
    );
    const invites = await listInvites();
    return NextResponse.json({ invites });
  } catch (error) {
    console.error("[api/admin/invites POST] error:", error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  try {
    await query(`DELETE FROM invites WHERE lower(email) = $1`, [email]);
    const invites = await listInvites();
    return NextResponse.json({ invites });
  } catch (error) {
    console.error("[api/admin/invites DELETE] error:", error);
    return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 });
  }
}
