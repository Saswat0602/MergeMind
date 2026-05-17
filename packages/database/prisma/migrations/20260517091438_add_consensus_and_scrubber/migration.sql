-- AlterTable
ALTER TABLE "AiSettings" ADD COLUMN     "isConsensusEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AiUsageLog" ADD COLUMN     "actionDescription" TEXT;
