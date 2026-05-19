-- DropForeignKey
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_installationId_fkey";

-- AlterTable
ALTER TABLE "GitHubInstallation" ALTER COLUMN "githubId" SET DATA TYPE BIGINT,
ALTER COLUMN "targetId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "githubId" SET DATA TYPE BIGINT,
ALTER COLUMN "installationId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "PullRequest" ALTER COLUMN "githubId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Repository" ALTER COLUMN "githubId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "ReviewComment" ADD COLUMN     "isApplied" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "githubId" SET DATA TYPE BIGINT;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "GitHubInstallation"("githubId") ON DELETE SET NULL ON UPDATE CASCADE;
