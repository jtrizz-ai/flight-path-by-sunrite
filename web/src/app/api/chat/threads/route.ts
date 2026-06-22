import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import type { ChatThreadSummary } from "@/lib/types";

// GET /api/chat/threads — returns the caller's threads as summaries
// (most recently active first), without messages. Also lazily purges the
// caller's threads idle longer than 45 days so expired conversations
// never appear in the list, even without a scheduled cleanup job.
//
// Retention note: this user-scoped DELETE handles the common case. A
// global purge (covering users who never sign in again) can be added later
// via pg_cron calling purge_stale_chat_threads(now() - interval '45 days').

const RETENTION_DAYS = 45;
const PREVIEW_MAX = 140;

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  // 1. Lazy retention: delete this user's stale threads (CASCADE removes
  //    their messages). Skipped on any error — listing still proceeds.
  await query(
    `DELETE FROM chat_threads
      WHERE user_id = $1
        AND updated_at < now() - ($2 || ' days')::interval`,
    [user.id, String(RETENTION_DAYS)]
  ).catch(() => {
    /* non-fatal: don't block the list on purge failure */
  });

  // 2. List the survivor threads, most recently active first. Pull the
  //    last user/assistant content in the same pass for the list preview.
  const { rows } = await query<{
    id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
    message_count: string;
    last_message_preview: string | null;
  }>(
    `WITH counts AS (
        SELECT thread_id, count(*)::int AS msg_count
          FROM chat_messages
         GROUP BY thread_id
     )
     SELECT t.id,
            t.title,
            t.created_at,
            t.updated_at,
            COALESCE(c.msg_count, 0)::text AS message_count,
            (SELECT left(content, $2)
               FROM chat_messages
              WHERE thread_id = t.id
              ORDER BY created_at DESC
              LIMIT 1) AS last_message_preview
       FROM chat_threads t
  LEFT JOIN counts c ON c.thread_id = t.id
      WHERE t.user_id = $1
      ORDER BY t.updated_at DESC`,
    [user.id, PREVIEW_MAX]
  );

  const threads: ChatThreadSummary[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
    messageCount: parseInt(r.message_count, 10) || 0,
    lastMessagePreview: r.last_message_preview,
  }));

  return NextResponse.json({ threads });
}
