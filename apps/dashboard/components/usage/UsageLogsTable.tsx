import { LogRecord } from '../../types';

interface UsageLogsTableProps {
  logs: LogRecord[];
}

export function UsageLogsTable({ logs }: UsageLogsTableProps) {
  return (
    <div className="rounded-2xl bg-slate-950/20 border border-white/5 overflow-hidden backdrop-blur-xl">
      <div className="border-b border-white/5 px-6 py-4 bg-slate-950/30 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Execution Logs</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/10 text-xs font-semibold uppercase tracking-wider text-indigo-200/40">
              <th className="px-6 py-4">Trigger / Context</th>
              <th className="px-6 py-4">Model Used</th>
              <th className="px-6 py-4 text-right">Tokens Used</th>
              <th className="px-6 py-4 text-right">Latency</th>
              <th className="px-6 py-4 text-right">Accrued Cost</th>
              <th className="px-6 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-indigo-200/30">
                  No AI usage logs recorded yet. Push a commit or create a PR to start analyzing!
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors duration-200">
                  <td className="px-6 py-4 max-w-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">{log.prTitle}</span>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-200/40 font-mono">
                        <span className="text-indigo-400/80 font-medium">{log.repositoryName}</span>
                        <span>•</span>
                        <span>
                          {log.prNumber < 0 
                            ? 'Branch Push' 
                            : log.prNumber === 0 
                              ? (log.actionDescription?.includes('Handshake') ? 'Self-Test' : 'System Log') 
                              : `PR #${log.prNumber}`}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 text-xs bg-slate-900 border border-slate-800 rounded font-mono text-purple-300">
                      {log.modelName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-white">{log.totalTokens.toLocaleString()}</span>
                      <span className="text-[10px] text-indigo-200/30">
                        P: {log.promptTokens.toLocaleString()} | C: {log.completionTokens.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-indigo-200/60">
                    {((log.latencyMs || 0) / 1000).toFixed(2)}s
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-green-400 font-semibold">
                    ${log.cost.toFixed(5)}
                  </td>
                  <td className="px-6 py-4 text-right text-indigo-200/40 text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
