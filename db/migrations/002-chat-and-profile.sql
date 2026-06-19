-- ===========================================================================
-- 002-chat-and-profile.sql
-- Implements: docs/superpowers/specs/2026-06-18-chat-and-profile-backend-design.md
-- Sections 5 (DB changes) and 7 (chat retrieval schema).
-- ===========================================================================

BEGIN;

-- ── Section 5: hire_date on app_users ───────────────────────────────────
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS hire_date DATE;

-- ── Section 7: searchable text + tsvector on notion_pages ───────────────
-- The existing idx_notion_pages_search covers title only; chat retrieval
-- needs full-body search. search_text is populated by node-worker on crawl.
ALTER TABLE notion_pages
  ADD COLUMN IF NOT EXISTS search_text TEXT;

ALTER TABLE notion_pages
  DROP COLUMN IF EXISTS search_vector;
ALTER TABLE notion_pages
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(search_text,''))
  ) STORED;

DROP INDEX IF EXISTS idx_notion_pages_search_vector;
CREATE INDEX idx_notion_pages_search_vector
  ON notion_pages USING gin(search_vector);

-- ── Section 5: chat history tables ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_threads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Conversation',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_threads_user
  ON chat_threads(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id   UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  sources     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread
  ON chat_messages(thread_id, created_at);

-- Keep thread.updated_at fresh when messages are added.
CREATE OR REPLACE FUNCTION touch_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_threads SET updated_at = now() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_messages_thread ON chat_messages;
CREATE TRIGGER update_chat_messages_thread
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION touch_thread_updated_at();

-- ── Section 5: seed llm_config (only if not already present) ────────────
INSERT INTO admin_settings (key, value)
VALUES (
  'llm_config',
  jsonb_build_object(
    'baseUrl', 'http://100.101.18.67:1234/v1',
    'model',   'local-model',
    'apiKey',  'not-needed'
  )
)
ON CONFLICT (key) DO NOTHING;

COMMIT;
