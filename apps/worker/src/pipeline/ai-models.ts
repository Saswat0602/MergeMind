export interface AiReviewComment {
  filePath: string;
  lineNumber: number;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  content: string;
  suggestion?: string;
}

export interface AiReviewResponse {
  summary: string;
  comments: AiReviewComment[];
  severityScore?: number;
}
