/**
 * Admin User Management API - Individual User Operations
 * Phase 1: Update and Delete operations (Admin only)
 * 
 * PATCH  /api/admin/users/[id]  -> Update user (role, status)
 * DELETE /api/admin/users/[id]  -> Delete user
 */

import { auth } from "@/auth";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";
import type { AppUser, UserRole, UserStatus } from "@/lib/types";

// PATCH /api/admin/users/[id] - Update user role or status (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized: Admin role required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { role, status, region, team } = body as {
      role?: UserRole;
      status?: UserStatus;
      region?: string | null;
      team?: string | null;
    };
    const { id: userId } = await params;

    // Validate inputs
    const validRoles: UserRole[] = ["Admin", "Manager", "Team Lead", "Sales", "Field Marketer"];
    const validStatuses: UserStatus[] = ["active", "paused"];

    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | UserRole | UserStatus | null)[] = [];
    let paramIndex = 1;

    if (role) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (region !== undefined) {
      updates.push(`region = $${paramIndex++}`);
      values.push(region || null);
    }

    if (team !== undefined) {
      updates.push(`team = $${paramIndex++}`);
      values.push(team || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Add user ID as the last parameter
    values.push(userId);

    const { rows } = await query<AppUser>(
      `UPDATE app_users
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, email, full_name, avatar_url, role, status, phone, town, region, team, hire_date, created_at, last_active_at`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });
  } catch (error) {
    console.error("[api/admin/users/[id] PATCH] error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized: Admin role required" }, { status: 403 });
  }

  try {
    const { id: userId } = await params;

    // Prevent self-deletion
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const { rows } = await query<{ id: string }>(
      `DELETE FROM app_users WHERE id = $1 RETURNING id`,
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: rows[0].id });
  } catch (error) {
    console.error("[api/admin/users/[id] DELETE] error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
