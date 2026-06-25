import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";

// ─────────────────────────────────────────────────────────────────────────
// Journal API — list and create daily journal entries.
//
// GET  /api/journal          -> paginated list of user's entries (newest first)
// POST /api/journal          -> create a new entry (date defaults to today)
// ─────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10), 0);

  const { rows } = await query(
    `SELECT id, entry_date, title, wins, challenges, tomorrows_focus, created_at, updated_at
       FROM journal_entries
      WHERE user_id = $1
      ORDER BY entry_date DESC
      LIMIT $2 OFFSET $3`,
    [user.id, limit, offset]
  );

  return NextResponse.json({ entries: rows });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let body: { title?: unknown; entry_date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() || null : null;
  const entryDate = typeof body.entry_date === "string" ? body.entry_date : null;

  // Validate date format if provided (YYYY-MM-DD)
  if (entryDate && !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return NextResponse.json({ error: "Invalid date format, use YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const { rows } = await query(
      `INSERT INTO journal_entries (user_id, entry_date, title)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3)
       RETURNING id, entry_date, title, wins, challenges, tomorrows_focus, created_at, updated_at`,
      [user.id, entryDate, title]
    );
    return NextResponse.json({ entry: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "An entry for this date already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
