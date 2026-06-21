import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import type { UserProfilePatch, UserRole, UserStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/profile — update the caller's self-editable fields.
//
// Whitelisted fields: fullName, avatarUrl, phone, town, hireDate.
// email, role, status, id are SILENTLY STRIPPED (never an error) so the
// client cannot escalate privileges via mass-assignment.
// ─────────────────────────────────────────────────────────────────────────

export async function PATCH(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Validate + collect only allowed fields ────────────────────────────
  const patch: UserProfilePatch = {};
  if (typeof body.fullName === "string") {
    const t = body.fullName.trim();
    if (t.length === 0 || t.length > 200) {
      return NextResponse.json({ error: "fullName must be 1-200 chars" }, { status: 400 });
    }
    patch.fullName = t;
  }
  if (body.avatarUrl === null || typeof body.avatarUrl === "string") {
    const v = body.avatarUrl;
    if (typeof v === "string" && v.length > 0) {
      try {
        new URL(v);
      } catch {
        return NextResponse.json({ error: "avatarUrl must be a URL" }, { status: 400 });
      }
    }
    patch.avatarUrl = v === "" ? null : v;
  }
  if (body.phone === null || typeof body.phone === "string") {
    const v = typeof body.phone === "string" ? body.phone.trim() : null;
    if (v !== null && v.length > 32) {
      return NextResponse.json({ error: "phone too long" }, { status: 400 });
    }
    patch.phone = v;
  }
  if (body.town === null || typeof body.town === "string") {
    const v = typeof body.town === "string" ? body.town.trim() : null;
    if (v !== null && v.length > 200) {
      return NextResponse.json({ error: "town too long" }, { status: 400 });
    }
    patch.town = v;
  }
  if (body.hireDate === null || typeof body.hireDate === "string") {
    if (typeof body.hireDate === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(body.hireDate)) {
      return NextResponse.json({ error: "hireDate must be YYYY-MM-DD or null" }, { status: 400 });
    }
    patch.hireDate = body.hireDate as string | null;
  }

  // ── Build a dynamic UPDATE (only touch provided fields) ───────────────
  const cols: string[] = [];
  const vals: unknown[] = [];
  const map: Record<keyof UserProfilePatch, string> = {
    fullName: "full_name",
    avatarUrl: "avatar_url",
    phone: "phone",
    town: "town",
    hireDate: "hire_date",
  };
  (Object.keys(map) as (keyof UserProfilePatch)[]).forEach((k) => {
    if (k in patch) {
      cols.push(`${map[k]} = $${cols.length + 1}`);
      vals.push(patch[k]);
    }
  });

  if (cols.length === 0) {
    return NextResponse.json({ user }, { status: 200 }); // nothing to do
  }

  vals.push(user.id);
  const { rows } = await query<{
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    town: string | null;
    hire_date: Date | null;
    role: UserRole;
    status: UserStatus;
  }>(
    `UPDATE app_users
        SET ${cols.join(", ")}
      WHERE id = $${vals.length}
      RETURNING id, email, full_name, avatar_url, phone, town, hire_date, role, status`,
    vals
  );

  const r = rows[0];
  const updated = {
    id: r.id,
    email: r.email,
    fullName: r.full_name ?? "",
    avatarUrl: r.avatar_url,
    phone: r.phone,
    town: r.town,
    hireDate: r.hire_date ? r.hire_date.toISOString().slice(0, 10) : null,
    role: r.role,
    status: r.status,
  };
  return NextResponse.json({ user: updated });
}
