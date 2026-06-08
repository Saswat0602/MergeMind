import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mergemind/database';
import { decrypt } from '../../settings/utils/crypto';

@Injectable()
export class SettingsResolverAgent {
  private readonly logger = new Logger(SettingsResolverAgent.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async resolve() {
    const dbSettings = await this.prisma.aiSettings.findFirst();
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    let apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    let model =
      this.configService.get<string>('AI_MODEL') ||
      'deepseek/deepseek-v4-flash:free';
    let isConsensusEnabled = false;
    let temperature = 0.1;
    let maxTokens = 30000;
    let systemPromptBase = '';

    if (dbSettings) {
      if (dbSettings.openRouterKey) {
        try {
          apiKey = decrypt(dbSettings.openRouterKey, encryptionKey || '');
        } catch (decryptError: any) {
          this.logger.error(
            `Failed to decrypt OpenRouter API Key: ${decryptError.message}`,
          );
        }
      }
      model = dbSettings.model || model;
      isConsensusEnabled = dbSettings.isConsensusEnabled;
      temperature = dbSettings.temperature ?? temperature;
      maxTokens = dbSettings.maxTokens ?? maxTokens;
      systemPromptBase = dbSettings.systemPrompt || '';
    }

    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured.');
    }

    return {
      apiKey,
      model,
      isConsensusEnabled,
      temperature,
      maxTokens,
      systemPromptBase,
    };
  }
}
