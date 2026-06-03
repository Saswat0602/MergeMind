import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mergemind/database';

@Injectable()
export class ReviewResultRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countCommentsBySeverity() {
    return this.prisma.reviewComment.groupBy({
      by: ['severity'],
      _count: { _all: true },
    });
  }

  async setCommentApplied(commentId: string) {
    return this.prisma.reviewComment.update({
      where: { id: commentId },
      data: { isApplied: true },
    });
  }
}
