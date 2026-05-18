import { Controller, Get, Post, Body, Param, Query, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@mergemind/database';
import { GithubService } from '../services/github.service';

@Controller('dashboard')
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
  ) {}

  @Get('stats')
  async getStats() {
    const totalPrs = await this.prisma.pullRequest.count();
    const activeRepositories = await this.prisma.repository.count({
      where: { isActive: true },
    });

    // Aggregate comments count by severity
    const comments = await this.prisma.reviewComment.groupBy({
      by: ['severity'],
      _count: {
        _all: true,
      },
    });

    const highSeverityCount = comments.find(c => c.severity === 'HIGH')?._count._all || 0;
    const mediumSeverityCount = comments.find(c => c.severity === 'MEDIUM')?._count._all || 0;
    const lowSeverityCount = comments.find(c => c.severity === 'LOW')?._count._all || 0;

    // Aggregate tokens and cost
    const usage = await this.prisma.aiUsageLog.aggregate({
      _sum: {
        totalTokens: true,
        cost: true,
      },
    });

    // Past 7 days daily metrics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyUsage = await this.prisma.aiUsageLog.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
        totalTokens: true,
        cost: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date string (YYYY-MM-DD)
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
    const logs = await this.prisma.aiUsageLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reviewResult: {
          include: {
            pullRequest: {
              include: {
                repository: true,
              },
            },
          },
        },
      },
    });

    const totalUsage = await this.prisma.aiUsageLog.aggregate({
      _sum: {
        totalTokens: true,
        cost: true,
        promptTokens: true,
        completionTokens: true,
      },
      _avg: {
        latencyMs: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      logs: logs.map(log => ({
        id: log.id,
        modelName: log.modelName,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens: log.totalTokens,
        latencyMs: log.latencyMs,
        cost: log.cost || 0.0,
        createdAt: log.createdAt,
        actionDescription: log.actionDescription || 'Pull Request Review Audit',
        repositoryName: log.reviewResult?.pullRequest?.repository?.fullName || 
          (log.actionDescription?.includes('Handshake') ? 'System Connection' : 'N/A'),
        prTitle: log.reviewResult?.pullRequest?.title || 
          (log.actionDescription ? log.actionDescription.replace('Push Commit Audit: ', '').replace(/"/g, '') : 'N/A'),
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
  async getPRs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const prs = await this.prisma.pullRequest.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        repository: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const total = await this.prisma.pullRequest.count();

    const formattedPrs = prs.map(pr => {
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
      }
    };
  }

  @Get('prs/:id')
  async getPRDetails(@Param('id') id: string) {
    const pr = await this.prisma.pullRequest.findUnique({
      where: { id },
      include: {
        repository: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            comments: true,
            usageLogs: true,
          },
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pr) {
      throw new NotFoundException(`PR with ID ${id} not found`);
    }

    return pr;
  }

  @Post('commit/apply-fix')
  async applyFix(
    @Body()
    body: {
      pullRequestId: string;
      filePath: string;
      suggestion: string;
      lineNumber: number;
    },
  ) {
    if (!body.pullRequestId || !body.filePath || !body.suggestion || !body.lineNumber) {
      throw new BadRequestException('Missing required fields for applying suggested commit patch');
    }

    // Syntax validation warning check for sandbox code edits (non-blocking)
    const fileExtension = body.filePath.split('.').pop()?.toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx'].includes(fileExtension || '')) {
      try {
        const ts = require('typescript');
        const sourceFile = ts.createSourceFile(
          body.filePath,
          body.suggestion,
          ts.ScriptTarget.Latest,
          true
        );
        const diagnostics = (sourceFile as any).parseDiagnostics || [];
        if (diagnostics.length > 0) {
          const firstError = diagnostics[0];
          const message = typeof firstError.messageText === 'string' 
            ? firstError.messageText 
            : firstError.messageText.messageText || 'Unknown syntax error';
          this.logger.warn(`Sandbox compilation warning for ${body.filePath}: ${message}`);
        }
      } catch (err) {
        this.logger.warn(`Failed to parse syntax for ${body.filePath}: ${err.message}`);
      }
    } else if (fileExtension === 'json') {
      try {
        JSON.parse(body.suggestion);
      } catch (jsonErr) {
        throw new BadRequestException(`JSON syntax validation failed: ${jsonErr.message}`);
      }
    }

    try {
      const result = await this.githubService.applyCommitPatch(
        body.pullRequestId,
        body.filePath,
        body.suggestion,
        body.lineNumber,
      );
      return result;
    } catch (err) {
      throw new BadRequestException(`Failed to apply suggested commit patch: ${err.message}`);
    }
  }

  @Get('repositories')
  async getRepositories() {
    await this.githubService.syncInstallationRepositories();
    return this.prisma.repository.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
    });
  }

  @Get('repositories/:repoId/rules')
  async getRules(@Param('repoId') repoId: string) {
    const repository = await this.prisma.repository.findFirst({
      where: {
        OR: [
          { id: repoId },
          { fullName: repoId },
          { name: repoId },
        ],
      },
    });

    if (!repository) {
      throw new NotFoundException(`Repository not found for: ${repoId}`);
    }

    let rules = await this.prisma.repositoryRule.findMany({
      where: { repositoryId: repository.id },
      orderBy: { createdAt: 'asc' },
    });

    // Dynamic default rules fallback: if no rules are configured in the DB yet,
    // dynamically create and seed the 4 standard default rules!
    if (rules.length === 0) {
      const defaults = [
        {
          name: 'Strict Type Safety',
          description: 'Audit TypeScript files to strictly prohibit raw "any" types or uncasted object references.',
          pattern: 'any',
          type: 'AI',
          isEnabled: true,
        },
        {
          name: 'Security Shield',
          description: 'Prohibit hardcoded API credentials, private key files, database passwords, or auth tokens.',
          pattern: 'sk-|key-|token-|password',
          type: 'AI',
          isEnabled: true,
        },
        {
          name: 'Async Error Boundaries',
          description: 'Ensure all asynchronous API operations, database queries, and async methods are enclosed in robust try-catch blocks.',
          pattern: 'async',
          type: 'AI',
          isEnabled: true,
        },
        {
          name: 'No Debug Logs in Production',
          description: 'Avoid checkins of console.logs or temporary debug tracers in primary controller, router, or database files.',
          pattern: 'console.log',
          type: 'AI',
          isEnabled: false,
        },
      ];

      const createdRules: any[] = [];
      for (const rule of defaults) {
        const newRule = await this.prisma.repositoryRule.create({
          data: {
            repositoryId: repository.id,
            ...rule,
          },
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
    const repository = await this.prisma.repository.findFirst({
      where: {
        OR: [
          { id: repoId },
          { fullName: repoId },
          { name: repoId },
        ],
      },
    });

    if (!repository) {
      throw new NotFoundException(`Repository not found for: ${repoId}`);
    }

    return this.prisma.repositoryRule.create({
      data: {
        repositoryId: repository.id,
        name: body.name,
        description: body.description,
        pattern: body.pattern || '',
        type: body.type || 'AI',
        isEnabled: body.isEnabled ?? true,
      },
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
    return this.prisma.repositoryRule.update({
      where: { id },
      data: body,
    });
  }

  @Post('rules/:id/delete')
  async deleteRule(@Param('id') id: string) {
    return this.prisma.repositoryRule.delete({
      where: { id },
    });
  }

  @Get('jobs/:id/status')
  async getJobStatus(@Param('id') id: string) {
    const job = await this.prisma.analysisJob.findUnique({
      where: { id },
    });
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
