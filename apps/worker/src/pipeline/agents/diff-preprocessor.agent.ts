import { Injectable, Logger } from '@nestjs/common';
import { ScrubberService } from '../../github/services/scrubber.service';
import { filterAndTruncateDiff } from '../../github/utils/diff-filter';

@Injectable()
export class DiffPreprocessorAgent {
  private readonly logger = new Logger(DiffPreprocessorAgent.name);

  constructor(private readonly scrubber: ScrubberService) {}

  process(diffContent: string) {
    const { filteredDiff, skippedCount } = filterAndTruncateDiff(diffContent);

    if (skippedCount > 0) {
      this.logger.log(
        `Skipped ${skippedCount} file(s) from AI audit based on exclusions/size limits.`,
      );
    }

    const cleanDiff = this.scrubber.scrub(filteredDiff);

    return { cleanDiff, skippedCount };
  }
}
