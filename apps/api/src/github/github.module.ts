import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhookController } from './controllers/webhook.controller';
import { ReviewsController } from './controllers/reviews.controller';
import { WebhookService } from './services/webhook.service';
import { GithubService } from './services/github.service';
import { AiService } from './services/ai.service';
import { PrReviewProcessor } from './processors/pr-review.processor';
import { PrismaService } from '@mergemind/database';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pr-review',
    }),
  ],
  controllers: [WebhookController, ReviewsController],
  providers: [
    WebhookService,
    GithubService,
    AiService,
    PrReviewProcessor,
    PrismaService,
  ],
})
export class GithubModule {}
