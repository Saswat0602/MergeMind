export enum ReviewStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum Severity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface AiReviewComment {
  filePath: string;
  lineNumber: number;
  content: string;
  severity: Severity;
  type: string;
  suggestion?: string;
  diffHunk?: string;
}

export interface AiReviewResult {
  summary: string;
  severityScore: number;
  comments: AiReviewComment[];
}

export interface WebhookPayload {
  action: string;
  pull_request: {
    id: number;
    number: number;
    title: string;
    user: {
      login: string;
    };
    base: {
      ref: string;
    };
    head: {
      ref: string;
      sha: string;
    };
    html_url: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      id: number;
      login: string;
    };
  };
}
