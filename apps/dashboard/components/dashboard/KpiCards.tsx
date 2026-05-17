import { Stats } from '../../types';

interface KpiCardsProps {
  stats: Stats | null;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  meta: string;
  accentColor: string;
  action?: React.ReactNode;
}

function KpiCard({ label, value, meta, accentColor, action }: KpiCardProps) {
  return (
    <div className="stat-card" style={{ borderLeft: `3px solid ${accentColor}` }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="stat-meta" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: accentColor, display: 'inline-block', flexShrink: 0,
          }} />
          {meta}
        </span>
        {action}
      </div>
    </div>
  );
}

import Link from 'next/link';

export function KpiCards({ stats }: KpiCardsProps) {
  if (!stats) return null;

  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 14,
    }}>
      <KpiCard
        label="PRs Audited"
        value={stats.totalPrs}
        meta={`${stats.activeRepositories} repos monitored`}
        accentColor="#6366f1"
      />
      <KpiCard
        label="Security Vulnerabilities"
        value={stats.highSeverityCount}
        meta="Critical threats found"
        accentColor="#ef4444"
      />
      <KpiCard
        label="Performance & Smells"
        value={stats.mediumSeverityCount + stats.lowSeverityCount}
        meta={`${stats.mediumSeverityCount} perf · ${stats.lowSeverityCount} style`}
        accentColor="#f59e0b"
      />
      <KpiCard
        label="Compute Cost"
        value={`$${stats.totalCost.toFixed(4)}`}
        meta={`${stats.totalTokens.toLocaleString()} tokens`}
        accentColor="#8b5cf6"
        action={
          <Link
            href="/usage"
            style={{ color: '#818cf8', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}
          >
            View logs →
          </Link>
        }
      />
    </section>
  );
}
