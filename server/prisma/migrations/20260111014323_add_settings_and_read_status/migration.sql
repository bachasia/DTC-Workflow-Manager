-- AlterTable
ALTER TABLE "LarkNotification" ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "settings" JSONB;

-- CreateIndex
CREATE INDEX "LarkNotification_read_idx" ON "LarkNotification"("read");
