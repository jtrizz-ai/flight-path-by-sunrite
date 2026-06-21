import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/admin/users/[id]/stats — full activity + tally breakdown for one user
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin")
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });

  const { id: userId } = await params;

  // User profile + activity fields
  const { rows: userRows } = await query<{
    email: string;
    full_name: string | null;
    region: string | null;
    team: string | null;
    role: string;
    status: string;
    app_open_count: number;
    last_app_open_at: string | null;
    last_active_at: string;
    created_at: string;
  }>(
    `SELECT email, full_name, region, team, role, status,
            app_open_count, last_app_open_at, last_active_at, created_at
     FROM app_users WHERE id = $1`,
    [userId]
  );

  if (userRows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Tally totals by metric
  const { rows: tallyRows } = await query<{ metric: string; total: string }>(
    `SELECT metric, COALESCE(SUM(amount), 0)::text AS total
     FROM tally_events WHERE user_id = $1 GROUP BY metric`,
    [userId]
  );

  const tally: Record<string, number> = { doors: 0, conversations: 0, appointments: 0 };
  for (const r of tallyRows) {
    tally[r.metric] = parseInt(r.total, 10);
  }

  // Tally by quarter (current quarter)
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();
  const qStartMonth = (currentQuarter - 1) * 3;
  const qStart = new Date(currentYear, qStartMonth, 1);

  const { rows: quarterRows } = await query<{ metric: string; total: string }>(
    `SELECT metric, COALESCE(SUM(amount), 0)::text AS total
     FROM tally_events
     WHERE user_id = $1 AND created_at >= $2
     GROUP BY metric`,
    [userId, qStart.toISOString()]
  );

  const quarterlyTally: Record<string, number> = { doors: 0, conversations: 0, appointments: 0 };
  for (const r of quarterRows) {
    quarterlyTally[r.metric] = parseInt(r.total, 10);
  }

  // Recent page views (last 20)
  const { rows: viewRows } = await query<{
    path: string;
    title: string | null;
    created_at: string;
  }>(
    `SELECT path, title, created_at
     FROM page_views WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );

  // Badges
  const { rows: badgeRows } = await query<{
    name: string;
    slug: string;
    is_quarterly: boolean;
    quarter: number | null;
    year: number | null;
    awarded_at: string;
  }>(
    `SELECT b.name, b.slug, b.is_quarterly, ub.quarter, ub.year, ub.awarded_at
     FROM user_badges ub
     JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = $1
     ORDER BY b.display_order ASC, ub.awarded_at DESC`,
    [userId]
  );

  return NextResponse.json({
    user: userRows[0],
    tally,
    quarterlyTally,
    quarter: currentQuarter,
    year: currentYear,
    recentViews: viewRows,
    badges: badgeRows,
  });
}
