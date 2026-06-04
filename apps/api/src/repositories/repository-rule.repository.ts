import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mergemind/database';

@Injectable()
export class RepositoryRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRepo(repoId: string) {
    return this.prisma.repositoryRule.findMany({
      where: { repositoryId: repoId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    data: import('@prisma/client').Prisma.RepositoryRuleUncheckedCreateInput,
  ) {
    return this.prisma.repositoryRule.create({ data });
  }

  async update(
    id: string,
    data: import('@prisma/client').Prisma.RepositoryRuleUpdateInput,
  ) {
    return this.prisma.repositoryRule.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.repositoryRule.delete({ where: { id } });
  }
}
