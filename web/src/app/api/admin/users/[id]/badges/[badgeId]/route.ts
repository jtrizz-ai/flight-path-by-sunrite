import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// DELETE /api/admin/users/[id]/badges/[badgeId]?quarter=&year= — revoke a badge
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; badgeId: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin")
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });

  const { id: userId, badgeId } = await params;
  const url = new URL(req.url);
  const quarter = url.searchParams.get("quarter");
  const year = url.searchParams.get("year");

  await query(
    `DELETE FROM user_badges
     WHERE user_id = $1 AND badge_id = $2
       AND COALESCE(quarter::text, '') = $3
       AND COALESCE(year::text, '') = $4`,
    [userId, badgeId, quarter ?? "", year ?? ""]
  );

  return NextResponse.json({ ok: true });
}

async function requireAuth() {
  const { auth } = await import("@/auth");
  return auth();
}
