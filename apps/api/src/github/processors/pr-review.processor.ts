import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@mergemind/database';
import { GithubService } from '../services/github.service';
import { AiService } from '../services/ai.service';

@Processor('pr-review')
export class PrReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(PrReviewProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { 
      pullRequestId, 
      analysisJobId, 
      repositoryFullname, 
      prNumber, 
      headSha,
      isPushEvent,
      beforeSha,
      afterSha,
      commitMessage,
    } = job.data;
    
    this.logger.log(
      isPushEvent 
        ? `Processing branch push job ${job.id} for commits ${beforeSha}...${afterSha} in ${repositoryFullname}`
        : `Processing PR review job ${job.id} for PR #${prNumber} in ${repositoryFullname}`
    );

    // Update job status in database to PROCESSING
    await this.prisma.analysisJob.update({
      where: { id: analysisJobId },
      data: {
        status: 'PROCESSING',
        step: 'FETCHING_DIFF',
      },
    });

    try {
      const [owner, repoName] = repositoryFullname.split('/');
      let installationId: number;
      let repositoryId: string;
      let reviewTitle: string;

      // 1. Retrieve installation configuration details based on event type
      if (isPushEvent) {
        const dbRepo = await this.prisma.repository.findFirst({
          where: { fullName: repositoryFullname },
          include: { organization: true },
        });
        if (!dbRepo || !dbRepo.organization.installationId) {
          throw new Error(`Repository or installation configuration not found for ${repositoryFullname}`);
        }
        installationId = dbRepo.organization.installationId;
        repositoryId = dbRepo.id;
        reviewTitle = commitMessage || 'Branch Commit Push';
      } else {
        const pr = await this.prisma.pullRequest.findUnique({
          where: { id: pullRequestId },
          include: {
            repository: {
              include: {
                organization: true,
              },
            },
          },
        });

        if (!pr) {
          throw new Error(`PR record with ID ${pullRequestId} not found`);
        }
        if (!pr.repository.organization.installationId) {
          throw new Error(`Installation ID not found for repository ${repositoryFullname}`);
        }
        installationId = pr.repository.organization.installationId;
        repositoryId = pr.repositoryId;
        reviewTitle = pr.title;
      }

      // 2. Fetch Diff from GitHub depending on context
      let diff: string;
      if (isPushEvent) {
        diff = await this.githubService.getCompareDiff(
          installationId,
          owner,
          repoName,
          beforeSha,
          afterSha,
        );
      } else {
        diff = await this.githubService.getPullRequestDiff(
          installationId,
          owner,
          repoName,
          prNumber,
        );
      }

      if (!diff || diff.trim().length === 0) {
        this.logger.log(`No diff content found or diff is empty for ${repositoryFullname}`);
        await this.prisma.analysisJob.update({
          where: { id: analysisJobId },
          data: { status: 'COMPLETED', step: 'COMPLETED' },
        });
        return { success: true, message: 'Empty diff' };
      }

      // 3. Update job step to AI_ANALYSIS
      await this.prisma.analysisJob.update({
        where: { id: analysisJobId },
        data: { step: 'AI_ANALYSIS' },
      });

      // 4. Run AI Analysis via OpenRouter
      const { response: aiResult, promptTokens, completionTokens, latencyMs, modelUsed } = 
        await this.aiService.analyzeDiff(reviewTitle, '', diff);

      // Calculate cost
      const cost = (promptTokens * 0.15 + completionTokens * 0.60) / 1000000;

      // 5. Update job step to POSTING
      await this.prisma.analysisJob.update({
        where: { id: analysisJobId },
        data: { step: 'POSTING' },
      });

      // 6. Save ReviewResult and Comments to Database
      const reviewResult = await this.prisma.reviewResult.create({
        data: {
          pullRequestId: isPushEvent ? null : pullRequestId,
          commitSha: headSha,
          summary: aiResult.summary,
          severityScore: aiResult.severityScore,
          status: 'COMPLETED',
          comments: {
            create: aiResult.comments.map(c => ({
              filePath: c.filePath,
              lineNumber: c.lineNumber,
              content: c.content,
              severity: c.severity,
              type: c.type,
              suggestion: c.suggestion || null,
            })),
          },
          usageLogs: {
            create: {
              modelName: modelUsed,
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
              latencyMs,
              cost,
            },
          },
        },
        include: {
          comments: true,
        },
      });

      // Update aggregate metrics for this repository
      const highCount = aiResult.comments.filter(c => c.severity === 'HIGH').length;
      const mediumCount = aiResult.comments.filter(c => c.severity === 'MEDIUM').length;
      const lowCount = aiResult.comments.filter(c => c.severity === 'LOW').length;

      await this.prisma.reviewMetric.create({
        data: {
          repositoryId: repositoryId,
          highSeverity: highCount,
          mediumSeverity: mediumCount,
          lowSeverity: lowCount,
          totalTokens: promptTokens + completionTokens,
        },
      });

      // 7. Post Comments back to GitHub
      if (isPushEvent) {
        if (reviewResult.comments.length > 0) {
          const githubComments = reviewResult.comments.map(c => {
            let body = `### 🤖 MergeMind Commit Diagnostics
**Type:** \`${c.type}\` | **Severity:** \`${c.severity}\`

${c.content}`;

            if (c.suggestion) {
              body += `\n\n\`\`\`suggestion\n${c.suggestion}\n\`\`\``;
            }
            return {
              path: c.filePath,
              line: c.lineNumber,
              body,
            };
          });

          await this.githubService.postCommitComments(
            installationId,
            owner,
            repoName,
            headSha,
            githubComments,
          );
        }
      } else {
        if (reviewResult.comments.length > 0) {
          const githubComments = reviewResult.comments.map(c => {
            let body = `### 🤖 MergeMind AI Suggestion
**Type:** \`${c.type}\` | **Severity:** \`${c.severity}\`

${c.content}`;

            if (c.suggestion) {
              body += `\n\n\`\`\`suggestion\n${c.suggestion}\n\`\`\``;
            }
            return {
              path: c.filePath,
              line: c.lineNumber,
              body,
            };
          });

          // Format overall review summary message
          const scoreEmoji = aiResult.severityScore > 70 ? '🚨' : aiResult.severityScore > 30 ? '⚠️' : '✅';
          const summaryMessage = `## 🤖 MergeMind Review Summary
${scoreEmoji} **Review Severity Score:** ${aiResult.severityScore}/100

${aiResult.summary}

---
*Detected ${highCount} High, ${mediumCount} Medium, and ${lowCount} Low issues in this PR. Check inline comments below for direct code suggestions!*`;

          await this.githubService.postPullRequestReview(
            installationId,
            owner,
            repoName,
            prNumber,
            headSha,
            summaryMessage,
            githubComments,
          );
        } else {
          const summaryMessage = `## 🤖 MergeMind Review Summary
✅ **Review Severity Score:** 0/100

MergeMind analyzed the diff and found no security vulnerabilities, performance bugs, or structural code smells. Outstanding work!`;

          await this.githubService.postPullRequestReview(
            installationId,
            owner,
            repoName,
            prNumber,
            headSha,
            summaryMessage,
            [],
          );
        }
      }

      // 8. Mark Job as Completed
      await this.prisma.analysisJob.update({
        where: { id: analysisJobId },
        data: {
          status: 'COMPLETED',
          step: 'COMPLETED',
        },
      });

      this.logger.log(`Successfully completed analysis for job ${job.id}`);
      return { success: true, reviewResultId: reviewResult.id };
    } catch (error) {
      this.logger.error(`Job processing failed: ${error.message}`, error.stack);
      
      // Update AnalysisJob to FAILED
      await this.prisma.analysisJob.update({
        where: { id: analysisJobId },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      }).catch(err => this.logger.error(`Failed to update job error state: ${err.message}`));

      throw error;
    }
  }
}
