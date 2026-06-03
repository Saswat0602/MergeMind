import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mergemind/database';
import { AiReviewResponse } from '../ai-models';

@Injectable()
export class ReviewPersisterAgent {
  constructor(private readonly prisma: PrismaService) {}

  async persist(params: {
    response: AiReviewResponse;
    context: any;
    usage: {
      promptTokens: number;
      completionTokens: number;
      latencyMs: number;
      modelUsed: string;
      logIds: string[];
    };
  }) {
    const { response, context, usage } = params;
    const {
      pullRequestId,
      headSha,
      commitMessage,
      branchName,
      repositoryId,
      actionDescription,
    } = context;

    // First, save the usage logs
    // Cost estimation: $0.15/1M prompt, $0.60/1M completion tokens
    const cost =
      (usage.promptTokens * 0.15 + usage.completionTokens * 0.6) / 1000000;

    let logIds = usage.logIds;
    if (logIds.length === 0) {
      const log = await this.prisma.aiUsageLog.create({
        data: {
          modelName: usage.modelUsed,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.promptTokens + usage.completionTokens,
          latencyMs: usage.latencyMs,
          cost,
          actionDescription,
        },
      });
      logIds = [log.id];
    }

    const commentsArray = response.comments || [];
    const severityScoreValue =
      typeof response.severityScore === 'number' ? response.severityScore : 0;
    const summaryValue = response.summary || 'No summary provided by AI.';

    const reviewResult = await this.prisma.reviewResult.create({
      data: {
        pullRequestId,
        commitSha: headSha,
        commitMessage: commitMessage || 'AI Code Diagnostics',
        gitDiff: context.diffContent,
        branchName: branchName || 'main',
        summary: summaryValue,
        severityScore: severityScoreValue,
        status: 'COMPLETED',
        comments: {
          create: commentsArray.map((c) => ({
            filePath: c.filePath || 'unknown',
            lineNumber: typeof c.lineNumber === 'number' ? c.lineNumber : 1,
            content: c.content || 'Constructive review suggestion.',
            severity: c.severity || 'LOW',
            type: c.type || 'STYLE',
            suggestion: c.suggestion || null,
          })),
        },
        usageLogs: {
          connect: logIds.map((id) => ({ id })),
        },
      },
      include: {
        comments: true,
      },
    });

    const highCount = commentsArray.filter((c) => c.severity === 'HIGH').length;
    const mediumCount = commentsArray.filter(
      (c) => c.severity === 'MEDIUM',
    ).length;
    const lowCount = commentsArray.filter((c) => c.severity === 'LOW').length;

    await this.prisma.reviewMetric.create({
      data: {
        repositoryId,
        highSeverity: highCount,
        mediumSeverity: mediumCount,
        lowSeverity: lowCount,
        totalTokens: usage.promptTokens + usage.completionTokens,
      },
    });

    return reviewResult.id;
  }
}
