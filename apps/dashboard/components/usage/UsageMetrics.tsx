import { UsageSummary } from '../../types';

interface UsageMetricsProps {
  summary: UsageSummary | null;
}

interface MetricCardProps {
  label: string;
  value: string;
  meta?: string;
  accent?: string;
  extra?: React.ReactNode;
}

function MetricCard({ label, value, meta, extra }: MetricCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {extra && extra}
      {meta && <div className="stat-meta">{meta}</div>}
    </div>
  );
}

export function UsageMetrics({ summary }: UsageMetricsProps) {
  if (!summary) return null;

  const promptPct = Math.round((summary.promptTokens / (summary.totalTokens || 1)) * 100);
  const completionPct = 100 - promptPct;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 14,
    }}>
      <MetricCard
        label="Total Accrued Cost"
        value={`$${summary.totalCost.toFixed(5)}`}
        meta="Live OpenRouter meter"
      />
      <MetricCard
        label="Tokens Consumed"
        value={summary.totalTokens.toLocaleString()}
        extra={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
              height: 4, borderRadius: 2, background: 'var(--border-soft)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${promptPct}%`,
                background: 'var(--accent)', borderRadius: 2,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>{promptPct}% prompt</span>
              <span>{completionPct}% completion</span>
            </div>
          </div>
        }
      />
      <MetricCard
        label="AI Reviews Triggered"
        value={String(summary.totalRequests)}
        meta="Jobs processed async"
      />
      <MetricCard
        label="Avg LLM Latency"
        value={`${(summary.averageLatencyMs / 1000).toFixed(2)}s`}
        meta="Streaming response time"
      />
    </div>
  );
}
