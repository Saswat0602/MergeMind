-- CreateTable
CREATE TABLE "AiSettings" (
    "id" TEXT NOT NULL,
    "openRouterKey" TEXT,
    "defaultModel" TEXT NOT NULL DEFAULT 'deepseek/deepseek-v4-flash:free',
    "fallbackModel" TEXT NOT NULL DEFAULT 'arcee-ai/trinity-large-thinking:free',
    "isFallbackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSettings_pkey" PRIMARY KEY ("id")
);
