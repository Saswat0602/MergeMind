import { Module } from '@nestjs/common';
import { AiPipelineService } from './ai-pipeline.service';
import { SettingsResolverAgent } from './agents/settings-resolver.agent';
import { IntentRouterAgent } from './agents/intent-router.agent';
import { PromptBuilderAgent } from './agents/prompt-builder.agent';
import { DiffPreprocessorAgent } from './agents/diff-preprocessor.agent';
import { LlmCallerAgent } from './agents/llm-caller.agent';
import { ResponseParserAgent } from './agents/response-parser.agent';
import { SeverityScorerAgent } from './agents/severity-scorer.agent';
import { ReviewPersisterAgent } from './agents/review-persister.agent';
import { ScrubberService } from '../github/services/scrubber.service';
import { PrismaService } from '@mergemind/database';

@Module({
  providers: [
    AiPipelineService,
    SettingsResolverAgent,
    IntentRouterAgent,
    PromptBuilderAgent,
    DiffPreprocessorAgent,
    LlmCallerAgent,
    ResponseParserAgent,
    SeverityScorerAgent,
    ReviewPersisterAgent,
    ScrubberService,
    PrismaService,
  ],
  exports: [AiPipelineService],
})
export class PipelineModule {}
