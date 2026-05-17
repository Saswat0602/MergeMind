import { Review, UsageLog } from '../../types';

interface ReviewSummaryProps {
  latestReview: Review | null;
  usageLogs: UsageLog[];
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score > 70 ? '#ef4444' :
    score > 30 ? '#f59e0b' :
    '#10b981';

  const label =
    score > 70 ? 'Critical — merge blocked' :
    score > 30 ? 'Moderate — review recommended' :
    'Clean — safe to merge';

  return (
    <div className="card" style={{ padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>
        Severity Score
      </div>
      {/* Score ring */}
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        border: `5px solid ${color}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `${color}12`,
      }}>
        <span style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>/ 100</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {label}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--border)',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function ReviewSummary({ latestReview, usageLogs }: ReviewSummaryProps) {
  if (!latestReview) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Score ring */}
      <ScoreRing score={latestReview.severityScore} />

      {/* AI Summary */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: 10 }}>
          AI Summary
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
          {latestReview.summary}
        </p>
      </div>

      {/* Usage metadata */}
      {usageLogs.length > 0 && (
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: 10 }}>
            Diagnostic Stats
          </div>
          {usageLogs.map((usage, idx) => (
            <div key={idx} style={{ marginBottom: idx < usageLogs.length - 1 ? 16 : 0 }}>
              {usage.actionDescription && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {usage.actionDescription}
                </div>
              )}
              <InfoRow label="Model" value={usage.modelName} />
              <InfoRow label="Latency" value={`${(usage.latencyMs / 1000).toFixed(2)}s`} />
              <InfoRow label="Tokens" value={usage.totalTokens.toLocaleString()} />
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', fontSize: 12,
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cost</span>
                <span style={{ color: '#34d399', fontFamily: 'monospace', fontWeight: 600 }}>
                  ${(usage.cost || 0).toFixed(4)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
