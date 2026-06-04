import { Injectable, Logger } from '@nestjs/common';
import { SettingsResolverAgent } from './agents/settings-resolver.agent';
import { PromptBuilderAgent } from './agents/prompt-builder.agent';
import { DiffPreprocessorAgent } from './agents/diff-preprocessor.agent';
import { LlmCallerAgent } from './agents/llm-caller.agent';
import { ResponseParserAgent } from './agents/response-parser.agent';
import { SeverityScorerAgent } from './agents/severity-scorer.agent';
import { ReviewPersisterAgent } from './agents/review-persister.agent';

@Injectable()
export class AiPipelineService {
  private readonly logger = new Logger(AiPipelineService.name);

  constructor(
    private readonly settingsResolver: SettingsResolverAgent,
    private readonly promptBuilder: PromptBuilderAgent,
    private readonly diffPreprocessor: DiffPreprocessorAgent,
    private readonly llmCaller: LlmCallerAgent,
    private readonly responseParser: ResponseParserAgent,
    private readonly severityScorer: SeverityScorerAgent,
    private readonly reviewPersister: ReviewPersisterAgent,
  ) {}

  async analyzeAndPersist(context: {
    pullRequestId: string;
    prTitle: string;
    prDescription: string;
    diffContent: string;
    actionDescription: string;
    isPushEvent: boolean;
    headSha: string;
    commitMessage?: string;
    branchName?: string;
    repositoryId: string;
    analysisJobId: string;
    rules?: any[];
  }) {
    this.logger.log(`Starting AI Pipeline for Job ${context.analysisJobId}`);

    // Step 1: Resolve Settings
    const settings = await this.settingsResolver.resolve();

    // Step 2: Preprocess Diff
    const { cleanChunks } = this.diffPreprocessor.process(context.diffContent);
    if (!cleanChunks || cleanChunks.length === 0) {
      this.logger.warn(
        `Diff preprocessor yielded empty diff for Job ${context.analysisJobId}`,
      );
      return { success: true, empty: true };
    }

    const allComments: any[] = [];
    let maxSeverityScore = 0;
    let combinedSummary = '';
    const aggregateUsage = {
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: 0,
      modelUsed: '',
      logIds: [] as string[],
    };

    let chunkIndex = 1;
    for (const chunk of cleanChunks) {
      this.logger.log(
        `Processing Chunk ${chunkIndex}/${cleanChunks.length} for Job ${context.analysisJobId}`,
      );

      // Step 3: Build Prompt
      const { systemPrompt, userPrompt } = this.promptBuilder.build({
        settings,
        prTitle: context.prTitle,
        prDescription: context.prDescription,
        cleanDiff: chunk,
        rules: context.rules,
      });

      // Step 4: Call LLM
      const llmResult = await this.llmCaller.execute({
        settings,
        systemPrompt,
        userPrompt,
      });

      // Step 5: Parse JSON (with Self-Correction ReAct loop support)
      const parsedResponse = await this.responseParser.parse(
        llmResult.isConsensus
          ? (llmResult as any).responses
          : (llmResult as any).responseText,
        {
          settings,
          systemPrompt,
          userPrompt,
        },
      );

      // Step 6: Score and Filter
      const finalResponse = this.severityScorer.scoreAndFilter({
        response: parsedResponse,
        isPushEvent: context.isPushEvent,
      });

      allComments.push(...finalResponse.comments);
      maxSeverityScore = Math.max(
        maxSeverityScore,
        finalResponse.severityScore ?? 0,
      );
      combinedSummary += `\n\n--- Chunk ${chunkIndex} Analysis ---\n${finalResponse.summary}`;

      aggregateUsage.promptTokens += llmResult.promptTokens;
      aggregateUsage.completionTokens += llmResult.completionTokens;
      aggregateUsage.latencyMs += llmResult.latencyMs;
      aggregateUsage.modelUsed = llmResult.modelUsed;
      aggregateUsage.logIds.push(...llmResult.logIds);

      chunkIndex++;
    }

    const aggregatedResponse = {
      summary: combinedSummary.trim(),
      severityScore: maxSeverityScore,
      comments: allComments,
    };

    // Step 7: Persist
    const reviewResultId = await this.reviewPersister.persist({
      response: aggregatedResponse,
      context,
      usage: aggregateUsage,
    });

    this.logger.log(
      `Completed AI Pipeline for Job ${context.analysisJobId}. Result ID: ${reviewResultId}`,
    );
    return { success: true, reviewResultId };
  }
}
