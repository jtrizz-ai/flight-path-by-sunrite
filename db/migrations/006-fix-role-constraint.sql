-- ===========================================================================
-- 006-fix-role-constraint.sql
-- The original schema had a CHECK constraint allowing only lowercase
-- 'member'/'admin'. The app uses capitalized role names (Admin, Manager,
-- Team Lead, Sales, Field Marketer). This fixes the constraint + migrates
-- any existing lowercase values.
-- ===========================================================================

BEGIN;

-- Migrate any existing lowercase roles to the capitalized form
UPDATE app_users SET role = 'Admin' WHERE lower(role) = 'admin';
UPDATE app_users SET role = 'Field Marketer' WHERE lower(role) = 'member';

-- Replace the constraint
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('Admin', 'Manager', 'Team Lead', 'Sales', 'Field Marketer'));

-- Fix the default (was 'member', now 'Field Marketer')
ALTER TABLE app_users ALTER COLUMN role SET DEFAULT 'Field Marketer';

COMMIT;
