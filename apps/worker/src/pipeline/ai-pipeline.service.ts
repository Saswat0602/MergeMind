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
    const { cleanDiff } = this.diffPreprocessor.process(context.diffContent);
    if (!cleanDiff || cleanDiff.trim() === '') {
      this.logger.warn(
        `Diff preprocessor yielded empty diff for Job ${context.analysisJobId}`,
      );
      return { success: true, empty: true };
    }

    // Step 3: Build Prompt
    const { systemPrompt, userPrompt } = this.promptBuilder.build({
      settings,
      prTitle: context.prTitle,
      prDescription: context.prDescription,
      cleanDiff,
      rules: context.rules,
    });

    // Step 4: Call LLM
    const llmResult = await this.llmCaller.execute({
      settings,
      systemPrompt,
      userPrompt,
      actionDescription: context.actionDescription,
    });

    // Step 5: Parse JSON
    const parsedResponse = this.responseParser.parse(
      llmResult.isConsensus
        ? (llmResult as any).responses
        : (llmResult as any).responseText,
    );

    // Step 6: Score and Filter
    const finalResponse = this.severityScorer.scoreAndFilter({
      response: parsedResponse,
      isPushEvent: context.isPushEvent,
    });

    // Step 7: Persist
    const reviewResultId = await this.reviewPersister.persist({
      response: finalResponse,
      context,
      usage: {
        promptTokens: llmResult.promptTokens,
        completionTokens: llmResult.completionTokens,
        latencyMs: llmResult.latencyMs,
        modelUsed: llmResult.modelUsed,
        logIds: llmResult.logIds,
      },
    });

    this.logger.log(
      `Completed AI Pipeline for Job ${context.analysisJobId}. Result ID: ${reviewResultId}`,
    );
    return { success: true, reviewResultId };
  }
}
