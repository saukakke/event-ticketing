DROP INDEX IF EXISTS "User_role_suspendedAt_idx";
DROP INDEX IF EXISTS "User_deletedAt_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "suspendedAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "suspensionReason";
ALTER TABLE "User" DROP COLUMN IF EXISTS "deletedAt";
