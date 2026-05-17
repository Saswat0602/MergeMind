-- DropForeignKey
ALTER TABLE "ReviewResult" DROP CONSTRAINT "ReviewResult_pullRequestId_fkey";

-- AlterTable
ALTER TABLE "ReviewResult" ALTER COLUMN "pullRequestId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ReviewResult" ADD CONSTRAINT "ReviewResult_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
