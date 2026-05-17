import { LogRecord } from '../../types';

interface UsageLogsTableProps {
  logs: LogRecord[];
}

function formatDateTime(raw: string) {
  const d = new Date(raw);
  const day = d.getDate();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let h = d.getHours();
  const min = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;

  return {
    date: `${day} ${month} ${year}`,
    time: `${h}:${min} ${ampm}`,
  };
}

export function UsageLogsTable({ logs }: UsageLogsTableProps) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Execution Logs
        </h2>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
          Per-request AI token and cost breakdown
        </p>
      </div>

      {/* Desktop table */}
      <div className="usage-log-desktop" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: 18, width: 140 }}>Date &amp; Time</th>
              <th>Trigger / Context</th>
              <th>Model</th>
              <th style={{ textAlign: 'right' }}>Tokens</th>
              <th style={{ textAlign: 'right' }}>Latency</th>
              <th style={{ textAlign: 'right', paddingRight: 18 }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)', fontSize: 13,
                }}>
                  No logs yet. Push a commit or open a PR to get started.
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const dt = formatDateTime(log.createdAt);
                const contextLabel =
                  log.prNumber < 0
                    ? 'Branch Push'
                    : log.prNumber === 0
                      ? (log.actionDescription?.includes('Handshake') ? 'Self-Test' : 'System Log')
                      : `PR #${log.prNumber}`;

                return (
                  <tr key={log.id}>
                    {/* Date — 1st column */}
                    <td style={{ paddingLeft: 18, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {dt.date}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                        {dt.time}
                      </div>
                    </td>

                    {/* Trigger / context */}
                    <td style={{ maxWidth: 260 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {log.prTitle}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
                        {log.repositoryName}
                        {' · '}
                        <span className="badge badge-neutral" style={{ padding: '1px 6px', fontSize: 10 }}>
                          {contextLabel}
                        </span>
                      </div>
                    </td>

                    {/* Model pill */}
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 11,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 4, padding: '3px 8px',
                        color: '#c084fc', display: 'inline-block',
                        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                      }}>
                        {log.modelName}
                      </span>
                    </td>

                    {/* Tokens */}
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.totalTokens.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        P:{log.promptTokens.toLocaleString()} · C:{log.completionTokens.toLocaleString()}
                      </div>
                    </td>

                    {/* Latency */}
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {((log.latencyMs || 0) / 1000).toFixed(2)}s
                    </td>

                    {/* Cost */}
                    <td style={{ textAlign: 'right', paddingRight: 18, fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#34d399' }}>
                      ${log.cost.toFixed(5)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="usage-log-mobile">
        {logs.map(log => {
          const dt = formatDateTime(log.createdAt);
          const contextLabel =
            log.prNumber < 0 ? 'Branch Push'
            : log.prNumber === 0
              ? (log.actionDescription?.includes('Handshake') ? 'Self-Test' : 'System Log')
              : `PR #${log.prNumber}`;
          return (
            <div key={log.id} style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {/* Date + context */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{log.prTitle}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
                    {log.repositoryName} · {contextLabel}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{dt.date}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{dt.time}</div>
                </div>
              </div>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ fontFamily: 'monospace', color: '#c084fc', fontSize: 11 }}>{log.modelName}</span>
                <span>{log.totalTokens.toLocaleString()} tokens</span>
                <span>{((log.latencyMs || 0) / 1000).toFixed(2)}s</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>${log.cost.toFixed(5)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
