import { Module } from '@nestjs/common';
import { ReviewsController } from './controllers/reviews.controller';
import { GithubService } from './services/github.service';
import { PrismaService } from '@mergemind/database';

@Module({
  imports: [],
  controllers: [ReviewsController],
  providers: [
    GithubService,
    PrismaService,
  ],
})
export class GithubModule {}
