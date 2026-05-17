import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mergemind/database';
import { decrypt } from '../../settings/utils/crypto';
import { ScrubberService } from './scrubber.service';

export interface AiReviewComment {
  filePath: string;
  lineNumber: number;
  content: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'SECURITY' | 'PERFORMANCE' | 'STYLE';
  suggestion?: string;
}

export interface AiReviewResponse {
  summary: string;
  severityScore: number; // 0 to 100
  comments: AiReviewComment[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly scrubber: ScrubberService,
  ) {}

  async analyzeDiff(
    prTitle: string,
    prDescription: string,
    diffContent: string,
    actionDescription = 'Pull Request Review Audit',
  ): Promise<{
    response: AiReviewResponse;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    modelUsed: string;
    logIds: string[];
  }> {
    const dbSettings = await this.prisma.aiSettings.findFirst();
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    let apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    let primaryModel = this.configService.get<string>('AI_MODEL') || 'deepseek/deepseek-v4-flash:free';
    let fallbackModel = 'arcee-ai/trinity-large-thinking:free';
    let isFallbackEnabled = true;
    let isConsensusEnabled = false;
    let temperature = 0.1;
    let maxTokens = 30000;

    const jsonFormatInstructions = `

You MUST respond strictly in valid JSON format matching the following TypeScript interface:
{
  "summary": string,
  "severityScore": number,
  "comments": Array<{
    "filePath": string,
    "lineNumber": number,
    "content": string,
    "severity": "HIGH" | "MEDIUM" | "LOW",
    "type": "SECURITY" | "PERFORMANCE" | "STYLE",
    "suggestion"?: string
  }>
}

Crucial rules:
1. ONLY comment on lines that were actually added or modified in the diff (marked with +). Never comment on unmodified lines.
2. If there are no issues, keep the "comments" array empty. Do not invent minor or nitpicky style rules just to fill it.
3. Ensure the JSON is completely valid and escaped properly.`;

    let systemPrompt = `You are a professional, senior software engineer and security auditor.
Your job is to review a Git Pull Request diff and provide:
1. A concise, one-sentence or two-sentence summary of what the PR accomplishes.
2. A severity score from 0 (perfect, no issues) to 100 (critical vulnerabilities found, e.g. SQL injection, leaked secrets).
3. A list of constructive review comments focused on:
   - **SECURITY**: Exposed secrets/keys, SQL injections, lack of input validation, XSS, insecure deserialization, etc.
   - **PERFORMANCE**: N+1 queries, heavy loops, missing indexes, blocking synchronous calls.
   - **STYLE**: Dead code, massive functions, duplicate logic, very bad naming.

For each issue, specify:
- "filePath": Exact file path.
- "lineNumber": The line number in the new file where the issue occurs (must be a line modified or added in the diff!).
- "content": Clear description of why this is an issue and how to fix it.
- "severity": "HIGH", "MEDIUM", or "LOW".
- "type": "SECURITY", "PERFORMANCE", or "STYLE".
- "suggestion": (Optional) Direct drop-in code fix block for this line.${jsonFormatInstructions}`;

    if (dbSettings) {
      if (dbSettings.openRouterKey) {
        try {
          apiKey = decrypt(dbSettings.openRouterKey, encryptionKey || '');
        } catch (decryptError) {
          this.logger.error(`Failed to decrypt OpenRouter API Key from DB settings: ${decryptError.message}. Falling back to env key.`);
        }
      }
      primaryModel = dbSettings.defaultModel || primaryModel;
      fallbackModel = dbSettings.fallbackModel || fallbackModel;
      isFallbackEnabled = dbSettings.isFallbackEnabled;
      isConsensusEnabled = dbSettings.isConsensusEnabled;
      temperature = dbSettings.temperature ?? temperature;
      maxTokens = dbSettings.maxTokens ?? maxTokens;
      
      if (dbSettings.systemPrompt && dbSettings.systemPrompt.trim() !== '') {
        systemPrompt = `${dbSettings.systemPrompt.trim()}${jsonFormatInstructions}`;
      }
    }

    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured in settings or environment.');
    }

    // 🔒 Phase 3: Scrub sensitive secrets/keys from Git Diff before sending to the LLM
    const cleanDiff = this.scrubber.scrub(diffContent);

    const userPrompt = `PR Title: ${prTitle}
PR Description: ${prDescription || 'No description provided.'}

Raw Diff:
\`\`\`diff
${cleanDiff}
\`\`\`

Analyze the diff and return the JSON review report.`;

    // 📊 Phase 4: Concurrent Dual-Model Consensus Auditing
    if (isConsensusEnabled) {
      this.logger.log(`Consensus Peer-Review active. Dispatching concurrent audits: ${primaryModel} + ${fallbackModel}`);
      const logIds: string[] = [];

      try {
        const [res1, res2] = await Promise.all([
          this.executeLlmCall(apiKey, primaryModel, systemPrompt, userPrompt, temperature, maxTokens, `${actionDescription} (Consensus Primary)`),
          this.executeLlmCall(apiKey, fallbackModel, systemPrompt, userPrompt, temperature, maxTokens, `${actionDescription} (Consensus Peer)`),
        ]);

        logIds.push(res1.logId, res2.logId);
        const mergedResponse = this.mergeConsensusResponses(res1.response, res2.response);

        return {
          response: mergedResponse,
          promptTokens: res1.promptTokens + res2.promptTokens,
          completionTokens: res1.completionTokens + res2.completionTokens,
          latencyMs: Math.max(res1.latencyMs, res2.latencyMs),
          modelUsed: `${primaryModel} + ${fallbackModel}`,
          logIds,
        };
      } catch (err) {
        this.logger.warn(`Consensus parallel pipeline failed or model timed out: ${err.message}. Gracefully falling back to single model.`);
      }
    }

