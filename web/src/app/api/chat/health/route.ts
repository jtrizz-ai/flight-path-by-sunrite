import { NextResponse } from "next/server";
import { requireUser, isAdmin } from "@/lib/auth/resolveSession";
import { pingLlm } from "@/lib/chat/llm";

// GET /api/chat/health (admin only) — probe the configured LLM endpoint.
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const result = await pingLlm();
  return NextResponse.json(result);
}
