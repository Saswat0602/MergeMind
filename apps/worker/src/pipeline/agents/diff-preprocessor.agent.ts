import { Injectable, Logger } from '@nestjs/common';
import { ScrubberService } from '../../github/services/scrubber.service';
import { chunkDiff } from '../../github/utils/diff-filter';

@Injectable()
export class DiffPreprocessorAgent {
  private readonly logger = new Logger(DiffPreprocessorAgent.name);

  constructor(private readonly scrubber: ScrubberService) {}

  process(diffContent: string) {
    const { chunks, skippedCount } = chunkDiff(diffContent);

    if (skippedCount > 0) {
      this.logger.log(
        `Skipped ${skippedCount} file(s) from AI audit based on exclusions/size limits.`,
      );
    }

    const cleanChunks = chunks.map(chunk => this.scrubber.scrub(chunk));

    return { cleanChunks, skippedCount };
  }
}
