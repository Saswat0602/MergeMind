import { Injectable } from '@nestjs/common';
import { AiReviewComment, AiReviewResponse } from '../ai-models';

@Injectable()
export class SeverityScorerAgent {
  scoreAndFilter(params: { response: any; isPushEvent: boolean }) {
    const { response, isPushEvent } = params;

    let mergedResponse: AiReviewResponse;

    if (response.isConsensus) {
      mergedResponse = this.mergeConsensusResponses(
        response.responses[0],
        response.responses[1],
      );
    } else {
      mergedResponse = response as AiReviewResponse;
    }

    if (isPushEvent) {
      mergedResponse.comments = mergedResponse.comments.filter(
        (c) => c.severity !== 'LOW' && c.type !== 'STYLE',
      );
    }

    return mergedResponse;
  }

  private mergeConsensusResponses(
    res1: AiReviewResponse,
    res2: AiReviewResponse,
  ): AiReviewResponse {
    const mergedSummary = `${res1.summary} | Peer Consensus Audit: ${res2.summary}`;
    const mergedSeverity = Math.round(
      ((res1.severityScore ?? 0) + (res2.severityScore ?? 0)) / 2,
    );
    const mergedComments: AiReviewComment[] = [...res1.comments];

    for (const comment2 of res2.comments) {
      const existing = mergedComments.find(
        (c) =>
          c.filePath === comment2.filePath &&
          c.lineNumber === comment2.lineNumber,
      );

      if (existing) {
        existing.content = `${existing.content}\n\n🔍 Peer consensus check: ${comment2.content}`;
        if (comment2.severity === 'HIGH') {
          existing.severity = 'HIGH';
        } else if (
          comment2.severity === 'MEDIUM' &&
          existing.severity !== 'HIGH'
        ) {
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
}
