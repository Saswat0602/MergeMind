import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@mergemind/database';
import { WebhookPayload } from '@mergemind/shared-types';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectQueue('pr-review') private readonly prReviewQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async processPullRequest(payload: WebhookPayload) {
    const { pull_request, repository } = payload;

    // 1. Upsert Organization
    const organization = await this.prisma.organization.upsert({
      where: { githubId: repository.owner.id },
      update: { name: repository.owner.login },
      create: {
        name: repository.owner.login,
        githubId: repository.owner.id,
      },
    });

    // 2. Upsert Repository
    const repo = await this.prisma.repository.upsert({
      where: { githubId: repository.id },
      update: {
        name: repository.name,
        fullName: repository.full_name,
        defaultBranch: pull_request.base.ref,
      },
      create: {
        name: repository.name,
        fullName: repository.full_name,
        githubId: repository.id,
        organizationId: organization.id,
        defaultBranch: pull_request.base.ref,
      },
    });

    // 3. Upsert Pull Request
    const pr = await this.prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId: repo.id,
          number: pull_request.number,
        },
      },
      update: {
        title: pull_request.title,
        state: payload.action === 'closed' ? 'closed' : 'open',
        headSha: pull_request.head.sha,
        headBranch: pull_request.head.ref,
        baseBranch: pull_request.base.ref,
      },
      create: {
        number: pull_request.number,
        githubId: pull_request.id,
        title: pull_request.title,
        state: 'open',
        authorHandle: pull_request.user.login,
        headSha: pull_request.head.sha,
        headBranch: pull_request.head.ref,
        baseBranch: pull_request.base.ref,
        htmlUrl: pull_request.html_url,
        repositoryId: repo.id,
      },
    });

    // 4. Create Analysis Job record
    const analysisJob = await this.prisma.analysisJob.create({
      data: {
        pullRequestId: pr.id,
        status: 'QUEUED',
        step: 'QUEUED',
      },
    });

    // 5. Add to BullMQ
    await this.prReviewQueue.add(
      'analyze',
      {
        pullRequestId: pr.id,
        analysisJobId: analysisJob.id,
        repositoryFullname: repository.full_name,
        prNumber: pull_request.number,
        headSha: pull_request.head.sha,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );

    this.logger.log(`Queued analysis job for PR #${pull_request.number} in ${repository.full_name}`);

    return { jobId: analysisJob.id };
  }
}
