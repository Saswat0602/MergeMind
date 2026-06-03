import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mergemind/database';

@Injectable()
export class RepositoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countActive() {
    return this.prisma.repository.count({ where: { isActive: true } });
  }

  async getActiveRepositories() {
    return this.prisma.repository.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async findRepoByIdOrName(repoId: string) {
    return this.prisma.repository.findFirst({
      where: {
        OR: [{ id: repoId }, { fullName: repoId }, { name: repoId }],
      },
    });
  }
}
