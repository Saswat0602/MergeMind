import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Subject, Observable } from 'rxjs';

export interface JobEvent {
  jobId: string;
  status: string;
  step: string;
  error?: string;
  pullRequestId?: string;
}

@Injectable()
export class SseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SseService.name);
  private redisSubscriber: Redis;
  private readonly eventsSubject = new Subject<JobEvent>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisSubscriber = new Redis(redisUrl);

    void this.redisSubscriber.subscribe('job_updates', (err, count) => {
      if (err) {
        this.logger.error(
          'Failed to subscribe to job_updates: %s',
          err.message,
        );
      } else {
        this.logger.log(
          `Subscribed successfully! This client is currently subscribed to ${String(count)} channels.`,
        );
      }
    });

    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === 'job_updates') {
        try {
          const data = JSON.parse(message) as JobEvent;
          this.eventsSubject.next(data);
        } catch (e) {
          this.logger.error('Failed to parse SSE message', e);
        }
      }
    });
  }

  onModuleDestroy() {
    void this.redisSubscriber.quit();
  }

  getJobEvents$(): Observable<JobEvent> {
    return this.eventsSubject.asObservable();
  }
}
