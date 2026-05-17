import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(private readonly configService: ConfigService) {}

  private getAppOctokit(installationId: number): Octokit {
    const appId = this.configService.get<string>('GITHUB_APP_ID');
    let privateKey = this.configService.get<string>('GITHUB_PRIVATE_KEY');

    if (!appId || !privateKey) {
      throw new Error('GITHUB_APP_ID or GITHUB_PRIVATE_KEY is not set in environment');
    }

    // Support base64 encoded private keys (common in production env vars)
    if (!privateKey.includes('-----BEGIN')) {
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      } catch (err) {
        // Fallback
      }
    }

    // Replace literal newlines if private key is stored as single-line with '\n'
    privateKey = privateKey.replace(/\\n/g, '\n');

    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: parseInt(appId, 10),
        privateKey: privateKey,
        installationId: installationId,
      },
    });
  }

  async getPullRequestDiff(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<string> {
    try {
      const octokit = this.getAppOctokit(installationId);
      const response = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        headers: {
          accept: 'application/vnd.github.v3.diff',
        },
      });

      return response.data as unknown as string;
    } catch (error) {
      this.logger.error(
        `Failed to fetch PR diff for ${owner}/${repo} #${pullNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  async postPullRequestReview(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
    commitSha: string,
    summary: string,
    comments: Array<{
      path: string;
      line: number;
      body: string;
    }>,
  ): Promise<void> {
    try {
      const octokit = this.getAppOctokit(installationId);

      // GitHub pulls.createReview allows line field for inline comments since Octokit REST API v3
      await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        commit_id: commitSha,
        event: 'COMMENT',
        body: summary,
        comments: comments.map(c => ({
          path: c.path,
          line: c.line,
          body: c.body,
        })),
      });

      this.logger.log(`Successfully posted PR review on ${owner}/${repo} #${pullNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to post PR review for ${owner}/${repo} #${pullNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  async getCompareDiff(
    installationId: number,
    owner: string,
    repo: string,
    base: string,
    head: string,
  ): Promise<string> {
    try {
      const octokit = this.getAppOctokit(installationId);
      const response = await octokit.rest.repos.compareCommits({
        owner,
        repo,
        base,
        head,
        headers: {
          accept: 'application/vnd.github.v3.diff',
        },
      });

      return response.data as unknown as string;
    } catch (error) {
      this.logger.error(
        `Failed to fetch comparison diff for ${owner}/${repo} ${base}...${head}: ${error.message}`,
      );
      throw error;
    }
  }

  async postCommitComments(
    installationId: number,
    owner: string,
    repo: string,
    commitSha: string,
    comments: Array<{
      path: string;
      line: number;
      body: string;
    }>,
  ): Promise<void> {
    try {
      const octokit = this.getAppOctokit(installationId);

      for (const comment of comments) {
        await octokit.rest.repos.createCommitComment({
          owner,
          repo,
          commit_sha: commitSha,
          body: comment.body,
          path: comment.path,
          line: comment.line,
        });
      }

      this.logger.log(`Successfully posted ${comments.length} commit comments on ${owner}/${repo} @ ${commitSha}`);
    } catch (error) {
      this.logger.error(
        `Failed to post commit comments for ${owner}/${repo} @ ${commitSha}: ${error.message}`,
      );
      throw error;
    }
  }
}
