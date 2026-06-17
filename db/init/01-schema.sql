-- ===========================================================================
-- Flight Path — PostgreSQL schema (replaces Supabase)
-- ===========================================================================
-- This file runs AUTOMATICALLY the first time the Postgres container starts
-- (it is mounted into /docker-entrypoint-initdb.d by docker-compose.yml).
-- It will NOT run again on later starts. To re-run it, wipe the volume:
--     docker compose down -v && docker compose up -d
--
-- Design notes:
--   * No Supabase-specific features (no auth.users, no RLS, no service_role).
--     Row-level security is enforced by the BACKEND code instead, since the
--     backend is the only thing that talks to the database.
--   * Tables follow the CLAUDE.md spec (sections 8, 9, 10) plus the content
--     tables the existing worker/website already use.
--   * All passwords/secrets live in code/env, never here.
-- ===========================================================================

-- Handy extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- fast keyword search for chat

-- ===========================================================================
-- AUTH + ACCESS CONTROL (spec section 8)
-- ===========================================================================

-- People who can sign in. The "role" column decides admin vs normal member.
CREATE TABLE IF NOT EXISTS app_users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email        TEXT UNIQUE NOT NULL,
    full_name    TEXT,
    avatar_url   TEXT,
    role         TEXT NOT NULL DEFAULT 'member'
                 CHECK (role IN ('member', 'admin')),
    -- Optional, only used if we switch to password login. Stays NULL otherwise.
    password_hash TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company email domains that are allowed to sign in at all.
-- Managed in the admin portal. NEVER hard-coded in app code.
CREATE TABLE IF NOT EXISTS allowed_domains (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain     TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specific invited email addresses (used when INVITE_REQUIRED is on).
CREATE TABLE IF NOT EXISTS invites (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email      TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'revoked')),
    invited_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (email)
);

-- One-time login links for the magic-link sign-in flow.
-- A row is created when someone asks for a login link, then marked used.
CREATE TABLE IF NOT EXISTS login_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,          -- email the link was sent to
    token_hash  TEXT NOT NULL,          -- SHA-256 of the secret token (never the raw token)
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Server-side sessions (staying-logged-in). The backend sets a session
-- cookie whose value matches a row here.
CREATE TABLE IF NOT EXISTS sessions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_user_id  UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL,         -- SHA-256 of the cookie value
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Global settings that used to be "admin_settings". Kept under that name so
-- the existing worker/website code keeps working.
CREATE TABLE IF NOT EXISTS admin_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================================================
-- CONTENT — the cached Notion site tree (spec sections 9, 10, 11)
-- ===========================================================================

-- One row per crawled Notion page. "is_hidden" implements the
-- "Hidden Pages" toggle rule (spec section 4).
CREATE TABLE IF NOT EXISTS notion_pages (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notion_page_id       TEXT UNIQUE NOT NULL,   -- Notion's own page id
    parent_page_id       TEXT,                   -- notion_page_id of the parent (nullable for top-level)
    child_ids            TEXT[] DEFAULT '{}',    -- notion_page_ids of children
    title                TEXT NOT NULL,
    slug                 TEXT UNIQUE NOT NULL,   -- URL-friendly identifier (de-duplicated)
    icon                 TEXT,
    cover                TEXT,
    url                  TEXT,
    tags                 TEXT[] DEFAULT '{}',    -- multi-select tags from Notion
    is_hidden            BOOLEAN NOT NULL DEFAULT FALSE,
    content              JSONB,                  -- full normalized Block[] body
    order_index          INTEGER,
    last_synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Snapshots of page content, kept for change tracking.
CREATE TABLE IF NOT EXISTS page_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id         UUID NOT NULL REFERENCES notion_pages(id) ON DELETE CASCADE,
    content         JSONB NOT NULL,
    version_number  INTEGER NOT NULL,
    change_summary  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Worker crawl history + admin "last sync" display.
CREATE TABLE IF NOT EXISTS crawl_logs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status           TEXT CHECK (status IN ('running', 'completed', 'failed')),
    pages_processed  INTEGER NOT NULL DEFAULT 0,
    pages_created    INTEGER NOT NULL DEFAULT 0,
    pages_updated    INTEGER NOT NULL DEFAULT 0,
    error_message    TEXT,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);

-- Lightweight summary used for "last sync" badges (spec section 8: sync_meta).
CREATE TABLE IF NOT EXISTS sync_meta (
    id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- single row
    last_sync  TIMESTAMPTZ,
    page_count INTEGER NOT NULL DEFAULT 0
);

-- ===========================================================================
-- INDEXES
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_notion_pages_parent   ON notion_pages(parent_page_id);
CREATE INDEX IF NOT EXISTS idx_notion_pages_slug     ON notion_pages(slug);
CREATE INDEX IF NOT EXISTS idx_notion_pages_hidden   ON notion_pages(is_hidden);
CREATE INDEX IF NOT EXISTS idx_notion_pages_search   ON notion_pages USING gin(to_tsvector('english', coalesce(title,'')));
CREATE INDEX IF NOT EXISTS idx_page_versions_page    ON page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_status     ON crawl_logs(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user         ON sessions(app_user_id);
CREATE INDEX IF NOT EXISTS idx_login_tokens_hash     ON login_tokens(token_hash);

-- ===========================================================================
-- TRIGGERS — keep updated_at fresh automatically
-- ===========================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notion_pages_updated_at ON notion_pages;
CREATE TRIGGER update_notion_pages_updated_at BEFORE UPDATE ON notion_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- SEED DATA (spec sections 7 & 8)
-- ===========================================================================

-- Default allowed company domain (editable / removable in the admin portal).
INSERT INTO allowed_domains (domain) VALUES ('sunritesolarllc.com')
ON CONFLICT (domain) DO NOTHING;

-- First admin (spec section 8: seed Jonathan as admin).
INSERT INTO app_users (email, full_name, role) VALUES
    ('jrizzo@sunritesolarllc.com', 'Jonathan Rizzo', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Invite the first admin too. invite_required defaults to ON, so even the
-- admin must appear in the invites table to get through the login gate.
-- (No chicken-and-egg: this row is seeded the same way the user is.)
INSERT INTO invites (email, status, invited_by) VALUES
    ('jrizzo@sunritesolarllc.com', 'accepted',
     (SELECT id FROM app_users WHERE lower(email) = 'jrizzo@sunritesolarllc.com'))
ON CONFLICT (email) DO NOTHING;

-- Default app settings used by the worker.
INSERT INTO admin_settings (key, value) VALUES
    ('crawl_config', '{"maxDepth": 5, "concurrentRequests": 3, "delayBetweenRequests": 1000, "enabled": true}'::jsonb),
    ('site_config',  '{"siteName": "Flight Path", "siteDescription": "Flight Path Program content platform"}'::jsonb),
    ('auth_config',  '{"inviteRequired": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Empty sync_meta row so the admin panel always has something to show.
INSERT INTO sync_meta (id, last_sync, page_count) VALUES (1, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- PERMISSIONS
-- ===========================================================================
-- Only the database owner role connects (the "flightpath" user from .env).
-- No anonymous / service roles exist anymore.
GRANT USAGE ON SCHEMA public TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO public;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO public;
