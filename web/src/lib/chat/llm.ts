import { getLlmConfig } from "./llmConfig";

// ─────────────────────────────────────────────────────────────────────────
// OpenAI-compatible chat completion call. Works with LM Studio, Ollama
// (/v1), OpenAI, and any other provider that speaks this shape.
// ─────────────────────────────────────────────────────────────────────────

type Msg = { role: "system" | "user" | "assistant"; content: string };

export type ChatCompletionResult =
  | { ok: true; answer: string }
  | { ok: false; error: string; status: number };

export async function callLlm(
  messages: Msg[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<ChatCompletionResult> {
  const cfg = await getLlmConfig();
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cfg.apiKey && cfg.apiKey !== "not-needed"
          ? { authorization: `Bearer ${cfg.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 4096,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        error: `LLM ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!answer) {
      return { ok: false, status: 200, error: "LLM returned empty answer" };
    }
    return { ok: true, answer };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "LLM request failed",
    };
  }
}

/** Used by /api/chat/health: tiny probe that does NOT consume tokens. */
export async function pingLlm(): Promise<{
  ok: boolean;
  model?: string;
  error?: string;
}> {
  const cfg = await getLlmConfig();
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/models`;
  try {
    const res = await fetch(url, {
      headers:
        cfg.apiKey && cfg.apiKey !== "not-needed"
          ? { authorization: `Bearer ${cfg.apiKey}` }
          : {},
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    // Drain the body so the connection closes cleanly; we only need the
    // status code to confirm reachability.
    await res.text();
    return { ok: true, model: cfg.model };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unreachable" };
  }
}
