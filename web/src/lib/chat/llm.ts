import { getLlmConfig } from "./llmConfig";

// ─────────────────────────────────────────────────────────────────────────
// OpenAI-compatible chat completion call. Works with LM Studio, Ollama
// (/v1), OpenAI, and any other provider that speaks this shape.
// ─────────────────────────────────────────────────────────────────────────

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

// Messages support tool calls (assistant) and tool results (tool role).
export type ChatMsg =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

/** Simple call with no tools — returns a text answer or an error. */
export type ChatCompletionResult =
  | { ok: true; answer: string }
  | { ok: false; error: string; status: number };

/** Call that may include tools — returns either a text answer or tool calls. */
export type ToolCompletionResult =
  | { ok: true; answer: string; toolCalls: null }
  | { ok: true; answer: string; toolCalls: ToolCall[] }
  | { ok: false; error: string; status: number };

async function rawCall(
  messages: ChatMsg[],
  body: Record<string, unknown>
): Promise<{ ok: true; data: any } | { ok: false; error: string; status: number }> {
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
      body: JSON.stringify({ model: cfg.model, messages, ...body }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: `LLM ${res.status}: ${text.slice(0, 200)}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "LLM request failed" };
  }
}

/** Simple completion with no tools. */
export async function callLlm(
  messages: ChatMsg[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<ChatCompletionResult> {
  const result = await rawCall(messages, {
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 4096,
  });
  if (!result.ok) return result;
  const answer = result.data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!answer) return { ok: false, status: 200, error: "LLM returned empty answer" };
  return { ok: true, answer };
}

/** Completion that may trigger tool calls. The caller executes the tools
 *  and follows up with another call containing the tool results. */
export async function callLlmWithTools(
  messages: ChatMsg[],
  tools: ToolDefinition[],
  opts: { temperature?: number; maxTokens?: number; toolChoice?: "auto" | "required" } = {}
): Promise<ToolCompletionResult> {
  const body: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 4096,
    tools,
    tool_choice: opts.toolChoice ?? "auto",
  };
  const result = await rawCall(messages, body);
  if (!result.ok) return result;

  const message = result.data.choices?.[0]?.message;
  const answer = message?.content?.trim() ?? "";
  const toolCalls: ToolCall[] | undefined = message?.tool_calls;

  if (toolCalls && toolCalls.length > 0) {
    return { ok: true, answer, toolCalls };
  }
  if (!answer) return { ok: false, status: 200, error: "LLM returned empty answer" };
  return { ok: true, answer, toolCalls: null };
}

/** Used by /api/chat/health: tiny probe that does NOT consume tokens. */
export async function pingLlm(): Promise<{ ok: boolean; model?: string; error?: string }> {
  const cfg = await getLlmConfig();
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/models`;
  try {
    const res = await fetch(url, {
      headers:
        cfg.apiKey && cfg.apiKey !== "not-needed"
          ? { authorization: `Bearer ${cfg.apiKey}` }
          : {},
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    await res.text();
    return { ok: true, model: cfg.model };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unreachable" };
  }
}
