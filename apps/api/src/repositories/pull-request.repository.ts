import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mergemind/database';

@Injectable()
export class PullRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countTotal() {
    return this.prisma.pullRequest.count();
  }

  async getPaginatedPRs(skip: number, take: number) {
    return this.prisma.pullRequest.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        repository: true,
        reviews: { orderBy: { createdAt: 'desc' }, take: 1 },
        jobs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async getPRDetails(id: string) {
    return this.prisma.pullRequest.findUnique({
      where: { id },
      include: {
        repository: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { comments: true, usageLogs: true },
        },
        jobs: { orderBy: { createdAt: 'desc' } },
      },
    });
  }
}
