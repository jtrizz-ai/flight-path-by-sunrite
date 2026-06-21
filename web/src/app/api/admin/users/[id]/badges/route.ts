import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Badge } from "@/lib/types";

// GET /api/admin/users/[id]/badges — list all badges earned by this user
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin")
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });

  const { id: userId } = await params;
  const { rows } = await query<{
    id: string;
    badge_id: string;
    quarter: number | null;
    year: number | null;
    awarded_at: string;
  }>(
    `SELECT id, badge_id, quarter, year, awarded_at
     FROM user_badges
     WHERE user_id = $1
     ORDER BY awarded_at DESC`,
    [userId]
  );

  return NextResponse.json({ badges: rows });
}

// POST /api/admin/users/[id]/badges — award a badge
// Body: { badgeId, quarter?, year?, notes? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin")
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });

  const { id: userId } = await params;

  let body: { badgeId?: unknown; quarter?: unknown; year?: unknown; notes?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { badgeId, quarter, year, notes } = body as {
    badgeId?: string;
    quarter?: number;
    year?: number;
    notes?: string;
  };

  if (!badgeId) {
    return NextResponse.json({ error: "badgeId required" }, { status: 400 });
  }

  try {
    const { rows } = await query<{
      id: string;
      badge_id: string;
      quarter: number | null;
      year: number | null;
      awarded_at: string;
    }>(
      `INSERT INTO user_badges (user_id, badge_id, quarter, year, awarded_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, badge_id, quarter, year)
       DO UPDATE SET notes = EXCLUDED.notes, awarded_at = now()
       RETURNING id, badge_id, quarter, year, awarded_at`,
      [userId, badgeId, quarter ?? null, year ?? null, session.user.id, notes ?? null]
    );

    // Return badge details alongside
    const badge = await query<Badge>(
      `SELECT id, slug, name, description, is_quarterly, display_order
       FROM badges WHERE id = $1`,
      [badgeId]
    );

    return NextResponse.json({
      userBadge: rows[0],
      badge: badge.rows[0],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to award badge" },
      { status: 500 }
    );
  }
}

// Minimal inline auth helper (avoids importing the full session resolver)
async function requireAuth() {
  const { auth } = await import("@/auth");
  return auth();
}
