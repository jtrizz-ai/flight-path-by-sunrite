import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import { retrievePages, toSources } from "@/lib/chat/retrieve";
import { buildMessages } from "@/lib/chat/prompt";
import { callLlm } from "@/lib/chat/llm";
import type { ChatSource } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// POST /api/chat
//
// Body: { message: string }
//
// Flow (spec section 6):
//   1. Append the user message to the caller's thread.
//   2. Retrieve top-4 visible pages matching the message.
//   3. Build the system prompt + context; call the LLM.
//   4. Append the assistant message with cited sources.
//   5. Return { answer, sources }.
//
// 503 if the LLM is unreachable — never fake an answer.
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length === 0) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "message too long (max 4000)" }, { status: 400 });
  }

  // Get or create the user's thread.
  let { rows: tRows } = await query<{ id: string }>(
    `SELECT id FROM chat_threads WHERE user_id = $1 LIMIT 1`,
    [user.id]
  );
  if (tRows.length === 0) {
    const { rows: ins } = await query<{ id: string }>(
      `INSERT INTO chat_threads (user_id) VALUES ($1) RETURNING id`,
      [user.id]
    );
    tRows = ins;
  }
  const threadId = tRows[0].id;

  // 1. Persist the user message.
  await query(
    `INSERT INTO chat_messages (thread_id, role, content) VALUES ($1, 'user', $2)`,
    [threadId, message]
  );

  // 2. Retrieve.
  const pages = await retrievePages(message, 4);
  const sources: ChatSource[] = toSources(pages);

  // 3. Build prompt + call LLM.
  const messages = buildMessages(message, pages);
  const result = await callLlm(messages);
  if (!result.ok) {
    return NextResponse.json(
      { error: "LLM unavailable", detail: result.error },
      { status: 503 }
    );
  }

  // 4. Persist the assistant message with sources.
  await query(
    `INSERT INTO chat_messages (thread_id, role, content, sources)
     VALUES ($1, 'assistant', $2, $3)`,
    [threadId, result.answer, JSON.stringify(sources)]
  );

  return NextResponse.json({ answer: result.answer, sources });
}
