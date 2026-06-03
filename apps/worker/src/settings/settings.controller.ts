import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings(false);
  }

  @Post()
  async updateSettings(
    @Body()
    body: {
      openRouterKey?: string;
      defaultModel?: string;
      fallbackModel?: string;
      isFallbackEnabled?: boolean;
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
