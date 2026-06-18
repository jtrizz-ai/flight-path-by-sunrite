-- ===========================================================================
-- Migration 001: Extend User Management for Phase 1 & 2 (FIXED)
-- ===========================================================================
-- Adds:
--   - 5 new roles: Admin, Manager, Team Lead, Sales, Field Marketer
--   - status field: active/paused (controls login access)
--   - phone & town fields: user profile data (Phase 2)
-- ===========================================================================

BEGIN;

-- Step 1: Add status field (default 'active' for all existing users)
ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused'));

-- Step 2: Add profile fields for Phase 2
ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS town TEXT;

-- Step 3: Drop the old role constraint
ALTER TABLE app_users
    DROP CONSTRAINT IF EXISTS app_users_role_check;

-- Step 4: Migrate existing role values to new casing BEFORE adding new constraint
--   'admin' → 'Admin'
--   'member' → 'Field Marketer' (default role for non-admins)
UPDATE app_users
SET role = CASE
    WHEN lower(role) = 'admin' THEN 'Admin'
    WHEN lower(role) = 'member' THEN 'Field Marketer'
    ELSE 'Field Marketer'  -- fallback for any other values
END
WHERE role NOT IN ('Admin', 'Manager', 'Team Lead', 'Sales', 'Field Marketer');

-- Step 5: Add the new role constraint with 5 roles
ALTER TABLE app_users
    ADD CONSTRAINT app_users_role_check
    CHECK (role IN ('Admin', 'Manager', 'Team Lead', 'Sales', 'Field Marketer'));

-- Step 6: Add index on status for efficient auth gate queries
CREATE INDEX IF NOT EXISTS idx_app_users_status ON app_users(status);

-- Step 7: Add index on role for future role-based permissions
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);

COMMIT;

-- ===========================================================================
-- Verification (run manually after migration to check results)
-- ===========================================================================
-- SELECT email, role, status, phone, town, created_at FROM app_users ORDER BY created_at;
