/**
 * Admin Access — Allowed Domains API
 *
 * GET    /api/admin/domains            -> list domains
 * POST   /api/admin/domains            -> add a domain   { domain }
 * DELETE /api/admin/domains?domain=... -> remove a domain
 */

import { auth } from "@/auth";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";

const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

async function listDomains() {
  const { rows } = await query<{ domain: string }>(
    `SELECT domain FROM allowed_domains ORDER BY domain`
  );
  return rows;
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const domains = await listDomains();
  return NextResponse.json({ domains });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const raw = typeof body.domain === "string" ? body.domain.trim().toLowerCase() : "";
  if (!raw || !DOMAIN_RE.test(raw)) {
    return NextResponse.json({ error: "Enter a valid domain (e.g. company.com)" }, { status: 400 });
  }

  try {
    await query(
      `INSERT INTO allowed_domains (domain) VALUES ($1) ON CONFLICT (domain) DO NOTHING`,
      [raw]
    );
    const domains = await listDomains();
    return NextResponse.json({ domains });
  } catch (error) {
    console.error("[api/admin/domains POST] error:", error);
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const domain = (searchParams.get("domain") || "").trim().toLowerCase();
  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  // Safety: never let an admin remove their own sign-in domain (lockout guard).
  const adminEmail = session.user.email ?? "";
  if (adminEmail.toLowerCase().endsWith("@" + domain)) {
    return NextResponse.json(
      { error: "You can't remove your own sign-in domain." },
      { status: 400 }
    );
  }

  // Safety: never delete the last remaining domain.
  const { rows: all } = await query<{ domain: string }>(
    `SELECT domain FROM allowed_domains`
  );
  if (all.length <= 1) {
    return NextResponse.json(
      { error: "Keep at least one allowed domain." },
      { status: 400 }
    );
  }

  try {
    await query(`DELETE FROM allowed_domains WHERE domain = $1`, [domain]);
    const domains = await listDomains();
    return NextResponse.json({ domains });
  } catch (error) {
    console.error("[api/admin/domains DELETE] error:", error);
    return NextResponse.json({ error: "Failed to remove domain" }, { status: 500 });
  }
}