    // Single Model Mode (or graceful fallback)
    try {
      const result = await this.executeLlmCall(
        apiKey,
        primaryModel,
        systemPrompt,
        userPrompt,
        temperature,
        maxTokens,
        actionDescription,
      );

      return {
        response: result.response,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        latencyMs: result.latencyMs,
        modelUsed: result.modelUsed,
        logIds: [result.logId],
      };
    } catch (primaryError) {
      if (!isFallbackEnabled) {
        this.logger.error(`AI Analysis failed for primary model ${primaryModel} and fallback model is disabled: ${primaryError.message}`);
        throw new Error(`AI Analysis failed: Primary (${primaryModel}) error: ${primaryError.message}`);
      }

      this.logger.warn(`Primary model ${primaryModel} failed: ${primaryError.message}. Retrying with fallback: ${fallbackModel}`);

      try {
        const result = await this.executeLlmCall(
          apiKey,
          fallbackModel,
          systemPrompt,
          userPrompt,
          temperature,
          maxTokens,
          `${actionDescription} (Fallback Mode)`,
        );

        return {
          response: result.response,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          latencyMs: result.latencyMs,
          modelUsed: result.modelUsed,
          logIds: [result.logId],
        };
      } catch (fallbackError) {
        this.logger.error(`AI Analysis failed completely for both primary and fallback models. Fallback error: ${fallbackError.message}`);
        throw new Error(`AI Analysis failed: Primary (${primaryModel}) error: ${primaryError.message} | Fallback (${fallbackModel}) error: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Helper function executing a single LLM chat completion query and persisting its usage metrics (Phase 2).
   */
  private async executeLlmCall(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number,
    actionDescription: string,
  ): Promise<{ response: AiReviewResponse; promptTokens: number; completionTokens: number; latencyMs: number; modelUsed: string; logId: string }> {
    const startTime = Date.now();
    this.logger.log(`Attempting AI connection for: ${model} [${actionDescription}]`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://mergemind.dev',
        'X-Title': 'MergeMind',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    const responseText = responseData.choices[0]?.message?.content || responseData.choices[0]?.message?.reasoning || '';
    const latencyMs = Date.now() - startTime;

    const promptTokens = responseData.usage?.prompt_tokens || 0;
    const completionTokens = responseData.usage?.completion_tokens || 0;
    
    // Cost estimation: $0.15/1M prompt, $0.60/1M completion tokens
    const cost = (promptTokens * 0.15 + completionTokens * 0.60) / 1000000;
    const parsedJson = this.parseJsonResilient(responseText);

    // 📊 Phase 2: Storing the log details inside database on every single model invocation
    const log = await this.prisma.aiUsageLog.create({
      data: {
        modelName: model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        latencyMs,
        cost,
        actionDescription,
      },
    });

    return {
      response: parsedJson,
      promptTokens,
      completionTokens,
      latencyMs,
      modelUsed: model,
      logId: log.id,
    };
  }

  /**
   * Merges two parallel review findings into a single unified report, avoiding duplication.
   */
  private mergeConsensusResponses(
    res1: AiReviewResponse,
    res2: AiReviewResponse,
  ): AiReviewResponse {
    const mergedSummary = `${res1.summary} | Peer Consensus Audit: ${res2.summary}`;
    const mergedSeverity = Math.round((res1.severityScore + res2.severityScore) / 2);
    const mergedComments: AiReviewComment[] = [...res1.comments];

    for (const comment2 of res2.comments) {
      const existing = mergedComments.find(
        c => c.filePath === comment2.filePath && c.lineNumber === comment2.lineNumber
      );

      if (existing) {
        existing.content = `${existing.content}\n\n🔍 Peer consensus consensus check: ${comment2.content}`;
        if (comment2.severity === 'HIGH') {
          existing.severity = 'HIGH';
        } else if (comment2.severity === 'MEDIUM' && existing.severity !== 'HIGH') {
          existing.severity = 'MEDIUM';
        }
      } else {
        mergedComments.push(comment2);
      }
    }

    return {
      summary: mergedSummary,
      severityScore: mergedSeverity,
      comments: mergedComments,
    };
  }

  private parseJsonResilient(text: string): AiReviewResponse {
    let cleanText = text.trim();

    if (cleanText.includes('```')) {
      const match = cleanText.match(/```(?:json)?([\s\S]*?)```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      }
    }

    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleanText) as AiReviewResponse;
    } catch (error) {
      this.logger.error(`Failed to parse AI JSON response. Raw text: ${text}`);
      throw new Error(`AI returned malformed JSON: ${error.message}`);
    }
  }
}
