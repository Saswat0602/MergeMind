-- AlterTable
ALTER TABLE "ReviewResult" ADD COLUMN     "branchName" TEXT,
ADD COLUMN     "commitMessage" TEXT,
ADD COLUMN     "gitDiff" TEXT;

-- CreateTable
CREATE TABLE "GitHubSettings" (
    "id" TEXT NOT NULL,
    "appId" TEXT,
    "privateKey" TEXT,
    "webhookSecret" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubSettings_pkey" PRIMARY KEY ("id")
);
