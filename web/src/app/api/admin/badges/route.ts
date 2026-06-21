import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import type { Badge } from "@/lib/types";

// GET /api/admin/badges — list all badge definitions (admin only)
export async function GET() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const { rows } = await query<Badge>(
    `SELECT id, slug, name, description, is_quarterly, display_order
     FROM badges
     ORDER BY display_order ASC`
  );
  return NextResponse.json({ badges: rows });
}
