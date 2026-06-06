import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LlmCallerAgent {
  private readonly logger = new Logger(LlmCallerAgent.name);

  async execute(params: {
    settings: any;
    systemPrompt: string;
    userPrompt: string;
  }) {
    const { settings, systemPrompt, userPrompt } = params;

    // Consensus execution
    if (settings.isConsensusEnabled) {
      this.logger.log(
        `Dispatching concurrent audits: ${settings.primaryModel} + ${settings.fallbackModel}`,
      );
      const [pResult, pPeer] = await Promise.allSettled([
        this.executeSingleCall(
          settings.apiKey,
          settings.primaryModel,
          systemPrompt,
          userPrompt,
          settings.temperature,
          settings.maxTokens,
        ),
        this.executeSingleCall(
          settings.apiKey,
          settings.fallbackModel,
          systemPrompt,
          userPrompt,
          settings.temperature,
          settings.maxTokens,
        ),
      ]);

      const primarySuccess = pResult.status === 'fulfilled';
      const peerSuccess = pPeer.status === 'fulfilled';

      if (primarySuccess && peerSuccess) {
        const res1 = pResult.value;
        const res2 = pPeer.value;
        return {
          isConsensus: true,
          responses: [res1.responseText, res2.responseText],
          promptTokens: res1.promptTokens + res2.promptTokens,
          completionTokens: res1.completionTokens + res2.completionTokens,
          latencyMs: Math.max(res1.latencyMs, res2.latencyMs),
          modelUsed: `${settings.primaryModel} + ${settings.fallbackModel}`,
          logIds: [...res1.logIds, ...res2.logIds],
        };
      } else if (primarySuccess) {
        return pResult.value;
      } else if (peerSuccess) {
        return pPeer.value;
      } else {
        this.logger.error(`Primary LLM error: ${(pResult as PromiseRejectedResult).reason?.message || (pResult as PromiseRejectedResult).reason}`);
        this.logger.error(`Fallback LLM error: ${(pPeer as PromiseRejectedResult).reason?.message || (pPeer as PromiseRejectedResult).reason}`);
        throw new Error(`Both Consensus LLM calls failed.`);
      }
    }

    try {
      return await this.executeSingleCall(
        settings.apiKey,
        settings.primaryModel,
        systemPrompt,
        userPrompt,
        settings.temperature,
        settings.maxTokens,
      );
    } catch (err: any) {
      if (!settings.isFallbackEnabled) {
        throw new Error(
          `Primary LLM failed and fallback is disabled: ${err.message}`,
        );
      }
      this.logger.warn(
        `Primary LLM failed: ${err.message}. Retrying with fallback: ${settings.fallbackModel}`,
      );
      return await this.executeSingleCall(
        settings.apiKey,
        settings.fallbackModel,
        systemPrompt,
        userPrompt,
        settings.temperature,
        settings.maxTokens,
      );
    }
  }

  private async executeSingleCall(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number,
  ) {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes timeout

    let response;
    try {
      response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://mergemind.dev',
            'X-Title': 'MergeMind',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        },
      );
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after 5 minutes`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    const responseText =
      responseData.choices[0]?.message?.content ||
      responseData.choices[0]?.message?.reasoning ||
      '';
    const latencyMs = Date.now() - startTime;

    const promptTokens = responseData.usage?.prompt_tokens || 0;
    const completionTokens = responseData.usage?.completion_tokens || 0;

    // Cost estimation calculation goes here, ideally separated into another step,
    // but for the sake of the caller agent we just return metrics.

    // We return fake logIds here to be persisted later by the persister,
    // or we can persist here if we inject Prisma. Let's return raw metrics.
    // Wait, the original code persists usage logs per model execution.
    // For single responsibility, we can just return the raw metrics and let the Pipeline orchestrate it or do it in Persister.
    // For simplicity, we just return the raw data.
    return {
      isConsensus: false,
      responseText,
      promptTokens,
      completionTokens,
      latencyMs,
      modelUsed: model,
      logIds: [], // We'll let the pipeline or persister create the logs!
    };
  }
}
