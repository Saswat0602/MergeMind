import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mergemind/database';

@Injectable()
export class JobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getJobStatus(id: string) {
    return this.prisma.analysisJob.findUnique({
      where: { id },
    });
  }
}
