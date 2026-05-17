interface DashboardHeaderProps {
  refreshing: boolean;
  onRefresh: () => void;
}

function IconRefresh({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      style={{ transition: 'transform 0.3s', animation: spinning ? 'spin 0.7s linear infinite' : 'none' }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.25 15.6M20 20v-5h-.581" />
    </svg>
  );
}

export function DashboardHeader({ refreshing, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1 className="page-title">PR Audit Dashboard</h1>
        <p className="page-subtitle">
          AI-powered code quality and security analysis for your pull requests
        </p>
      </div>
      <div style={{ flexShrink: 0 }}>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="btn btn-secondary"
        >
          <IconRefresh spinning={refreshing} />
          {refreshing ? 'Syncing…' : 'Sync'}
        </button>
      </div>
    </div>
  );
}
