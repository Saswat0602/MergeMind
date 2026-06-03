import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '@mergemind/database';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

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
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
