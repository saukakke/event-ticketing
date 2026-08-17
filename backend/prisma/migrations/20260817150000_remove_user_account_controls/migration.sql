-- User suspension and soft-delete fields are no longer part of the application.
-- This migration removes the columns and indexes introduced by
-- 20260817140000_add_user_account_controls.
DROP INDEX IF EXISTS "User_role_suspendedAt_idx";
DROP INDEX IF EXISTS "User_deletedAt_idx";
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "suspendedAt",
  DROP COLUMN IF EXISTS "suspensionReason",
  DROP COLUMN IF EXISTS "deletedAt";
