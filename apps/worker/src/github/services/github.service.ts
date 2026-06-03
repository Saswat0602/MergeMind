import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { PrismaService } from '@mergemind/database';
import { decrypt } from '../../settings/utils/crypto';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  public async getAppOctokit(
    installationId: bigint | number,
  ): Promise<Octokit> {
    let appId: string | undefined;
    let privateKey: string | undefined;

    try {
      const dbSettings = await this.prisma.gitHubSettings.findFirst();
      const encryptionKey =
        this.configService.get<string>('ENCRYPTION_KEY') || '';

      if (dbSettings && dbSettings.appId && dbSettings.privateKey) {
        appId = dbSettings.appId;
        try {
          privateKey = decrypt(dbSettings.privateKey, encryptionKey);
        } catch (decryptError: any) {
          this.logger.error(
            `Failed to decrypt GitHub Private Key from DB settings: ${decryptError.message}`,
          );
        }
      }
    } catch (dbError: any) {
      this.logger.error(
        `Error querying GitHubSettings from database: ${dbError.message}`,
      );
    }

    // Fallback to environment variables if not resolved from database
    if (!appId || !privateKey) {
      appId = this.configService.get<string>('GITHUB_APP_ID');
      privateKey = this.configService.get<string>('GITHUB_PRIVATE_KEY');
    }

    if (!appId || !privateKey) {
      throw new Error(
        'GitHub App credentials (App ID or Private Key) are not configured in settings or environment.',
      );
    }

    // Support base64 encoded private keys (common in production env vars)
    if (!privateKey.includes('-----BEGIN')) {
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      } catch {
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
        installationId: Number(installationId),
      },
    });
  }

  async getPullRequestDiff(
    installationId: bigint | number,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<string> {
    try {
      const octokit = await this.getAppOctokit(installationId);
      const response = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        headers: {
          accept: 'application/vnd.github.v3.diff',
        },
      });

      return response.data as unknown as string;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch PR diff for ${owner}/${repo} #${pullNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  async postPullRequestReview(
    installationId: bigint | number,
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
      const octokit = await this.getAppOctokit(installationId);

      // GitHub pulls.createReview allows line field for inline comments since Octokit REST API v3
      await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        commit_id: commitSha,
        event: 'COMMENT',
        body: summary,
        comments: comments.map((c) => ({
          path: c.path,
          line: c.line,
          body: c.body,
        })),
      });

      this.logger.log(
        `Successfully posted PR review on ${owner}/${repo} #${pullNumber}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to post PR review for ${owner}/${repo} #${pullNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  async getCompareDiff(
    installationId: bigint | number,
    owner: string,
    repo: string,
    base: string,
    head: string,
  ): Promise<string> {
    try {
      const octokit = await this.getAppOctokit(installationId);
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
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch comparison diff for ${owner}/${repo} ${base}...${head}: ${error.message}`,
      );
      throw error;
    }
  }

  async postCommitComments(
    installationId: bigint | number,
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
      const octokit = await this.getAppOctokit(installationId);

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

      this.logger.log(
        `Successfully posted ${comments.length} commit comments on ${owner}/${repo} @ ${commitSha}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to post commit comments for ${owner}/${repo} @ ${commitSha}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Applies an AI Suggested Code Fix directly onto the target repository's pull request branch (Phase 5).
   */
  async applyCommitPatch(
    pullRequestId: string,
    filePath: string,
    suggestion: string,
    startLine: number,
    endLine?: number,
  ): Promise<{ success: boolean; sha?: string; htmlUrl?: string }> {
    const pr = await this.prisma.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: {
        repository: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!pr) {
      throw new Error(`PR record with ID ${pullRequestId} not found`);
    }

    const { repository } = pr;
    const { organization } = repository;

    if (!organization.installationId) {
      throw new Error(
        `GitHub App Installation ID not found for repository ${repository.fullName}`,
      );
    }

    const [owner, repo] = repository.fullName.split('/');
    const branchName = pr.headBranch || 'main';

    this.logger.log(
      `Applying AI Suggested patch on ${repository.fullName} branch ${branchName} file ${filePath} lines ${startLine}-${endLine || startLine}`,
    );

    const octokit = await this.getAppOctokit(organization.installationId);

    let fileSha: string;
    let originalContent: string;
    try {
      const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branchName,
      });

      if ('content' in response.data) {
        fileSha = response.data.sha;
        originalContent = Buffer.from(response.data.content, 'base64').toString(
          'utf8',
        );
      } else {
        throw new Error(`Path ${filePath} is not a valid text file`);
      }
    } catch (fetchError: any) {
      this.logger.error(
        `Failed to fetch file ${filePath} from GitHub branch ${branchName}: ${fetchError.message}`,
      );
      throw new Error(
        `Failed to locate target file on GitHub: ${fetchError.message}`,
      );
    }

    const lines = originalContent.split('\n');
    const targetEndLine = endLine || startLine;
    if (startLine < 1 || targetEndLine > lines.length || startLine > targetEndLine) {
      throw new Error(
        `Line range ${startLine}-${targetEndLine} is out of bounds for file ${filePath} (total lines: ${lines.length})`,
      );
    }

    let cleanSuggestion = suggestion.trim();
    if (cleanSuggestion.includes('```')) {
      const match = cleanSuggestion.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/);
      if (match && match[1]) {
        cleanSuggestion = match[1].trim();
      }
    }

    lines.splice(startLine - 1, targetEndLine - startLine + 1, cleanSuggestion);
    const updatedContent = lines.join('\n');

    try {
      const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: `style(audit): Apply AI Suggested Hotfix on ${filePath} lines ${startLine}-${targetEndLine}`,
        content: Buffer.from(updatedContent).toString('base64'),
        sha: fileSha,
        branch: branchName,
      });

      return {
        success: true,
        sha: response.data.commit.sha,
        htmlUrl: response.data.commit.html_url,
      };
    } catch (commitError: any) {
      this.logger.error(`GitHub commit update failed: ${commitError.message}`);
      throw new Error(`GitHub branch commit rejected: ${commitError.message}`);
    }
  }

  async syncInstallationRepositories(): Promise<void> {
    try {
      const installations = await this.prisma.gitHubInstallation.findMany();
      this.logger.log(
        `Syncing repositories for ${installations.length} installations...`,
      );

      for (const inst of installations) {
        try {
          const octokit = await this.getAppOctokit(inst.githubId);
          // Fetch accessible repositories from GitHub
          const response =
            await octokit.rest.apps.listReposAccessibleToInstallation({
              per_page: 100,
            });

          const repos = response.data.repositories || [];
          this.logger.log(
            `Found ${repos.length} accessible repos on GitHub for installation ${inst.githubId}`,
          );

          for (const ghRepo of repos) {
            // Find or create Organization for the repository owner
            let org = await this.prisma.organization.findFirst({
              where: { githubId: ghRepo.owner.id },
            });

            if (!org) {
              org = await this.prisma.organization.create({
                data: {
                  name: ghRepo.owner.login,
                  githubId: ghRepo.owner.id,
                  installationId: inst.githubId,
                },
              });
            }

            // Upsert Repository into the database
            await this.prisma.repository.upsert({
              where: { githubId: ghRepo.id },
              update: {
                name: ghRepo.name,
                fullName: ghRepo.full_name,
                isActive: true,
              },
              create: {
                name: ghRepo.name,
                fullName: ghRepo.full_name,
                githubId: ghRepo.id,
                organizationId: org.id,
                defaultBranch: ghRepo.default_branch || 'main',
                isActive: true,
              },
            });
          }
        } catch (instError: any) {
          this.logger.error(
            `Failed to sync repos for installation ${inst.githubId}: ${instError.message}`,
          );
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Error in syncInstallationRepositories: ${err.message}`,
      );
    }
  }
}
