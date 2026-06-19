-- ===========================================================================
-- 005-admin-portal-expansion.sql
-- Adds region/team, tally persistence, activity tracking, and badges.
-- ===========================================================================

BEGIN;

-- ── Region + Team on app_users (free-text) ──────────────────────────────
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS team TEXT;

-- ── Activity tracking columns on app_users ──────────────────────────────
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS app_open_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_app_open_at TIMESTAMPTZ;

-- ── Tally events: individual increments for flexible aggregation ────────
CREATE TABLE IF NOT EXISTS tally_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  metric      TEXT NOT NULL CHECK (metric IN ('doors', 'conversations', 'appointments')),
  amount      INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tally_events_user ON tally_events(user_id, created_at);

-- ── Page views: ordered click history per user ──────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,
  title       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_page_views_user ON page_views(user_id, created_at DESC);

-- ── Badge definitions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  is_quarterly  BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0
);

-- ── User-badge junction ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  quarter     INT CHECK (quarter BETWEEN 1 AND 4),
  year        INT,
  awarded_by  UUID REFERENCES app_users(id) ON DELETE SET NULL,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT,
  UNIQUE(user_id, badge_id, quarter, year)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- ── Seed badge definitions ──────────────────────────────────────────────
INSERT INTO badges (slug, name, description, is_quarterly, display_order) VALUES
  ('flight-path-graduate', 'Flight Path Graduate', 'Completed the Flight Path program', false, 1),
  ('high-flyer', 'High Flyer', 'Quarterly performance achievement', true, 2),
  ('altitude-club', 'Altitude Club', 'Quarterly performance milestone', true, 3),
  ('stratosphere-club', 'Stratosphere Club', 'Quarterly performance milestone', true, 4),
  ('top-rookie', 'Top Rookie', 'Top first-year performer of the quarter', true, 5),
  ('top-fm', 'Top FM', 'Top Field Marketer of the quarter', true, 6),
  ('top-sales', 'Top Sales Rep', 'Top Sales Representative of the quarter', true, 7)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
