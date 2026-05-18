export interface Stats {
  totalPrs: number;
  activeRepositories: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  totalTokens: number;
  totalCost: number;
  dailyTimeline?: { date: string; tokens: number; cost: number }[];
}

export interface AnalysisJob {
  id: string;
  status: string;
  step: string | null;
  error?: string | null;
  createdAt: string;
}

export interface PRRecord {
  id: string;
  number: number;
  title: string;
  state: string;
  authorHandle: string;
  htmlUrl: string;
  repositoryName: string;
  reviewStatus: string; // PENDING, PROCESSING, COMPLETED, FAILED
  severityScore: number | null;
  branchName: string;
  commitMessage: string;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ReviewComment {
  id: string;
  filePath: string;
  lineNumber: number;
  content: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'SECURITY' | 'PERFORMANCE' | 'STYLE';
  suggestion: string | null;
}

export interface UsageLog {
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cost: number;
  actionDescription?: string;
}

export interface Review {
  id: string;
  summary: string;
  severityScore: number;
  comments: ReviewComment[];
  usageLogs: UsageLog[];
  branchName?: string;
  commitMessage?: string;
  gitDiff?: string | null;
}

export interface PRDetails {
  id: string;
  number: number;
  title: string;
  state: string;
  authorHandle: string;
  htmlUrl: string;
  repository: {
    fullName: string;
    name: string;
  };
  reviews: Review[];
  jobs?: AnalysisJob[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  tier: 'free' | 'paid';
  contextLength: string;
}

export interface LogRecord {
  id: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cost: number;
  createdAt: string;
  repositoryName: string;
  prTitle: string;
  prNumber: number;
  actionDescription?: string;
}

export interface UsageSummary {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  averageLatencyMs: number;
  totalRequests: number;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  isActive: boolean;
}

export interface RepositoryRule {
  id: string;
  repositoryId: string;
  name: string;
  description: string | null;
  pattern: string | null;
  type: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
