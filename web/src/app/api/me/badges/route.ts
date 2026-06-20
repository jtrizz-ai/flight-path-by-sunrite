import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import type { Badge } from "@/lib/types";

// GET /api/me/badges — current user's earned badges (for home display)
export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { rows } = await query<{
    id: string;
    badge_id: string;
    slug: string;
    name: string;
    description: string | null;
    is_quarterly: boolean;
    display_order: number;
    quarter: number | null;
    year: number | null;
    awarded_at: string;
  }>(
    `SELECT ub.id, ub.badge_id, b.slug, b.name, b.description,
            b.is_quarterly, b.display_order,
            ub.quarter, ub.year, ub.awarded_at
     FROM user_badges ub
     JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = $1
     ORDER BY b.display_order ASC, ub.awarded_at DESC`,
    [user.id]
  );

  const badges = rows.map((r) => ({
    id: r.badge_id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    is_quarterly: r.is_quarterly,
    display_order: r.display_order,
    quarter: r.quarter,
    year: r.year,
    awarded_at: r.awarded_at,
  }));

  return NextResponse.json({ badges });
}
