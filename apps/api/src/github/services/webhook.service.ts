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
    const { repository } = payload;
    const pull_request = payload.pull_request!;

    // 0. Upsert GitHubInstallation if present
    let installationId: number | undefined;
    if (payload.installation?.id) {
      installationId = payload.installation.id;
      await this.prisma.gitHubInstallation.upsert({
        where: { githubId: BigInt(installationId) },
        update: { isActive: true },
        create: {
          githubId: BigInt(installationId),
          accountName: repository.owner.login,
          accountType: 'Organization',
          targetId: BigInt(repository.owner.id),
          isActive: true,
        },
      });
    }

    // 1. Upsert Organization
    const organization = await this.prisma.organization.upsert({
      where: { githubId: BigInt(repository.owner.id) },
      update: {
        name: repository.owner.login,
        ...(installationId ? { installationId: BigInt(installationId) } : {}),
      },
      create: {
        name: repository.owner.login,
        githubId: BigInt(repository.owner.id),
        ...(installationId ? { installationId: BigInt(installationId) } : {}),
      },
    });

    // 2. Upsert Repository
    const repo = await this.prisma.repository.upsert({
      where: { githubId: BigInt(repository.id) },
      update: {
        name: repository.name,
        fullName: repository.full_name,
        defaultBranch: pull_request.base.ref,
      },
      create: {
        name: repository.name,
        fullName: repository.full_name,
        githubId: BigInt(repository.id),
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
        githubId: BigInt(pull_request.id),
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
        commitMessage: pull_request.title,
        branchName: pull_request.head.ref,
        isPushEvent: false,
      },
      {
        jobId: `pr-${pull_request.number}-${pull_request.head.sha}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );

    this.logger.log(
      `Queued analysis job for PR #${pull_request.number} in ${repository.full_name}`,
    );

    return { jobId: analysisJob.id };
  }

  private getStableNegativeNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return -Math.abs(hash % 900000) - 100; // returns value in range [-900100, -100]
  }

  async processPushCommit(payload: WebhookPayload) {
    const { repository, ref, before, after, commits } = payload;

    if (!after || after === '0000000000000000000000000000000000000000' || !commits || commits.length === 0) {
      return { skipped: true, reason: 'No new commits or branch deleted' };
    }

    // 0. Upsert GitHubInstallation if present
    let installationId: number | undefined;
    if (payload.installation?.id) {
      installationId = payload.installation.id;
      await this.prisma.gitHubInstallation.upsert({
        where: { githubId: BigInt(installationId) },
        update: { isActive: true },
        create: {
          githubId: BigInt(installationId),
          accountName: repository.owner.login,
          accountType: 'Organization',
          targetId: BigInt(repository.owner.id),
          isActive: true,
        },
      });
    }

    // 1. Upsert Organization
    const organization = await this.prisma.organization.upsert({
      where: { githubId: BigInt(repository.owner.id) },
      update: {
        name: repository.owner.login,
        ...(installationId ? { installationId: BigInt(installationId) } : {}),
      },
      create: {
        name: repository.owner.login,
        githubId: BigInt(repository.owner.id),
        ...(installationId ? { installationId: BigInt(installationId) } : {}),
      },
    });

    // 2. Upsert Repository
    const branchName = ref ? ref.replace('refs/heads/', '') : 'main';
    const repo = await this.prisma.repository.upsert({
      where: { githubId: BigInt(repository.id) },
      update: {
        name: repository.name,
        fullName: repository.full_name,
        defaultBranch: branchName,
      },
      create: {
        name: repository.name,
        fullName: repository.full_name,
        githubId: BigInt(repository.id),
        organizationId: organization.id,
        defaultBranch: branchName,
      },
    });

    // 3. Create or Upsert a Special "Branch Commit Push" PullRequest record
    const pseudoNumber = this.getStableNegativeNumber(after);
    const latestCommit = commits[commits.length - 1];
    const shortSha = after.substring(0, 7);

    const pr = await this.prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId: repo.id,
          number: pseudoNumber,
        },
      },
      update: {
        title: `Branch Push: ${branchName} (${shortSha})`,
        state: 'open',
        headSha: after,
        headBranch: branchName,
        baseBranch: branchName,
      },
      create: {
        number: pseudoNumber,
        githubId: BigInt(pseudoNumber), // negative unique ID to avoid conflict with standard GitHub IDs
        title: `Branch Push: ${branchName} (${shortSha})`,
        state: 'open',
        authorHandle: latestCommit?.author?.username || repository.owner.login,
        headSha: after,
        headBranch: branchName,
        baseBranch: branchName,
        htmlUrl: `https://github.com/${repository.full_name}/commit/${after}`,
        repositoryId: repo.id,
      },
    });

    // 4. Create Standalone Commit Analysis Job record
    const analysisJob = await this.prisma.analysisJob.create({
      data: {
        pullRequestId: pr.id,
        status: 'QUEUED',
        step: 'QUEUED',
      },
    });

    // 5. Add to BullMQ with isPushEvent flag
    await this.prReviewQueue.add(
      'analyze',
      {
        pullRequestId: pr.id,
        analysisJobId: analysisJob.id,
        repositoryFullname: repository.full_name,
        beforeSha: before,
        afterSha: after,
        headSha: after,
        commitMessage: latestCommit?.message || 'Branch Push',
        branchName: branchName,
        authorHandle: latestCommit?.author?.username || repository.owner.login,
        isPushEvent: true,
      },
      {
        jobId: `push-${after}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );

    this.logger.log(
      `Queued direct push analysis job for commits on ref ${ref} in ${repository.full_name}`,
    );

    return { jobId: analysisJob.id };
  }
}
