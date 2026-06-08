import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mergemind/database';
import { encrypt, decrypt } from './utils/crypto';
import Redis from 'ioredis';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly encryptionKey: string;
  private readonly maskedPlaceholder =
    'sk-or-v1-****************************************';
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    );
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '';
    if (!this.encryptionKey) {
      this.logger.error('ENCRYPTION_KEY environment variable is not defined!');
    }
  }

  async getProviders() {
    const { AiProvider } = await import('@prisma/client');
    return {
      success: true,
      data: Object.values(AiProvider)
    };
  }

  /**
   * Retrieves the AI settings record. If none exists, creates and returns a default one.
   * @param decrypted If true, returns the decrypted API key. Otherwise returns masked version.
   */
  async getSettings(decrypted = false) {
    const settingsStr = await this.redis.get('ai:settings:raw');
    let settings: import('@prisma/client').AiSettings | null = null;

    if (settingsStr) {
      settings = JSON.parse(settingsStr) as import('@prisma/client').AiSettings;
    } else {
      settings = await this.prisma.aiSettings.findFirst();

      if (!settings) {
        this.logger.log(
          'No AI settings found. Creating default configuration.',
        );
        settings = await this.prisma.aiSettings.create({
          data: {
            model: 'deepseek/deepseek-v4-flash:free',
            temperature: 0.1,
            maxTokens: 30000,
            bypassSignature: true,
          },
        });
      }

      await this.redis.set(
        'ai:settings:raw',
        JSON.stringify(settings),
        'EX',
        300,
      );
    }

    const response = { ...settings };
    
    const handleDecryptOrMask = (val: string | null) => {
      if (val) {
        return decrypted ? decrypt(val, this.encryptionKey) : this.maskedPlaceholder;
      }
      return '';
    };

    response.openRouterKey = handleDecryptOrMask(settings.openRouterKey);
    response.openaiKey = handleDecryptOrMask(settings.openaiKey);
    response.anthropicKey = handleDecryptOrMask(settings.anthropicKey);
    response.xaiKey = handleDecryptOrMask(settings.xaiKey);
    response.awsAccessKeyId = handleDecryptOrMask(settings.awsAccessKeyId);
    response.awsSecretAccessKey = handleDecryptOrMask(settings.awsSecretAccessKey);

    return response;
  }

  /**
   * Updates or inserts the AI settings.
   */
  async updateSettings(data: {
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
  }) {
    const existing = await this.prisma.aiSettings.findFirst();
    const updateData: any = { ...data };

    const handleEncryptOrKeep = (inputVal: string | undefined, existingVal: string | null | undefined) => {
      if (inputVal !== undefined) {
        if (inputVal === this.maskedPlaceholder) {
          return existingVal || null;
        } else if (inputVal.trim() === '') {
          return null;
        } else {
          return encrypt(inputVal.trim(), this.encryptionKey);
        }
      }
      return undefined;
    };

    updateData.openRouterKey = handleEncryptOrKeep(data.openRouterKey, existing?.openRouterKey);
    updateData.openaiKey = handleEncryptOrKeep(data.openaiKey, existing?.openaiKey);
    updateData.anthropicKey = handleEncryptOrKeep(data.anthropicKey, existing?.anthropicKey);
    updateData.xaiKey = handleEncryptOrKeep(data.xaiKey, existing?.xaiKey);
    updateData.awsAccessKeyId = handleEncryptOrKeep(data.awsAccessKeyId, existing?.awsAccessKeyId);
    updateData.awsSecretAccessKey = handleEncryptOrKeep(data.awsSecretAccessKey, existing?.awsSecretAccessKey);

    let result: import('@prisma/client').AiSettings;
    if (existing) {
      result = await this.prisma.aiSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      result = await this.prisma.aiSettings.create({
        data: {
          ...updateData,
          model: updateData.model || 'deepseek/deepseek-v4-flash:free',
          temperature: updateData.temperature ?? 0.1,
          maxTokens: updateData.maxTokens ?? 30000,
          bypassSignature: updateData.bypassSignature ?? true,
        },
      });
    }

    await this.redis.del('ai:settings:raw');

    // Return settings with masked key for security
    const response = { ...result } as any;
    const handleMask = (val: string | null) => val ? this.maskedPlaceholder : '';
    
    response.openRouterKey = handleMask(result.openRouterKey);
    response.openaiKey = handleMask(result.openaiKey);
    response.anthropicKey = handleMask(result.anthropicKey);
    response.xaiKey = handleMask(result.xaiKey);
    response.awsAccessKeyId = handleMask(result.awsAccessKeyId);
    response.awsSecretAccessKey = handleMask(result.awsSecretAccessKey);

    return response;
  }

  /**
   * Tests the connection with OpenRouter using either the provided key or the saved key.
   */
  async testConnection(
    apiKey?: string,
  ): Promise<{ success: boolean; message: string }> {
    let keyToTest = apiKey;

    if (!keyToTest || keyToTest === this.maskedPlaceholder) {
      const savedSettings = await this.getSettings(true);
      keyToTest = savedSettings.openRouterKey || undefined;
    }

    if (!keyToTest || keyToTest.trim() === '') {
      throw new BadRequestException('No OpenRouter API key provided or saved');
    }

    const startTime = Date.now();
    try {
      this.logger.log('Testing OpenRouter connection status...');
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${keyToTest.trim()}`,
        },
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `OpenRouter connection test failed with status ${response.status}: ${errorText}`,
        );

        await this.prisma.aiUsageLog.create({
          data: {
            modelName: 'OpenRouter API Key Handshake',
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            latencyMs,
            cost: 0,
            actionDescription: `API Key Connection Failed: Handshake status ${response.status}`,
          },
        });

        return {
          success: false,
          message: `Authentication failed (Status ${response.status}): Key is invalid or expired.`,
        };
      }

      const result = (await response.json()) as {
        data?: { limit?: string | number };
      };

      await this.prisma.aiUsageLog.create({
        data: {
          modelName: 'OpenRouter API Key Handshake',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs,
          cost: 0,
          actionDescription: `API Key Connection Success: Handshake completed (Limit: $${result.data?.limit ?? 'unlimited'})`,
        },
      });

      return {
        success: true,
        message: `Success! Connection verified. Key is active. (Limit: $${result.data?.limit ?? 'unlimited'})`,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.logger.error(
        `OpenRouter connection test encountered network error: ${error.message}`,
      );

      await this.prisma.aiUsageLog.create({
        data: {
          modelName: 'OpenRouter API Key Handshake',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs,
          cost: 0,
          actionDescription: `API Key Connection Error: ${error.message}`,
        },
      });

      return {
        success: false,
        message: `Connection error: Unable to contact OpenRouter API. ${error.message}`,
      };
    }
  }

  private readonly githubMasked = '********';

  /**
   * Retrieves the GitHub settings.
   * @param decrypted If true, returns decrypted secrets. Otherwise, returns masked placeholders.
   */
  async getGitHubSettings(decrypted = false) {
    const settingsStr = await this.redis.get('github:settings:raw');
    let settings: import('@prisma/client').GitHubSettings | null = null;

    if (settingsStr) {
      settings = JSON.parse(
        settingsStr,
      ) as import('@prisma/client').GitHubSettings;
    } else {
      settings = await this.prisma.gitHubSettings.findFirst();
      if (settings) {
        await this.redis.set(
          'github:settings:raw',
          JSON.stringify(settings),
          'EX',
          300,
        );
      }
    }

    if (!settings) {
      return {
        appId: '',
        privateKey: '',
        webhookSecret: '',
        clientId: '',
        clientSecret: '',
      };
    }

    const response = { ...settings };

    if (settings.privateKey) {
      response.privateKey = decrypted
        ? decrypt(settings.privateKey, this.encryptionKey)
        : this.githubMasked;
    } else {
      response.privateKey = '';
    }

    if (settings.webhookSecret) {
      response.webhookSecret = decrypted
        ? decrypt(settings.webhookSecret, this.encryptionKey)
        : this.githubMasked;
    } else {
      response.webhookSecret = '';
    }

    if (settings.clientSecret) {
      response.clientSecret = decrypted
        ? decrypt(settings.clientSecret, this.encryptionKey)
        : this.githubMasked;
    } else {
      response.clientSecret = '';
    }

    return response;
  }

  /**
   * Updates or inserts GitHub settings.
   */
  async updateGitHubSettings(data: {
    appId?: string;
    privateKey?: string;
    webhookSecret?: string;
    clientId?: string;
    clientSecret?: string;
  }) {
    const existing = await this.prisma.gitHubSettings.findFirst();
    const updateData: Omit<
      typeof data,
      'privateKey' | 'webhookSecret' | 'clientSecret'
    > & {
      privateKey?: string | null;
      webhookSecret?: string | null;
      clientSecret?: string | null;
    } = { ...data };

    // Encrypt sensitive secrets if they have changed and are not masked placeholders
    if (data.privateKey !== undefined) {
      if (data.privateKey === this.githubMasked) {
        updateData.privateKey = existing ? existing.privateKey : null;
      } else if (data.privateKey.trim() === '') {
        updateData.privateKey = null;
      } else {
        updateData.privateKey = encrypt(
          data.privateKey.trim(),
          this.encryptionKey,
        );
      }
    }

    if (data.webhookSecret !== undefined) {
      if (data.webhookSecret === this.githubMasked) {
        updateData.webhookSecret = existing ? existing.webhookSecret : null;
      } else if (data.webhookSecret.trim() === '') {
        updateData.webhookSecret = null;
      } else {
        updateData.webhookSecret = encrypt(
          data.webhookSecret.trim(),
          this.encryptionKey,
        );
      }
    }

    if (data.clientSecret !== undefined) {
      if (data.clientSecret === this.githubMasked) {
        updateData.clientSecret = existing ? existing.clientSecret : null;
      } else if (data.clientSecret.trim() === '') {
        updateData.clientSecret = null;
      } else {
        updateData.clientSecret = encrypt(
          data.clientSecret.trim(),
          this.encryptionKey,
        );
      }
    }

    let result: import('@prisma/client').GitHubSettings;
    if (existing) {
      result = await this.prisma.gitHubSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      result = await this.prisma.gitHubSettings.create({
        data: updateData,
      });
    }

    await this.redis.del('github:settings:raw');

    // Mask output before returning
    const response = { ...result };
    if (result.privateKey) response.privateKey = this.githubMasked;
    if (result.webhookSecret) response.webhookSecret = this.githubMasked;
    if (result.clientSecret) response.clientSecret = this.githubMasked;

    return response;
  }

  /**
   * Tests connection with GitHub using the provided App ID and Private Key (or loaded from DB).
   */
  async testGitHubConnection(
    appId?: string,
    privateKey?: string,
  ): Promise<{ success: boolean; message: string }> {
    let testAppId = appId;
    let testPrivateKey = privateKey;

    // Load from DB if masked or empty
    if (!testAppId || !testPrivateKey || testPrivateKey === this.githubMasked) {
      const saved = await this.getGitHubSettings(true);
      if (!testAppId) testAppId = saved.appId || undefined;
      if (!testPrivateKey || testPrivateKey === this.githubMasked)
        testPrivateKey = saved.privateKey || undefined;
    }

    if (
      !testAppId ||
      !testPrivateKey ||
      testAppId.trim() === '' ||
      testPrivateKey.trim() === ''
    ) {
      throw new BadRequestException(
        'GitHub App ID and Private Key are required to test connection',
      );
    }

    try {
      // Support base64 encoded private keys (common in production env vars)
      let cleanedKey = testPrivateKey;
      if (!cleanedKey.includes('-----BEGIN')) {
        try {
          cleanedKey = Buffer.from(cleanedKey, 'base64').toString('utf8');
        } catch {
          /* ignore */
        }
      }
      cleanedKey = cleanedKey.replace(/\\n/g, '\n');

      const { Octokit } = await import('@octokit/rest');
      const { createAppAuth } = await import('@octokit/auth-app');

      // Create a test Octokit client using App Authentication
      const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: parseInt(testAppId, 10),
          privateKey: cleanedKey,
        },
      });

      // Handshake with GitHub App endpoint
      const { data } = await octokit.rest.apps.getAuthenticated();

      const appName = data?.name || 'MergeMind';
      const ownerName = (data?.owner as { login?: string })?.login || 'Unknown';

      return {
        success: true,
        message: `Success! Handshake completed. MergeMind App authenticated with GitHub. (App Name: "${appName}", Owner: "${ownerName}")`,
      };
    } catch (error) {
      this.logger.error(`GitHub App connection test failed: ${error.message}`);
      return {
        success: false,
        message: `Authentication failed: GitHub rejected the Private Key signature. Error: ${error.message}`,
      };
    }
  }
}
