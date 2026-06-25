import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";

// ─────────────────────────────────────────────────────────────────────────
// Journal entry detail — GET / PATCH / DELETE a single entry by id.
// ─────────────────────────────────────────────────────────────────────────

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const { id } = await ctx.params;

  const { rows } = await query(
    `SELECT id, entry_date, title, wins, challenges, tomorrows_focus, created_at, updated_at
       FROM journal_entries
      WHERE id = $1 AND user_id = $2
      LIMIT 1`,
    [id, user.id]
  );

  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ entry: rows[0] });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only allow updating these fields (date stays locked)
  const allowed = ["title", "wins", "challenges", "tomorrows_focus"] as const;
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (key in body) {
      sets.push(`${key} = $${idx++}`);
      vals.push(typeof body[key] === "string" ? body[key] : "");
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  sets.push(`updated_at = now()`);

  const { rows } = await query(
    `UPDATE journal_entries
        SET ${sets.join(", ")}
      WHERE id = $${idx++} AND user_id = $${idx}
      RETURNING id, entry_date, title, wins, challenges, tomorrows_focus, created_at, updated_at`,
    [...vals, id, user.id]
  );

  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ entry: rows[0] });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const { id } = await ctx.params;

  const { rowCount } = await query(
    `DELETE FROM journal_entries WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );

  if (!rowCount) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
