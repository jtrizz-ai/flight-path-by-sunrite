import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import type { ChatThread, ChatMessageRecord, ChatSource } from "@/lib/types";

// GET /api/chat/threads — returns the caller's single thread + all messages.
// Lazily creates the thread so the response shape is always consistent.
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let { rows: threadRows } = await query<{
    id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, title, created_at, updated_at FROM chat_threads WHERE user_id = $1 LIMIT 1`,
    [user.id]
  );
  if (threadRows.length === 0) {
    const { rows: inserted } = await query<{
      id: string;
      title: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO chat_threads (user_id)
        RETURNING id, title, created_at, updated_at`,
      [user.id]
    );
    threadRows = inserted;
  }
  const t = threadRows[0];

  const { rows: msgRows } = await query<{
    id: string;
    role: "user" | "assistant";
    content: string;
    sources: ChatSource[] | null;
    created_at: Date;
  }>(
    `SELECT id, role, content, sources, created_at
       FROM chat_messages
      WHERE thread_id = $1
      ORDER BY created_at ASC`,
    [t.id]
  );

  const messages: ChatMessageRecord[] = msgRows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    sources: m.sources,
    createdAt: m.created_at.toISOString(),
  }));

  const thread: ChatThread = {
    id: t.id,
    title: t.title,
    createdAt: t.created_at.toISOString(),
    updatedAt: t.updated_at.toISOString(),
    messages,
  };

  return NextResponse.json({ thread });
}
