import { Injectable, Logger } from '@nestjs/common';
import { GithubService } from './github.service';

@Injectable()
export class GithubCheckRunService {
  private readonly logger = new Logger(GithubCheckRunService.name);

  constructor(private readonly githubService: GithubService) {}

  /**
   * Creates a new Check Run in GitHub
   * Returns the check_run_id which is needed to update it later.
   */
  async createCheckRun(
    installationId: bigint | number,
    owner: string,
    repo: string,
    commitSha: string,
    name = 'MergeMind AI Code Review',
  ): Promise<number> {
    try {
      const octokit = await this.githubService.getAppOctokit(installationId);

      const response = await octokit.rest.checks.create({
        owner,
        repo,
        name,
        head_sha: commitSha,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });

      this.logger.log(
        `Created Check Run ${response.data.id} for ${owner}/${repo}@${commitSha}`,
      );
      return response.data.id;
    } catch (error: any) {
      this.logger.error(`Failed to create Check Run: ${error.message}`);
      throw error;
    }
  }

  /**
   * Completes a Check Run with a conclusion (success, failure, neutral).
   */
  async completeCheckRun(
    installationId: bigint | number,
    owner: string,
    repo: string,
    checkRunId: number,
    conclusion:
      | 'success'
      | 'failure'
      | 'neutral'
      | 'cancelled'
      | 'skipped'
      | 'timed_out'
      | 'action_required',
    title: string,
    summary: string,
  ): Promise<void> {
    try {
      const octokit = await this.githubService.getAppOctokit(installationId);

      await octokit.rest.checks.update({
        owner,
        repo,
        check_run_id: checkRunId,
        status: 'completed',
        conclusion,
        completed_at: new Date().toISOString(),
        output: {
          title,
          summary,
        },
      });

      this.logger.log(
        `Completed Check Run ${checkRunId} with conclusion: ${conclusion}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to complete Check Run ${checkRunId}: ${error.message}`,
      );
      throw error;
    }
  }
}
