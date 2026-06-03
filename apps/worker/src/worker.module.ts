import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '@mergemind/database';
import { GithubModule } from './github/github.module';
import { SettingsModule } from './settings/settings.module';
import { PipelineModule } from './pipeline/pipeline.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    DatabaseModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD || '',
      },
    }),
    BullModule.registerQueue({
      name: 'pr-review',
    }),
    GithubModule,
    SettingsModule,
    PipelineModule,
  ],
})
export class WorkerModule {}
