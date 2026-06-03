/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
  Req,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import * as SharedTypes from '@mergemind/shared-types';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mergemind/database';
import { decrypt } from './utils/crypto';
import Redis from 'ioredis';

@Controller('github/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly redisClient: Redis;

  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.redisClient = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    );
  }

  @Post()
  async handleWebhook(
    @Req() req: any,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') githubEvent: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Body() payload: SharedTypes.WebhookPayload,
  ) {
    await this.verifySignature(req, signature);

    if (deliveryId) {
      const redisKey = `webhook:delivery:${deliveryId}`;
      const isDuplicate = await this.redisClient.exists(redisKey);

      if (isDuplicate) {
        this.logger.warn(
          `Deduplicated incoming webhook. Delivery ID ${deliveryId} already processed.`,
        );
        return { received: true, deduplicated: true };
      }

      // Store delivery ID with 1 hour TTL (3600 seconds)
      await this.redisClient.set(redisKey, '1', 'EX', 3600);
    }

    this.logger.log(
      `Received GitHub webhook event: ${githubEvent} (action: ${payload.action || 'none'}) [Delivery: ${deliveryId || 'N/A'}]`,
    );

    if (githubEvent === 'pull_request') {
      if (payload.action === 'opened' || payload.action === 'synchronize') {
        return this.webhookService.processPullRequest(payload);
      }
    } else if (githubEvent === 'push') {
      return this.webhookService.processPushCommit(payload);
    } else if (githubEvent === 'installation') {
      return this.webhookService.processInstallation(payload);
    } else if (githubEvent === 'installation_repositories') {
      return this.webhookService.processInstallationRepositories(payload);
    }

    return { received: true };
  }

  private async verifySignature(req: any, signature: string) {
    let secret: string | undefined;

    try {
      const dbSettings = await this.prisma.gitHubSettings.findFirst();
      const encryptionKey =
        this.configService.get<string>('ENCRYPTION_KEY') || '';

      if (dbSettings && dbSettings.webhookSecret) {
        try {
          secret = decrypt(dbSettings.webhookSecret, encryptionKey);
        } catch (decryptError: any) {
          this.logger.error(
            `Failed to decrypt GitHub Webhook Secret from DB settings: ${decryptError.message}`,
          );
        }
      }
    } catch (dbError: any) {
      this.logger.error(
        `Error querying GitHubSettings in verifySignature: ${dbError.message}`,
      );
    }

    if (!secret) {
      secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
    }

    if (!secret) return;

    secret = secret.replace(/^["']|["']$/g, '');

    const rawBody = req.rawBody
      ? req.rawBody.toString('utf8')
      : JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

    if (signature !== digest) {
      this.logger.warn(
        `Webhook signature verification failed. Digest computed: ${digest}, GitHub Signature: ${signature}`,
      );

      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production';
      if (isProduction) {
        throw new UnauthorizedException('Invalid signature');
      } else {
        this.logger.log(
          'Signature check bypassed because server is running in local development mode.',
        );
      }
    }
  }
}
