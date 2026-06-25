-- 008-journal-entries.sql
-- Daily Journal feature: one entry per user per day with three structured sections.

CREATE TABLE IF NOT EXISTS journal_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  title       TEXT,
  wins        TEXT NOT NULL DEFAULT '',
  challenges  TEXT NOT NULL DEFAULT '',
  tomorrows_focus TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date
  ON journal_entries (user_id, entry_date DESC);
