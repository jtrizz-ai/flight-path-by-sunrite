import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";

// ─────────────────────────────────────────────────────────────────────────
// Tally API — persists doors/conversations/appointments increments.
//
// GET  /api/tally       -> current totals for the signed-in user
// POST /api/tally       -> log an increment { metric, amount }
// ─────────────────────────────────────────────────────────────────────────

const VALID_METRICS = ["doors", "conversations", "appointments"] as const;
type Metric = (typeof VALID_METRICS)[number];

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { rows } = await query<{ metric: string; total: string }>(
    `SELECT metric, COALESCE(SUM(amount), 0)::text AS total
     FROM tally_events
     WHERE user_id = $1
     GROUP BY metric`,
    [user.id]
  );

  const totals: Record<Metric, number> = {
    doors: 0,
    conversations: 0,
    appointments: 0,
  };
  for (const r of rows) {
    if (VALID_METRICS.includes(r.metric as Metric)) {
      totals[r.metric as Metric] = parseInt(r.total, 10);
    }
  }

  return NextResponse.json({ totals });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let body: { metric?: unknown; amount?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const metric = body.metric as string;
  const amount = typeof body.amount === "number" ? body.amount : 1;

  if (!VALID_METRICS.includes(metric as Metric)) {
    return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
  }
  if (amount < -1 || amount > 1 || amount === 0) {
    return NextResponse.json({ error: "amount must be 1 or -1" }, { status: 400 });
  }

  await query(
    `INSERT INTO tally_events (user_id, metric, amount)
     VALUES ($1, $2, $3)`,
    [user.id, metric, amount]
  );

  // Return updated totals
  const { rows } = await query<{ metric: string; total: string }>(
    `SELECT metric, COALESCE(SUM(amount), 0)::text AS total
     FROM tally_events
     WHERE user_id = $1
     GROUP BY metric`,
    [user.id]
  );

  const totals: Record<Metric, number> = {
    doors: 0,
    conversations: 0,
    appointments: 0,
  };
  for (const r of rows) {
    if (VALID_METRICS.includes(r.metric as Metric)) {
      totals[r.metric as Metric] = parseInt(r.total, 10);
    }
  }

  return NextResponse.json({ totals });
}
