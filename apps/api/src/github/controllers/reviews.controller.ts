import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  Logger,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GithubService } from '../services/github.service';
import { SseService } from '../services/sse.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ApplyFixDto } from '../dto/apply-fix.dto';
import { PullRequestRepository } from '../../repositories/pull-request.repository';
import { RepositoryRepository } from '../../repositories/repository.repository';
import { ReviewResultRepository } from '../../repositories/review-result.repository';
import { AiUsageLogRepository } from '../../repositories/ai-usage-log.repository';
import { RepositoryRuleRepository } from '../../repositories/repository-rule.repository';
import { JobRepository } from '../../repositories/job.repository';

@UseGuards(ApiKeyGuard)
@Controller('dashboard')
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name);

  constructor(
    private readonly githubService: GithubService,
    private readonly pullRequestRepo: PullRequestRepository,
    private readonly repositoryRepo: RepositoryRepository,
    private readonly reviewResultRepo: ReviewResultRepository,
    private readonly aiUsageLogRepo: AiUsageLogRepository,
    private readonly repositoryRuleRepo: RepositoryRuleRepository,
    private readonly jobRepo: JobRepository,
    private readonly sseService: SseService,
  ) {}

  @Sse('events')
  streamEvents(): Observable<MessageEvent> {
    return this.sseService.getJobEvents$().pipe(
      map((event) => ({
        data: event,
      })),
    );
  }

  @Get('stats')
  async getStats() {
    const totalPrs = await this.pullRequestRepo.countTotal();
    const activeRepositories = await this.repositoryRepo.countActive();
    const comments = await this.reviewResultRepo.countCommentsBySeverity();

    const highSeverityCount =
      comments.find((c) => c.severity === 'HIGH')?._count._all || 0;
    const mediumSeverityCount =
      comments.find((c) => c.severity === 'MEDIUM')?._count._all || 0;
    const lowSeverityCount =
      comments.find((c) => c.severity === 'LOW')?._count._all || 0;

    const usage = await this.aiUsageLogRepo.aggregateUsage();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyUsage =
      await this.aiUsageLogRepo.getDailyUsageSince(sevenDaysAgo);

    const dailyMap: { [date: string]: { tokens: number; cost: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap[dateStr] = { tokens: 0, cost: 0.0 };
    }

    for (const log of dailyUsage) {
      const dateStr = log.createdAt.toISOString().split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].tokens += log.totalTokens;
        dailyMap[dateStr].cost += log.cost || 0.0;
      }
    }

    const dailyTimeline = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      tokens: data.tokens,
      cost: parseFloat(data.cost.toFixed(4)),
    }));

    return {
      totalPrs,
      activeRepositories,
      highSeverityCount,
      mediumSeverityCount,
      lowSeverityCount,
      totalTokens: usage._sum.totalTokens || 0,
      totalCost: usage._sum.cost || 0.0,
      dailyTimeline,
    };
  }

  @Get('usage')
  async getUsage() {
    const logs = await this.aiUsageLogRepo.getUsageLogsWithDetails();
    const totalUsage = await this.aiUsageLogRepo.aggregateUsage();

    return {
      logs: logs.map((log) => ({
        id: log.id,
        modelName: log.modelName,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens: log.totalTokens,
        latencyMs: log.latencyMs,
        cost: log.cost || 0.0,
        createdAt: log.createdAt,
        actionDescription: log.actionDescription || 'Pull Request Review Audit',
        repositoryName:
          log.reviewResult?.pullRequest?.repository?.fullName ||
          (log.actionDescription?.includes('Handshake')
            ? 'System Connection'
            : 'N/A'),
        prTitle:
          log.reviewResult?.pullRequest?.title ||
          (log.actionDescription
            ? log.actionDescription
                .replace('Push Commit Audit: ', '')
                .replace(/"/g, '')
            : 'N/A'),
        prNumber: log.reviewResult?.pullRequest?.number || 0,
      })),
      summary: {
        totalTokens: totalUsage._sum.totalTokens || 0,
        promptTokens: totalUsage._sum.promptTokens || 0,
        completionTokens: totalUsage._sum.completionTokens || 0,
        totalCost: totalUsage._sum.cost || 0.0,
        averageLatencyMs: Math.round(totalUsage._avg.latencyMs || 0),
        totalRequests: totalUsage._count.id || 0,
      },
    };
  }

  @Get('prs')
  async getPRs(@Query('page') page = '1', @Query('limit') limit = '50') {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const prs = await this.pullRequestRepo.getPaginatedPRs(skip, limitNum);
    const total = await this.pullRequestRepo.countTotal();

    const formattedPrs = prs.map((pr) => {
      const latestReview = pr.reviews[0];
      const latestJob = pr.jobs[0];

      return {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        authorHandle: pr.authorHandle,
        htmlUrl: pr.htmlUrl,
        repositoryName: pr.repository.fullName,
        reviewStatus: latestReview?.status || latestJob?.status || 'PENDING',
        severityScore: latestReview?.severityScore ?? null,
        branchName: latestReview?.branchName || pr.headBranch || 'main',
        commitMessage: latestReview?.commitMessage || '',
        createdAt: pr.createdAt,
      };
    });

    return {
      prs: formattedPrs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('prs/:id')
  async getPRDetails(@Param('id') id: string) {
    const pr = await this.pullRequestRepo.getPRDetails(id);
    if (!pr) {
      throw new NotFoundException(`PR with ID ${id} not found`);
    }
    return pr;
  }

  @Post('commit/apply-fix')
  async applyFix(
    @Body()
    body: ApplyFixDto,
  ) {
    const fileExtension = body.filePath.split('.').pop()?.toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx'].includes(fileExtension || '')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ts = require('typescript') as {
          ScriptTarget: { Latest: number };
          createSourceFile: (
            fileName: string,
            sourceText: string,
            languageVersion: number,
            setParentNodes?: boolean,
          ) => {
            parseDiagnostics?: Array<{
              messageText: string | { messageText: string };
            }>;
          };
        };
        const sourceFile = ts.createSourceFile(
          body.filePath,
          body.suggestion,
          ts.ScriptTarget.Latest,
          true,
        );
        const diagnostics = sourceFile.parseDiagnostics || [];
        if (diagnostics.length > 0) {
          const firstError = diagnostics[0];
          const message =
            typeof firstError.messageText === 'string'
              ? firstError.messageText
              : firstError.messageText.messageText || 'Unknown syntax error';
          this.logger.warn(
            `Sandbox compilation warning for ${body.filePath}: ${message}`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `Failed to parse syntax for ${body.filePath}: ${(err as Error).message}`,
        );
      }
    } else if (fileExtension === 'json') {
      try {
        JSON.parse(body.suggestion);
      } catch (jsonErr) {
        throw new BadRequestException(
          `JSON syntax validation failed: ${(jsonErr as Error).message}`,
        );
      }
    }

    try {
      const result = await this.githubService.applyCommitPatch(
        body.pullRequestId,
        body.filePath,
        body.suggestion,
        body.startLine,
        body.endLine,
      );

      if (body.commentId) {
        await this.reviewResultRepo.setCommentApplied(body.commentId);
      }

      return result;
    } catch (err) {
      throw new BadRequestException(
        `Failed to apply suggested commit patch: ${(err as Error).message}`,
      );
    }
  }

  @Get('repositories')
  async getRepositories() {
    // Note: Live GitHub sync is removed from here for performance! (Phase 4 requirement)
    return this.repositoryRepo.getActiveRepositories();
  }

  @Get('repositories/:repoId/rules')
  async getRules(@Param('repoId') repoId: string) {
    const repository = await this.repositoryRepo.findRepoByIdOrName(repoId);

    if (!repository) {
      throw new NotFoundException(`Repository not found for: ${repoId}`);
    }

    let rules = await this.repositoryRuleRepo.findByRepo(repository.id);

    if (rules.length === 0) {
      const defaults = [
        {
          name: 'Strict Type Safety',
          description:
            'Audit TypeScript files to strictly prohibit raw "any" types or uncasted object references.',
          pattern: 'any',
          type: 'AI',
          isEnabled: true,
        },
        {
          name: 'Security Shield',
          description:
            'Prohibit hardcoded API credentials, private key files, database passwords, or auth tokens.',
          pattern: 'sk-|key-|token-|password',
          type: 'AI',
          isEnabled: true,
        },
        {
          name: 'Async Error Boundaries',
          description:
            'Ensure all asynchronous API operations, database queries, and async methods are enclosed in robust try-catch blocks.',
          pattern: 'async',
          type: 'AI',
          isEnabled: true,
        },
        {
          name: 'No Debug Logs in Production',
          description:
            'Avoid checkins of console.logs or temporary debug tracers in primary controller, router, or database files.',
          pattern: 'console.log',
          type: 'AI',
          isEnabled: false,
        },
      ];

      const createdRules: import('@prisma/client').RepositoryRule[] = [];
      for (const rule of defaults) {
        const newRule = await this.repositoryRuleRepo.create({
          repositoryId: repository.id,
          ...rule,
        });
        createdRules.push(newRule);
      }
      rules = createdRules;
    }

    return rules;
  }

  @Post('repositories/:repoId/rules')
  async createRule(
    @Param('repoId') repoId: string,
    @Body()
    body: {
      name: string;
      description: string;
      pattern?: string;
      type?: string;
      isEnabled?: boolean;
    },
  ) {
    const repository = await this.repositoryRepo.findRepoByIdOrName(repoId);

    if (!repository) {
      throw new NotFoundException(`Repository not found for: ${repoId}`);
    }

    return this.repositoryRuleRepo.create({
      repositoryId: repository.id,
      name: body.name,
      description: body.description,
      pattern: body.pattern || '',
      type: body.type || 'AI',
      isEnabled: body.isEnabled ?? true,
    });
  }

  @Post('rules/:id')
  async updateRule(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      pattern?: string;
      type?: string;
      isEnabled?: boolean;
    },
  ) {
    return this.repositoryRuleRepo.update(id, body);
  }

  @Post('rules/:id/delete')
  async deleteRule(@Param('id') id: string) {
    return this.repositoryRuleRepo.delete(id);
  }

  @Get('jobs/:id/status')
  async getJobStatus(@Param('id') id: string) {
    const job = await this.jobRepo.getJobStatus(id);
    if (!job) {
      throw new NotFoundException(`Analysis job with ID ${id} not found`);
    }
    return {
      id: job.id,
      status: job.status,
      step: job.step,
      error: job.error,
      pullRequestId: job.pullRequestId,
    };
  }
}
