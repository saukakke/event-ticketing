ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3), ADD COLUMN "suspensionReason" TEXT, ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "User_role_suspendedAt_idx" ON "User"("role", "suspendedAt");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
