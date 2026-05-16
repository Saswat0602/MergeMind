import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhookController } from './controllers/webhook.controller';
import { WebhookService } from './services/webhook.service';
import { PrismaService } from '@mergemind/database';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pr-review',
    }),
  ],
  controllers: [WebhookController],
  providers: [WebhookService, PrismaService],
})
export class GithubModule {}
