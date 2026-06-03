import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReviewsController } from './controllers/reviews.controller';
import { GithubService } from './services/github.service';
import { SseService } from './services/sse.service';
import { PrismaService } from '@mergemind/database';

@Module({
  imports: [ConfigModule],
  controllers: [ReviewsController],
  providers: [GithubService, SseService, PrismaService],
})
export class GithubModule {}
