import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mergemind/database';

@Injectable()
export class AiUsageLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async aggregateUsage() {
    return this.prisma.aiUsageLog.aggregate({
      _sum: {
        totalTokens: true,
        cost: true,
        promptTokens: true,
        completionTokens: true,
      },
      _avg: { latencyMs: true },
      _count: { id: true },
    });
  }

  async getUsageLogsWithDetails() {
    return this.prisma.aiUsageLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reviewResult: {
          include: { pullRequest: { include: { repository: true } } },
        },
      },
    });
  }

  async getDailyUsageSince(date: Date) {
    return this.prisma.aiUsageLog.findMany({
      where: { createdAt: { gte: date } },
      select: { createdAt: true, totalTokens: true, cost: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
