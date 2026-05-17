import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@mergemind/database';

@Controller('dashboard')
export class ReviewsController {
  constructor(private readonly prisma: PrismaService) {}

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

    return {
      totalPrs,
      activeRepositories,
      highSeverityCount,
      mediumSeverityCount,
      lowSeverityCount,
      totalTokens: usage._sum.totalTokens || 0,
      totalCost: usage._sum.cost || 0.0,
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
        repositoryName: log.reviewResult?.pullRequest?.repository?.fullName || 'N/A',
        prTitle: log.reviewResult?.pullRequest?.title || 'N/A',
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
}
