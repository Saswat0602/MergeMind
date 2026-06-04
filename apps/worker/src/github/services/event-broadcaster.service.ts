import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class EventBroadcasterService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly logger = new Logger(EventBroadcasterService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    );
  }

  onModuleDestroy() {
    this.redis.quit();
  }

  broadcastJobUpdate(
    jobId: string,
    status: string,
    step: string,
    error?: string,
    pullRequestId?: string,
  ) {
    const payload = { jobId, status, step, error, pullRequestId };
    this.redis.publish('job_updates', JSON.stringify(payload)).catch((err) => {
      this.logger.error(`Failed to broadcast job update: ${err.message}`);
    });
  }
}
