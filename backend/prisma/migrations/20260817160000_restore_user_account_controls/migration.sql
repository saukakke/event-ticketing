-- Restore user suspension and soft-delete controls after the rollback migration.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_role_suspendedAt_idx" ON "User"("role", "suspendedAt");
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");
