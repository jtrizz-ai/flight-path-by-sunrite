import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import type { UserRole, UserStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// POST /api/profile/avatar — upload a profile image.
//
// Accepts multipart/form-data with a single "file" field (image/png, image/jpeg,
// image/webp, or image/gif). The image is saved to /public/avatars/<userId>-<rand>.<ext>
// and the user's avatar_url is updated to that static path.
//
// Max size: 5 MB. Files larger than that are rejected with a 413.
// ─────────────────────────────────────────────────────────────────────────

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 413 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPEG, WebP, or GIF." },
      { status: 415 }
    );
  }

  // Build a unique filename: <userId>-<8 random hex>.<ext>
  const rand = randomBytes(4).toString("hex");
  const filename = `${user.id}-${rand}.${ext}`;

  // Resolve the destination inside /public/avatars (works in dev and in the
  // built Next.js server since /public is relative to the web/ cwd).
  const publicDir = join(process.cwd(), "public", "avatars");
  await mkdir(publicDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(join(publicDir, filename), Buffer.from(bytes));

  const avatarUrl = `/avatars/${filename}`;

  await query(
    `UPDATE app_users SET avatar_url = $1 WHERE id = $2`,
    [avatarUrl, user.id]
  );

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
    `SELECT id, email, full_name, avatar_url, phone, town, hire_date, role, status
       FROM app_users WHERE id = $1 LIMIT 1`,
    [user.id]
  );

  const r = rows[0];
  const updated = r
    ? {
        id: r.id,
        email: r.email,
        fullName: r.full_name ?? "",
        avatarUrl: r.avatar_url,
        phone: r.phone,
        town: r.town,
        hireDate: r.hire_date ? r.hire_date.toISOString().slice(0, 10) : null,
        role: r.role,
        status: r.status,
      }
    : { ...user, avatarUrl };

  return NextResponse.json({ user: updated, avatarUrl });
}
