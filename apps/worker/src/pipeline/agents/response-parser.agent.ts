import { Injectable, Logger } from '@nestjs/common';
import { AiReviewResponse } from '../ai-models';
import { LlmCallerAgent } from './llm-caller.agent';

@Injectable()
export class ResponseParserAgent {
  private readonly logger = new Logger(ResponseParserAgent.name);

  constructor(private readonly llmCaller: LlmCallerAgent) {}

  async parse(
    text: string | string[],
    contextForRetry?: {
      settings: any;
      systemPrompt: string;
      userPrompt: string;
    },
    retryCount = 0,
  ): Promise<AiReviewResponse> {
    if (Array.isArray(text)) {
      // Consensus mode: parse both and return an array of parsed
      const p1 = await this.parseSingle(text[0], contextForRetry, retryCount);
      const p2 = await this.parseSingle(text[1], contextForRetry, retryCount);
      return {
        isConsensus: true,
        responses: [p1, p2],
        summary: p1.summary, // placeholder, will be merged later
        severityScore: p1.severityScore,
        comments: p1.comments,
      } as any;
    }

    return this.parseSingle(text, contextForRetry, retryCount);
  }

  private async parseSingle(
    text: string,
    contextForRetry?: {
      settings: any;
      systemPrompt: string;
      userPrompt: string;
    },
    retryCount = 0,
  ): Promise<AiReviewResponse> {
    let cleanText = text.trim();

    if (cleanText.includes('```')) {
      const match = cleanText.match(/```(?:json)?([\s\S]*?)```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      }
    }

    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');

    let jsonCandidate = cleanText;
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonCandidate = cleanText.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonCandidate);
    } catch (firstError: any) {
      this.logger.warn(
        `JSON parsing failed on initial candidate. Attempting truncation repair. Error: ${firstError.message}`,
      );
      try {
        const lastCompleteObject = jsonCandidate.lastIndexOf('}');
        if (lastCompleteObject !== -1) {
          let truncated = jsonCandidate.substring(0, lastCompleteObject + 1);
          const openBraces = (truncated.match(/\{/g) || []).length;
          const closeBraces = (truncated.match(/\}/g) || []).length;
          const openBrackets = (truncated.match(/\[/g) || []).length;
          const closeBrackets = (truncated.match(/\]/g) || []).length;

          if (openBrackets > closeBrackets) truncated += ']';
          if (openBraces > closeBraces + 1)
            truncated += '}'.repeat(openBraces - closeBraces - 1);
          truncated += '}';

          parsed = JSON.parse(truncated);
        } else {
          throw new Error('No JSON object found to repair.');
        }
      } catch (repairError: any) {
        if (contextForRetry && retryCount < 2) {
          this.logger.warn(
            `Repair failed. Triggering Self-Correction ReAct Loop (Attempt ${retryCount + 1}/2)`,
          );

          const correctionPrompt = `
You previously returned a response that could not be parsed as valid JSON.
The JSON parser threw the following error: ${firstError.message}
The raw text you returned was:
\`\`\`
${text}
\`\`\`

Please FIX the syntax errors and return strictly valid JSON matching the schema. DO NOT wrap the output in markdown codeblocks. Return ONLY the raw JSON object.
          `;

          const llmResult = await this.llmCaller.execute({
            settings: contextForRetry.settings,
            systemPrompt: contextForRetry.systemPrompt,
            userPrompt: contextForRetry.userPrompt + '\n\n' + correctionPrompt,
          });

          return this.parseSingle(
            llmResult.isConsensus
              ? (llmResult as any).responses[0]
              : (llmResult as any).responseText,
            contextForRetry,
            retryCount + 1,
          );
        } else {
          throw new Error(
            `AI returned malformed JSON: ${firstError.message} (Repair failed: ${repairError.message})`,
          );
        }
      }
    }

    return this.sanitize(parsed);
  }

  private sanitize(res: any): AiReviewResponse {
    const sanitized: any = {
      summary:
        typeof res?.summary === 'string' ? res.summary : 'No summary provided.',
      severityScore:
        typeof res?.severityScore === 'number' ? res.severityScore : 0,
      comments: Array.isArray(res?.comments) ? res.comments : [],
    };

    sanitized.comments = sanitized.comments
      .filter((c: any) => c && typeof c === 'object')
      .map((c: any) => ({
        filePath: typeof c.filePath === 'string' ? c.filePath : 'unknown',
        lineNumber: typeof c.lineNumber === 'number' ? c.lineNumber : 1,
        content:
          typeof c.content === 'string'
            ? c.content
            : 'No comment content provided.',
        severity: ['HIGH', 'MEDIUM', 'LOW'].includes(c.severity)
          ? c.severity
          : 'LOW',
        type: ['SECURITY', 'PERFORMANCE', 'STYLE'].includes(c.type)
          ? c.type
          : 'STYLE',
        suggestion: typeof c.suggestion === 'string' ? c.suggestion : undefined,
      }));

    return sanitized;
  }
}
