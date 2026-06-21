import { query } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────
// LLM configuration (spec section 8).
//
// The active config lives in admin_settings.llm_config JSONB. On first boot
// we seed from process.env so a fresh install works without DB edits. After
// first boot, all changes go through PUT /api/admin/llm-config.
//
// The config is cached in-process for 60 seconds to avoid a DB lookup on
// every chat message.
// ─────────────────────────────────────────────────────────────────────────

export type LlmConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

const DEFAULT_CONFIG: LlmConfig = {
  baseUrl: process.env.LLM_BASE_URL ?? "http://100.101.18.67:1234/v1",
  model: process.env.LLM_MODEL ?? "local-model",
  apiKey: process.env.LLM_API_KEY ?? "not-needed",
};

let cache: { value: LlmConfig; expiresAt: number } | null = null;
const TTL_MS = 60_000;

let seeded = false;

/** Seed admin_settings.llm_config if missing. Called once at module load. */
export async function ensureLlmConfigSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;
  try {
    await query(
      `INSERT INTO admin_settings (key, value)
       VALUES ('llm_config', $1)
       ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify(DEFAULT_CONFIG)]
    );
  } catch {
    // Best-effort; if this fails the route will surface a clearer error.
  }
}

/** Read the current LLM config (cached for TTL_MS). */
export async function getLlmConfig(): Promise<LlmConfig> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }
  await ensureLlmConfigSeeded();
  const { rows } = await query<{ value: LlmConfig }>(
    `SELECT value FROM admin_settings WHERE key = 'llm_config' LIMIT 1`
  );
  const value = rows[0]?.value ?? DEFAULT_CONFIG;
  cache = { value, expiresAt: Date.now() + TTL_MS };
  return value;
}

/** Update the config (admin only) and bust the cache. */
export async function setLlmConfig(patch: Partial<LlmConfig>): Promise<LlmConfig> {
  const current = await getLlmConfig();
  const next: LlmConfig = {
    baseUrl: patch.baseUrl ?? current.baseUrl,
    model: patch.model ?? current.model,
    apiKey: patch.apiKey ?? current.apiKey,
  };
  await query(
    `UPDATE admin_settings SET value = $1, updated_at = now() WHERE key = 'llm_config'`,
    [JSON.stringify(next)]
  );
  cache = { value: next, expiresAt: Date.now() + TTL_MS };
  return next;
}

/** Mask the API key for safe display in admin UIs: "sk-...abc". */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 3)}...${key.slice(-3)}`;
}
