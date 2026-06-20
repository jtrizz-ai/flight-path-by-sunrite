import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";

// POST /api/track/app-open
// Called by the client when the app shell mounts. Increments the open
// counter, stamps last_app_open_at, and refreshes last_active_at.
export async function POST() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  await query(
    `UPDATE app_users
       SET app_open_count = app_open_count + 1,
           last_app_open_at = now(),
           last_active_at = now()
     WHERE id = $1`,
    [user.id]
  );

  return NextResponse.json({ ok: true });
}
