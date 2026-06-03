import { Module, Global } from '@nestjs/common';
import { AiUsageLogRepository } from './ai-usage-log.repository';
import { JobRepository } from './job.repository';
import { PullRequestRepository } from './pull-request.repository';
import { RepositoryRuleRepository } from './repository-rule.repository';
import { RepositoryRepository } from './repository.repository';
import { ReviewResultRepository } from './review-result.repository';

@Global()
@Module({
  providers: [
    AiUsageLogRepository,
    JobRepository,
    PullRequestRepository,
    RepositoryRuleRepository,
    RepositoryRepository,
    ReviewResultRepository,
  ],
  exports: [
    AiUsageLogRepository,
    JobRepository,
    PullRequestRepository,
    RepositoryRuleRepository,
    RepositoryRepository,
    ReviewResultRepository,
  ],
})
export class RepositoriesModule {}
