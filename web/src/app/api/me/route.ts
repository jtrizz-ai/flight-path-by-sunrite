import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/resolveSession";

// GET /api/me — return the caller's full profile.
// Works for both web (cookie) and iOS (bearer).
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  return NextResponse.json({ user });
}
