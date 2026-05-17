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
  async testConnection(
    @Body() body: { openRouterKey?: string },
  ) {
    return this.settingsService.testConnection(body.openRouterKey);
  }
}
