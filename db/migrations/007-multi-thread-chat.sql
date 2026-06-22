-- ===========================================================================
-- 007-multi-thread-chat.sql
-- Multi-conversation chat: lifts the one-thread-per-user limit and adds
-- 45-day retention. The existing chat_threads / chat_messages tables already
-- support multiple threads per user; migration 002 only enforced the limit
-- at the application layer. This migration adds:
--   1. A composite index for "list my threads, most recent first".
--   2. An index on updated_at for global retention scans.
--   3. A purge function that deletes threads idle longer than a cutoff.
-- No data is migrated or lost. Existing single threads become the user's
-- most-recent thread in the new list.
-- ===========================================================================

BEGIN;

-- Composite index backs `WHERE user_id = $1 ORDER BY updated_at DESC LIMIT n`
-- used by GET /api/chat/threads.
CREATE INDEX IF NOT EXISTS idx_chat_threads_user_updated
  ON chat_threads(user_id, updated_at DESC);

-- Standalone updated_at index backs global purge scans (pg_cron or admin
-- endpoint), which are not scoped to a single user.
CREATE INDEX IF NOT EXISTS idx_chat_threads_updated_at
  ON chat_threads(updated_at);

-- purge_stale_chat_threads(cutoff)
-- Deletes every chat_threads row (and cascaded chat_messages) whose
-- updated_at is older than the supplied cutoff. Returns the row count.
-- Intended usage:
--   SELECT purge_stale_chat_threads(now() - interval '45 days');
CREATE OR REPLACE FUNCTION purge_stale_chat_threads(cutoff timestamptz)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM chat_threads WHERE updated_at < cutoff;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMIT;
