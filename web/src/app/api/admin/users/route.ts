/**
 * Admin User Management API
 * Phase 1: CRUD operations for user management (Admin only)
 * 
 * GET    /api/admin/users       -> List all users
 * POST   /api/admin/users       -> Create/invite new user
 */

import { auth } from "@/auth";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import { isDomainAllowed } from "@/lib/auth/gate";
import { NextResponse } from "next/server";
import type { AppUser, UserRole } from "@/lib/types";

// GET /api/admin/users - List all users (admin only)
export async function GET() {
  const session = await auth();
  
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized: Admin role required" }, { status: 403 });
  }

  try {
    const { rows } = await query<AppUser>(
      `SELECT id, email, full_name, avatar_url, role, status, phone, town, 
              created_at, last_active_at
       FROM app_users
       ORDER BY created_at DESC`
    );
    
    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error("[api/admin/users GET] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create/invite new user (admin only)
export async function POST(request: Request) {
  const session = await auth();
  
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized: Admin role required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, role = "Field Marketer" } = body as { email: string; role?: UserRole };

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if domain is allowed
    if (!(await isDomainAllowed(normalizedEmail))) {
      return NextResponse.json(
        { error: "Email domain is not in the allowed domains list" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { rows: existing } = await query<{ id: string }>(
      `SELECT id FROM app_users WHERE lower(email) = $1`,
      [normalizedEmail]
    );
    
    if (existing.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Create invite
    await query(
      `INSERT INTO invites (email, status, invited_by)
       VALUES ($1, 'pending', $2)
       ON CONFLICT (email) DO UPDATE
       SET status = 'pending', invited_by = $2`,
      [normalizedEmail, session.user.id]
    );

    // Create user record (they'll complete profile on first login)
    const { rows } = await query<AppUser>(
      `INSERT INTO app_users (email, role, status)
       VALUES ($1, $2, 'active')
       RETURNING id, email, full_name, avatar_url, role, status, phone, town, created_at, last_active_at`,
      [normalizedEmail, role]
    );

    return NextResponse.json({ user: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/users POST] error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
