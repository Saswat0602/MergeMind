import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GithubService } from './services/github.service';
import { ScrubberService } from './services/scrubber.service';
import { PrReviewProcessor } from './processors/pr-review.processor';
import { PrismaService } from '@mergemind/database';
import { ConfigModule } from '@nestjs/config';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [
    ConfigModule,
    PipelineModule,
    BullModule.registerQueue({
      name: 'pr-review',
    }),
  ],
  controllers: [],
  providers: [GithubService, ScrubberService, PrReviewProcessor, PrismaService],
})
export class GithubModule {}
