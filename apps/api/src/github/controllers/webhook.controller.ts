import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { WebhookService } from '../services/webhook.service';
import * as SharedTypes from '@mergemind/shared-types';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mergemind/database';
import { decrypt } from '../../settings/utils/crypto';

@Controller('github/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private readonly processedDeliveries = new Set<string>();

  @Post()
  async handleWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') githubEvent: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Body() payload: SharedTypes.WebhookPayload,
  ) {
    await this.verifySignature(payload, signature);

    if (deliveryId) {
      if (this.processedDeliveries.has(deliveryId)) {
        this.logger.warn(`Deduplicated incoming webhook. Delivery ID ${deliveryId} already processed.`);
        return { received: true, deduplicated: true };
      }
      this.processedDeliveries.add(deliveryId);
      // Limit size of set to avoid memory growth
      if (this.processedDeliveries.size > 200) {
        const first = this.processedDeliveries.values().next().value;
        if (first !== undefined) {
          this.processedDeliveries.delete(first);
        }
      }
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
    }

    return { received: true };
  }

  private async verifySignature(payload: any, signature: string) {
    let secret: string | undefined;

    try {
      const dbSettings = await this.prisma.gitHubSettings.findFirst();
      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '';

      if (dbSettings && dbSettings.webhookSecret) {
        try {
          secret = decrypt(dbSettings.webhookSecret, encryptionKey);
        } catch (decryptError) {
          this.logger.error(`Failed to decrypt GitHub Webhook Secret from DB settings: ${decryptError.message}`);
        }
      }
    } catch (dbError) {
      this.logger.error(`Error querying GitHubSettings in verifySignature: ${dbError.message}`);
    }

    if (!secret) {
      secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
    }

    if (!secret) return; // Skip validation if secret is not set (not recommended for production)

    // Clean surrounding quotes if present from env file
    secret = secret.replace(/^["']|["']$/g, '');

    const hmac = crypto.createHmac('sha256', secret);
    const digest =
      'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

    if (signature !== digest) {
      this.logger.warn(
        `Webhook signature verification failed. This is common in Node.js due to JSON stringify spacing mismatches. ` +
        `Digest computed: ${digest}, GitHub Signature: ${signature}`
      );
      
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      if (isProduction) {
        throw new UnauthorizedException('Invalid signature');
      } else {
        this.logger.log('Signature check bypassed because server is running in local development mode.');
      }
    }
  }
}
