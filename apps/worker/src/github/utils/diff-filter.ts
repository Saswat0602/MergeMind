import { REVIEW_EXCLUSIONS } from '../constants/review.constants';
import { Logger } from '@nestjs/common';

const logger = new Logger('DiffFilter');

export function getFilePathFromDiffBlock(block: string): string {
  const lines = block.split('\n');
  const firstLine = lines[0] || '';

  const gitMatch = firstLine.match(/^diff --git a\/(.+) b\/(.+)$/);
  if (gitMatch && gitMatch[2]) {
    return gitMatch[2];
  }

  for (const line of lines) {
    if (line.startsWith('rename to ')) {
      return line.substring(10).trim();
    }
    if (line.startsWith('+++ b/')) {
      return line.substring(6).trim();
    }
  }

  return '';
}

export function chunkDiff(diffContent: string): {
  chunks: string[];
  skippedCount: number;
  skippedSummary: string[];
} {
  if (!diffContent || diffContent.trim().length === 0) {
    return { chunks: [], skippedCount: 0, skippedSummary: [] };
  }

  const fileBlocks = diffContent.split(/(?=^diff --git )/m);
  const acceptedBlocks: string[] = [];
  const skippedSummary: string[] = [];
  let skippedCount = 0;

  for (const block of fileBlocks) {
    if (!block.trim()) continue;

    const filePath = getFilePathFromDiffBlock(block);
    if (!filePath) {
      acceptedBlocks.push(block);
      continue;
    }

    const filename = filePath.split('/').pop() || '';
    const dotIndex = filename.lastIndexOf('.');
    const fileExtension =
      dotIndex !== -1 ? filename.substring(dotIndex).toLowerCase() : '';

    const isExcluded = REVIEW_EXCLUSIONS.EXCLUDED_EXTENSIONS.some(
      (ext) =>
        (ext.startsWith('.') && fileExtension === ext.toLowerCase()) ||
        filename.toLowerCase() === ext.toLowerCase() ||
        filePath.toLowerCase().endsWith(ext.toLowerCase()),
    );

    if (isExcluded) {
      skippedCount++;
      skippedSummary.push(`${filePath} (excluded file type/lockfile)`);
      logger.log(`Skipping file from review (excluded type): ${filePath}`);
      continue;
    }

    const blockLines = block.split('\n');
    if (blockLines.length > REVIEW_EXCLUSIONS.MAX_DIFF_LINE_COUNT) {
      skippedCount++;
      skippedSummary.push(
        `${filePath} (too large: ${blockLines.length} lines)`,
      );
      logger.warn(
        `Skipping file from review (too large - ${blockLines.length} lines): ${filePath}`,
      );
      continue;
    }

    acceptedBlocks.push(block);
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentChunkLength = 0;

  for (const block of acceptedBlocks) {
    if (
      currentChunkLength + block.length >
      REVIEW_EXCLUSIONS.MAX_TOTAL_DIFF_CHARACTERS
    ) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(''));
        currentChunk = [];
        currentChunkLength = 0;
      }
      
      // If a single file block is larger than the max (even after MAX_DIFF_LINE_COUNT check),
      // we have to omit it or it would break chunking.
      if (block.length > REVIEW_EXCLUSIONS.MAX_TOTAL_DIFF_CHARACTERS) {
        const filePath = getFilePathFromDiffBlock(block) || 'unknown file';
        skippedCount++;
        skippedSummary.push(`${filePath} (exceeds single chunk character limit)`);
        logger.warn(`Omitting file from review (exceeds single chunk char limit): ${filePath}`);
        continue;
      }
    }
    
    currentChunk.push(block);
    currentChunkLength += block.length;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(''));
  }

  return {
    chunks,
    skippedCount,
    skippedSummary,
  };
}
