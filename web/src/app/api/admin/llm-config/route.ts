import { NextResponse } from "next/server";
import { requireUser, isAdmin } from "@/lib/auth/resolveSession";
import { getLlmConfig, setLlmConfig, maskApiKey } from "@/lib/chat/llmConfig";

// ─────────────────────────────────────────────────────────────────────────
// GET  /api/admin/llm-config — read current config (API key masked).
// PUT  /api/admin/llm-config — update baseUrl/model/apiKey (any subset).
// Admin only.
// ─────────────────────────────────────────────────────────────────────────

async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  return user;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;
  const cfg = await getLlmConfig();
  return NextResponse.json({
    baseUrl: cfg.baseUrl,
    model: cfg.model,
    apiKeyMasked: maskApiKey(cfg.apiKey),
  });
}

export async function PUT(req: Request) {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;

  let body: { baseUrl?: unknown; model?: unknown; apiKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: { baseUrl?: string; model?: string; apiKey?: string } = {};
  if (typeof body.baseUrl === "string") {
    try {
      new URL(body.baseUrl);
    } catch {
      return NextResponse.json(
        { error: "baseUrl must be a URL" },
        { status: 400 }
      );
    }
    patch.baseUrl = body.baseUrl;
  }
  if (typeof body.model === "string") {
    if (body.model.trim().length === 0) {
      return NextResponse.json({ error: "model cannot be empty" }, { status: 400 });
    }
    patch.model = body.model.trim();
  }
  if (typeof body.apiKey === "string") {
    patch.apiKey = body.apiKey;
  }

  const next = await setLlmConfig(patch);
  return NextResponse.json({
    baseUrl: next.baseUrl,
    model: next.model,
    apiKeyMasked: maskApiKey(next.apiKey),
  });
}
