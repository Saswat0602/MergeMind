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

@Controller('github/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async handleWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') githubEvent: string,
    @Body() payload: SharedTypes.WebhookPayload,
  ) {
    this.verifySignature(payload, signature);

    this.logger.log(
      `Received GitHub webhook event: ${githubEvent} (action: ${payload.action || 'none'})`,
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

  private verifySignature(payload: any, signature: string) {
    const secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
    if (!secret) return; // Skip validation if secret is not set (not recommended for production)

    const hmac = crypto.createHmac('sha256', secret);
    const digest =
      'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

    if (signature !== digest) {
      this.logger.error('Invalid webhook signature');
      throw new UnauthorizedException('Invalid signature');
    }
  }
}
