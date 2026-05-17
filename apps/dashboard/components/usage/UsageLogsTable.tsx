import { LogRecord } from '../../types';

interface UsageLogsTableProps {
  logs: LogRecord[];
}

export function UsageLogsTable({ logs }: UsageLogsTableProps) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Execution Logs
        </h2>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
          Per-request AI token and cost breakdown
        </p>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 16 }}>Trigger / Context</th>
              <th>Model</th>
              <th style={{ textAlign: 'right' }}>Tokens</th>
              <th style={{ textAlign: 'right' }}>Latency</th>
              <th style={{ textAlign: 'right' }}>Cost</th>
              <th style={{ textAlign: 'right', paddingRight: 16 }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}
                >
                  No logs yet. Push a commit or open a PR to start.
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const contextLabel =
                  log.prNumber < 0
                    ? 'Branch Push'
                    : log.prNumber === 0
                      ? (log.actionDescription?.includes('Handshake') ? 'Self-Test' : 'System Log')
                      : `PR #${log.prNumber}`;

                return (
                  <tr key={log.id}>
                    <td style={{ paddingLeft: 16, maxWidth: 280 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.prTitle}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
                        {log.repositoryName} · {contextLabel}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 11,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 4, padding: '2px 7px',
                        color: '#c084fc',
                      }}>
                        {log.modelName}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{log.totalTokens.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        P:{log.promptTokens.toLocaleString()} C:{log.completionTokens.toLocaleString()}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {((log.latencyMs || 0) / 1000).toFixed(2)}s
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: '#34d399', fontWeight: 600 }}>
                      ${log.cost.toFixed(5)}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 16, fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
