import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import type { Badge } from "@/lib/types";

// GET /api/admin/badges — list all badge definitions
export async function GET() {
  const { rows } = await query<Badge>(
    `SELECT id, slug, name, description, is_quarterly, display_order
     FROM badges
     ORDER BY display_order ASC`
  );
  return NextResponse.json({ badges: rows });
}
