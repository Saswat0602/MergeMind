import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings(false);
  }

  @Get('providers')
  async getProviders() {
    return this.settingsService.getProviders();
  }

  @Post()
  async updateSettings(
    @Body()
    body: {
      provider?: import('@prisma/client').AiProvider;
      openRouterKey?: string;
      openaiKey?: string;
      anthropicKey?: string;
      xaiKey?: string;
      baseUrl?: string;
      awsAccessKeyId?: string;
      awsSecretAccessKey?: string;
      awsRegion?: string;
      model?: string;
      isConsensusEnabled?: boolean;
      isFreeApi?: boolean;
      costPer1mPrompt?: number;
      costPer1mCompletion?: number;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      bypassSignature?: boolean;
    },
  ) {
    return this.settingsService.updateSettings(body);
  }

  @Post('test')
  async testConnection(@Body() body: { openRouterKey?: string }) {
    return this.settingsService.testConnection(body.openRouterKey);
  }

  @Get('github')
  async getGitHubSettings() {
    return this.settingsService.getGitHubSettings(false);
  }

  @Post('github')
  async updateGitHubSettings(
    @Body()
    body: {
      appId?: string;
      privateKey?: string;
      webhookSecret?: string;
      clientId?: string;
      clientSecret?: string;
    },
  ) {
    return this.settingsService.updateGitHubSettings(body);
  }

  @Post('github/test')
  async testGitHubConnection(
    @Body()
    body: {
      appId?: string;
      privateKey?: string;
    },
  ) {
    return this.settingsService.testGitHubConnection(
      body.appId,
      body.privateKey,
    );
  }
}
