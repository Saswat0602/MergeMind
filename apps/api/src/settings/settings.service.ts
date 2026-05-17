import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mergemind/database';
import { encrypt, decrypt } from './utils/crypto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly encryptionKey: string;
  private readonly maskedPlaceholder = 'sk-or-v1-****************************************';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '';
    if (!this.encryptionKey) {
      this.logger.error('ENCRYPTION_KEY environment variable is not defined!');
    }
  }

  /**
   * Retrieves the AI settings record. If none exists, creates and returns a default one.
   * @param decrypted If true, returns the decrypted API key. Otherwise returns masked version.
   */
  async getSettings(decrypted = false) {
    let settings = await this.prisma.aiSettings.findFirst();
    
    if (!settings) {
      this.logger.log('No AI settings found. Creating default configuration.');
      settings = await this.prisma.aiSettings.create({
        data: {
          defaultModel: 'deepseek/deepseek-v4-flash:free',
          fallbackModel: 'arcee-ai/trinity-large-thinking:free',
          isFallbackEnabled: true,
          temperature: 0.1,
          maxTokens: 2048,
          bypassSignature: true,
        },
      });
    }

    const response = { ...settings };

    if (settings.openRouterKey) {
      if (decrypted) {
        response.openRouterKey = decrypt(settings.openRouterKey, this.encryptionKey);
      } else {
        response.openRouterKey = this.maskedPlaceholder;
      }
    } else {
      response.openRouterKey = '';
    }

    return response;
  }

  /**
   * Updates or inserts the AI settings.
   */
  async updateSettings(data: {
    openRouterKey?: string;
    defaultModel?: string;
    fallbackModel?: string;
    isFallbackEnabled?: boolean;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    bypassSignature?: boolean;
  }) {
    const existing = await this.prisma.aiSettings.findFirst();
    const updateData: any = { ...data };

    // Handle OpenRouter API Key Encryption
    if (data.openRouterKey !== undefined) {
      if (data.openRouterKey === this.maskedPlaceholder) {
        // Masked key, user did not modify it. Retain existing encrypted key.
        if (existing) {
          updateData.openRouterKey = existing.openRouterKey;
        } else {
          updateData.openRouterKey = null;
        }
      } else if (data.openRouterKey.trim() === '') {
        // User cleared the key
        updateData.openRouterKey = null;
      } else {
        // User entered a new key, encrypt it
        updateData.openRouterKey = encrypt(data.openRouterKey.trim(), this.encryptionKey);
      }
    }

    let result;
    if (existing) {
      result = await this.prisma.aiSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      result = await this.prisma.aiSettings.create({
        data: {
          ...updateData,
          defaultModel: updateData.defaultModel || 'deepseek/deepseek-v4-flash:free',
          fallbackModel: updateData.fallbackModel || 'arcee-ai/trinity-large-thinking:free',
          isFallbackEnabled: updateData.isFallbackEnabled ?? true,
          temperature: updateData.temperature ?? 0.1,
          maxTokens: updateData.maxTokens ?? 2048,
          bypassSignature: updateData.bypassSignature ?? true,
        },
      });
    }

    // Return settings with masked key for security
    const response = { ...result };
    if (result.openRouterKey) {
      response.openRouterKey = this.maskedPlaceholder;
    } else {
      response.openRouterKey = '';
    }
    
    return response;
  }

  /**
   * Tests the connection with OpenRouter using either the provided key or the saved key.
   */
  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string }> {
    let keyToTest = apiKey;

    if (!keyToTest || keyToTest === this.maskedPlaceholder) {
      const savedSettings = await this.getSettings(true);
      keyToTest = savedSettings.openRouterKey || undefined;
    }

    if (!keyToTest || keyToTest.trim() === '') {
      throw new BadRequestException('No OpenRouter API key provided or saved');
    }

    try {
      this.logger.log('Testing OpenRouter connection status...');
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${keyToTest.trim()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenRouter connection test failed with status ${response.status}: ${errorText}`);
        return {
          success: false,
          message: `Authentication failed (Status ${response.status}): Key is invalid or expired.`,
        };
      }

      const result = await response.json();
      return {
        success: true,
        message: `Success! Connection verified. Key is active. (Limit: $${result.data?.limit ?? 'unlimited'})`,
      };
    } catch (error) {
      this.logger.error(`OpenRouter connection test encountered network error: ${error.message}`);
      return {
        success: false,
        message: `Connection error: Unable to contact OpenRouter API. ${error.message}`,
      };
    }
  }
}
