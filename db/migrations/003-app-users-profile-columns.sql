-- ===========================================================================
-- 003-app-users-profile-columns.sql
-- Adds phone, town, status columns to app_users.
-- The code (types.ts AppUser, gate.ts, /api/me, /api/profile) expects these
-- but 002-chat-and-profile.sql only added hire_date. This completes it.
-- ===========================================================================

BEGIN;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS town TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused'));

-- Backfill any pre-existing rows
UPDATE app_users SET status = 'active' WHERE status IS NULL;

COMMIT;
