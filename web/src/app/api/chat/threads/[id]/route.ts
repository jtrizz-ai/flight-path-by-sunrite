import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import type { ChatThread, ChatMessageRecord, ChatSource } from "@/lib/types";

// GET  /api/chat/threads/[id] — one thread + all its messages.
// DELETE /api/chat/threads/[id] — delete the thread (CASCADE removes msgs).
//
// Both routes require the thread to belong to the caller. A thread that
// doesn't exist or isn't owned returns 404 (we never leak existence).

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const { id: threadId } = await params;

  const { rows: threadRows } = await query<{
    id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, title, created_at, updated_at
       FROM chat_threads
      WHERE id = $1 AND user_id = $2`,
    [threadId, user.id]
  );
  if (threadRows.length === 0) {
    return NextResponse.json({ error: "thread not found" }, { status: 404 });
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const { id: threadId } = await params;

  const { rows } = await query<{ id: string }>(
    `DELETE FROM chat_threads
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
    [threadId, user.id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "thread not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
