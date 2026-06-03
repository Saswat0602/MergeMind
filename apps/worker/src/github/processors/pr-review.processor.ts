import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@mergemind/database';
import { GithubService } from '../services/github.service';
import { GithubCheckRunService } from '../services/github-check-run.service';
import { EventBroadcasterService } from '../services/event-broadcaster.service';
import { AiPipelineService } from '../../pipeline/ai-pipeline.service';

@Processor('pr-review', { concurrency: 3 })
export class PrReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(PrReviewProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly githubCheckRunService: GithubCheckRunService,
    private readonly eventBroadcaster: EventBroadcasterService,
    private readonly aiPipelineService: AiPipelineService,
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
      branchName,
    } = job.data;

    this.logger.log(
      isPushEvent
        ? `Processing branch push job ${job.id} for commits ${beforeSha}...${afterSha} in ${repositoryFullname}`
        : `Processing PR review job ${job.id} for PR #${prNumber} in ${repositoryFullname}`,
    );

    await this.prisma.analysisJob.update({
      where: { id: analysisJobId },
      data: { status: 'PROCESSING', step: 'FETCHING_DIFF' },
    });
    this.eventBroadcaster.broadcastJobUpdate(analysisJobId, 'PROCESSING', 'FETCHING_DIFF', undefined, pullRequestId);

    let installationId: bigint | number | undefined;
    let repositoryId: string | undefined;
    let reviewTitle: string = '';
    let checkRunId: number | undefined;

    try {
      const [owner, repoName] = repositoryFullname.split('/');

      if (isPushEvent) {
        const dbRepo = await this.prisma.repository.findFirst({
          where: { fullName: repositoryFullname },
          include: { organization: true },
        });
        if (!dbRepo || !dbRepo.organization.installationId) {
          throw new Error(
            `Repository or installation configuration not found for ${repositoryFullname}`,
          );
        }
        installationId = dbRepo.organization.installationId;
        repositoryId = dbRepo.id;
        reviewTitle = commitMessage || 'Branch Commit Push';
      } else {
        const pr = await this.prisma.pullRequest.findUnique({
          where: { id: pullRequestId },
          include: { repository: { include: { organization: true } } },
        });

        if (!pr)
          throw new Error(`PR record with ID ${pullRequestId} not found`);
        if (!pr.repository.organization.installationId) {
          throw new Error(
            `Installation ID not found for repository ${repositoryFullname}`,
          );
        }
        installationId = pr.repository.organization.installationId;
        repositoryId = pr.repositoryId;
        reviewTitle = pr.title;
      }

      try {
        checkRunId = await this.githubCheckRunService.createCheckRun(
          installationId!,
          owner,
          repoName,
          headSha || afterSha,
        );
      } catch (e: any) {
        this.logger.warn(`Failed to create GitHub Check Run: ${e.message}`);
      }

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
        this.logger.log(
          `No diff content found or diff is empty for ${repositoryFullname}`,
        );
        await this.prisma.analysisJob.update({
          where: { id: analysisJobId },
          data: { status: 'COMPLETED', step: 'COMPLETED' },
        });
        this.eventBroadcaster.broadcastJobUpdate(analysisJobId, 'COMPLETED', 'COMPLETED', undefined, pullRequestId);

        if (checkRunId) {
          await this.githubCheckRunService.completeCheckRun(
            installationId, owner, repoName, checkRunId, 'success', 'MergeMind Code Review', 'No diff content found or diff is empty.'
          ).catch((e: any) => this.logger.warn(`Failed to complete check run: ${e.message}`));
        }

        return { success: true, message: 'Empty diff' };
      }

      await this.prisma.analysisJob.update({
        where: { id: analysisJobId },
        data: { step: 'AI_ANALYSIS' },
      });
      this.eventBroadcaster.broadcastJobUpdate(analysisJobId, 'PROCESSING', 'AI_ANALYSIS', undefined, pullRequestId);

      const rules = await this.prisma.repositoryRule.findMany({
        where: { repositoryId: repositoryId, isEnabled: true },
      });

      // 🚀 Delegate to the Pipeline
      const pipelineResult = await this.aiPipelineService.analyzeAndPersist({
        pullRequestId,
        prTitle: reviewTitle,
        prDescription: '',
        diffContent: diff,
        actionDescription: isPushEvent
          ? `Push Commit Audit: "${commitMessage || 'No Message'}"`
          : `PR #${prNumber} Review Audit`,
        isPushEvent,
        headSha,
        commitMessage,
        branchName,
        repositoryId,
        analysisJobId,
        rules,
      });

      if (pipelineResult.empty) {
        await this.prisma.analysisJob.update({
          where: { id: analysisJobId },
          data: { status: 'COMPLETED', step: 'COMPLETED' },
        });
        this.eventBroadcaster.broadcastJobUpdate(analysisJobId, 'COMPLETED', 'COMPLETED', undefined, pullRequestId);

        if (checkRunId) {
          await this.githubCheckRunService.completeCheckRun(
            installationId, owner, repoName, checkRunId, 'success', 'MergeMind Code Review', 'Empty clean diff after pre-processing.'
          ).catch((e: any) => this.logger.warn(`Failed to complete check run: ${e.message}`));
        }

        return {
          success: true,
          message: 'Empty clean diff after pre-processing.',
        };
      }

      await this.prisma.analysisJob.update({
        where: { id: analysisJobId },
        data: { step: 'POSTING' },
      });
      this.eventBroadcaster.broadcastJobUpdate(analysisJobId, 'PROCESSING', 'POSTING', undefined, pullRequestId);

      // Retrieve the saved ReviewResult to post to GitHub
      const reviewResult = await this.prisma.reviewResult.findUnique({
        where: { id: pipelineResult.reviewResultId },
        include: { comments: true },
      });

      if (!reviewResult)
        throw new Error('Failed to retrieve persisted review result.');

      const highCount = reviewResult.comments.filter(
        (c: any) => c.severity === 'HIGH',
      ).length;
      const mediumCount = reviewResult.comments.filter(
        (c: any) => c.severity === 'MEDIUM',
      ).length;
      const lowCount = reviewResult.comments.filter(
        (c: any) => c.severity === 'LOW',
      ).length;

      // Post to GitHub
      if (isPushEvent) {
        if (reviewResult.comments.length > 0) {
          const githubComments = reviewResult.comments.map((c: any) => {
            let body = `###  MergeMind Commit Diagnostics\n**Type:** \`${c.type}\` | **Severity:** \`${c.severity}\`\n\n${c.content}`;
            if (c.suggestion)
              body += `\n\n\`\`\`suggestion\n${c.suggestion}\n\`\`\``;
            return { path: c.filePath, line: c.lineNumber, body };
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
          const githubComments = reviewResult.comments.map((c: any) => {
            let body = `### 🤖 MergeMind AI Suggestion\n**Type:** \`${c.type}\` | **Severity:** \`${c.severity}\`\n\n${c.content}`;
            if (c.suggestion)
              body += `\n\n\`\`\`suggestion\n${c.suggestion}\n\`\`\``;
            return { path: c.filePath, line: c.lineNumber, body };
          });

          const severityScore = reviewResult.severityScore ?? 0;
          const scoreEmoji =
            severityScore > 70 ? '🚨' : severityScore > 30 ? '⚠️' : '✅';
          const summaryMessage = `## 🤖 MergeMind Review Summary\n${scoreEmoji} **Review Severity Score:** ${severityScore}/100\n\n${reviewResult.summary}\n\n---\n*Detected ${highCount} High, ${mediumCount} Medium, and ${lowCount} Low issues in this PR. Check inline comments below for direct code suggestions!*`;
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
          const summaryMessage = `## 🤖 MergeMind Review Summary\n✅ **Review Severity Score:** 0/100\n\nMergeMind analyzed the diff and found no security vulnerabilities, performance bugs, or structural code smells. Outstanding work!`;
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

      await this.prisma.analysisJob.update({
        where: { id: analysisJobId },
        data: { status: 'COMPLETED', step: 'COMPLETED' },
      });
      this.eventBroadcaster.broadcastJobUpdate(analysisJobId, 'COMPLETED', 'COMPLETED', undefined, pullRequestId);

      if (checkRunId) {
        const severityScore = reviewResult.severityScore ?? 0;
        const conclusion = severityScore > 70 ? 'failure' : 'success';
        const summary = isPushEvent 
          ? `Analysis complete. Found ${highCount} High, ${mediumCount} Medium issues.` 
          : `Score: ${severityScore}/100. Found ${highCount} High, ${mediumCount} Medium issues.`;
          
        await this.githubCheckRunService.completeCheckRun(
          installationId, owner, repoName, checkRunId, conclusion, 'MergeMind Code Review', summary
        ).catch((e: any) => this.logger.warn(`Failed to complete check run: ${e.message}`));
      }

      this.logger.log(`Successfully completed analysis for job ${job.id}`);
      return { success: true, reviewResultId: reviewResult.id };
    } catch (error: any) {
      this.logger.error(`Job processing failed: ${error.message}`, error.stack);

      await this.prisma.analysisJob
        .update({
          where: { id: analysisJobId },
          data: { status: 'FAILED', error: error.message },
        })
        .catch((err) =>
          this.logger.error(`Failed to update job error state: ${err.message}`),
        );
      this.eventBroadcaster.broadcastJobUpdate(analysisJobId, 'FAILED', 'FAILED', error.message, pullRequestId);

      // We need to resolve installationId, owner, repoName from context if it failed later, 
      // but they might not be defined if it failed early.
      try {
        const [ownerName, repositoryName] = repositoryFullname.split('/');
        if (typeof checkRunId !== 'undefined' && installationId && ownerName && repositoryName) {
          await this.githubCheckRunService.completeCheckRun(
            installationId, ownerName, repositoryName, checkRunId, 'failure', 'MergeMind Code Review Failed', error.message
          );
        }
      } catch (e: any) {
        this.logger.warn(`Failed to complete error check run: ${e.message}`);
      }

      throw error;
    }
  }
}
