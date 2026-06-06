/*
  Warnings:

  - You are about to drop the column `defaultModel` on the `AiSettings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('OPENROUTER', 'OPENAI', 'ANTHROPIC', 'XAI', 'OLLAMA', 'BEDROCK');

-- AlterTable
ALTER TABLE "AiSettings" DROP COLUMN "defaultModel",
ADD COLUMN     "anthropicKey" TEXT,
ADD COLUMN     "awsAccessKeyId" TEXT,
ADD COLUMN     "awsRegion" TEXT,
ADD COLUMN     "awsSecretAccessKey" TEXT,
ADD COLUMN     "baseUrl" TEXT,
ADD COLUMN     "costPer1mCompletion" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "costPer1mPrompt" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "isFreeApi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openaiKey" TEXT,
ADD COLUMN     "primaryModel" TEXT,
ADD COLUMN     "provider" "AiProvider" NOT NULL DEFAULT 'OPENROUTER',
ADD COLUMN     "xaiKey" TEXT,
ALTER COLUMN "fallbackModel" DROP NOT NULL,
ALTER COLUMN "fallbackModel" DROP DEFAULT,
ALTER COLUMN "systemPrompt" SET DEFAULT 'You are an elite, highly specialized Principal Engineer and Security Auditor. Your primary objective is to review Pull Request diffs with extreme rigor.

Focus your analysis on the following critical dimensions:
1. Security Vulnerabilities (OWASP Top 10)
2. Performance Bottlenecks
3. Architecture & Concurrency
4. Code Quality & Reliability

Guidelines for your review:
- Be ruthless but constructive. Do not sugarcoat issues.
- Provide Actionable Code.
- Zero Fluff. Skip pleasantries. Do not compliment the code.
- Context Awareness. Only comment on lines that were actually changed in the diff.';
