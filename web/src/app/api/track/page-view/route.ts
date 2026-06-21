import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";

// POST /api/track/page-view
// Body: { path: string, title?: string }
// Logs a page view for the signed-in user and refreshes last_active_at.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let body: { path?: unknown; title?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path : "";
  const title = typeof body.title === "string" ? body.title : null;

  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  await query(
    `INSERT INTO page_views (user_id, path, title) VALUES ($1, $2, $3)`,
    [user.id, path, title]
  );

  // Refresh last_active_at without incrementing app_open_count.
  await query(`UPDATE app_users SET last_active_at = now() WHERE id = $1`, [user.id]);

  return NextResponse.json({ ok: true });
}
