import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  constructor(private readonly configService: ConfigService) {}

  async analyzeDiff(
    prTitle: string,
    prDescription: string,
    diffContent: string,
  ): Promise<{ response: AiReviewResponse; promptTokens: number; completionTokens: number; latencyMs: number; modelUsed: string }> {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set in environment');
    }

    const primaryModel = this.configService.get<string>('AI_MODEL') || 'deepseek/deepseek-v4-flash:free';
    const fallbackModel = 'arcee-ai/trinity-large-thinking:free';

    const systemPrompt = `You are a professional, senior software engineer and security auditor.
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
- "suggestion": (Optional) Direct drop-in code fix block for this line.

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

    const userPrompt = `PR Title: ${prTitle}
PR Description: ${prDescription || 'No description provided.'}

Raw Diff:
\`\`\`diff
${diffContent}
\`\`\`

Analyze the diff and return the JSON review report.`;

    const startTime = Date.now();
    let modelUsed = primaryModel;
    let responseData: any;
    let responseText = '';

    try {
      this.logger.log(`Attempting AI analysis with primary model: ${primaryModel}`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://mergemind.dev',
          'X-Title': 'MergeMind',
        },
        body: JSON.stringify({
          model: primaryModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      responseData = await response.json();
      responseText = responseData.choices[0]?.message?.content || '';
    } catch (primaryError) {
      this.logger.warn(`Primary model ${primaryModel} failed: ${primaryError.message}. Retrying with fallback: ${fallbackModel}`);
      modelUsed = fallbackModel;

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://mergemind.dev',
            'X-Title': 'MergeMind',
          },
          body: JSON.stringify({
            model: fallbackModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Status ${response.status}: ${errorText}`);
        }

        responseData = await response.json();
        responseText = responseData.choices[0]?.message?.content || '';
      } catch (fallbackError) {
        this.logger.error(`AI Analysis failed completely for both primary and fallback models. Fallback error: ${fallbackError.message}`);
        throw new Error(`AI Analysis failed: Primary (${primaryModel}) error: ${primaryError.message} | Fallback (${fallbackModel}) error: ${fallbackError.message}`);
      }
    }

    const latencyMs = Date.now() - startTime;
    const parsedJson = this.parseJsonResilient(responseText);

    return {
      response: parsedJson,
      promptTokens: responseData.usage?.prompt_tokens || 0,
      completionTokens: responseData.usage?.completion_tokens || 0,
      latencyMs,
      modelUsed,
    };
  }

  private parseJsonResilient(text: string): AiReviewResponse {
    let cleanText = text.trim();

    // Extract JSON block if LLM wrapped it in markdown code blocks
    if (cleanText.includes('```')) {
      const match = cleanText.match(/```(?:json)?([\s\S]*?)```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      }
    }

    try {
      return JSON.parse(cleanText) as AiReviewResponse;
    } catch (error) {
      this.logger.error(`Failed to parse AI JSON response. Raw text: ${text}`);
      throw new Error(`AI returned malformed JSON: ${error.message}`);
    }
  }
}
