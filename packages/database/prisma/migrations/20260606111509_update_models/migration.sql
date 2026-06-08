-- AlterTable
ALTER TABLE "AiSettings" DROP COLUMN "fallbackModel",
DROP COLUMN "isFallbackEnabled",
DROP COLUMN "primaryModel",
ADD COLUMN     "model" TEXT;

