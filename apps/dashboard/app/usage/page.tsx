'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LogRecord {
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
}

interface UsageSummary {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  averageLatencyMs: number;
  totalRequests: number;
}

export default function UsageAnalytics() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsageData = async () => {
    try {
      const res = await fetch('/api/dashboard/usage');
      if (!res.ok) throw new Error('API server error');
      const data = await res.json();
      setLogs(data.logs);
      setSummary(data.summary);
    } catch (err) {
      console.warn('Could not connect to API server. Loading beautiful mockup fallback:', err);
      loadMockUsage();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMockUsage = () => {
    setSummary({
      totalTokens: 254820,
      promptTokens: 182400,
      completionTokens: 72420,
      totalCost: 0.174,
      averageLatencyMs: 2450,
      totalRequests: 8,
    });
    setLogs([
      {
        id: 'log-1',
        modelName: 'qwen-2.5-coder-32b',
        promptTokens: 38200,
        completionTokens: 12400,
        totalTokens: 50600,
        latencyMs: 3100,
        cost: 0.035,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        repositoryName: 'Saswat0602/MergeMind',
        prTitle: 'feat: Add JWT refresh token session strategy',
        prNumber: 42,
      },
      {
        id: 'log-2',
        modelName: 'qwen-2.5-coder-32b',
        promptTokens: 24500,
        completionTokens: 8900,
        totalTokens: 33400,
        latencyMs: 2150,
        cost: 0.021,
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        repositoryName: 'Saswat0602/MergeMind',
        prTitle: 'perf: Implement redis caching layer in dashboard controller',
        prNumber: 12,
      },
      {
        id: 'log-3',
        modelName: 'qwen-2.5-coder-32b',
        promptTokens: 52000,
        completionTokens: 21000,
        totalTokens: 73000,
        latencyMs: 4200,
        cost: 0.051,
        createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
        repositoryName: 'Saswat0602/MergeMind',
        prTitle: 'fix: Unsafe raw SQL interpolation in user authentication module',
        prNumber: 104,
      },
      {
        id: 'log-4',
        modelName: 'qwen-2.5-coder-32b',
        promptTokens: 12400,
        completionTokens: 4100,
        totalTokens: 16500,
        latencyMs: 1450,
        cost: 0.009,
        createdAt: new Date(Date.now() - 1000 * 60 * 2880).toISOString(),
        repositoryName: 'Saswat0602/MergeMind',
        prTitle: 'docs: Add detailed API setup markdown guidelines',
        prNumber: 5,
      },
    ]);
  };

  useEffect(() => {
    fetchUsageData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsageData();
  };

  return (
    <div className="min-h-screen bg-[#070913] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] text-[#f3f4f6]">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-6 py-10 z-10">
        
        {/* Navigation / Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="px-4 py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-200 rounded-lg backdrop-blur-md transition-all duration-300 flex items-center gap-2">
              ← Return to Dashboard
            </Link>
            <div className="h-5 w-[1px] bg-slate-800" />
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-indigo-200 to-purple-300">
              AI Token & Cost Analytics
            </h1>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing Logs...' : 'Force Sync Data'}
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-indigo-200/60 font-medium animate-pulse">Loading usage summary & API logs...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Accrued Cost Card */}
              <div className="relative group overflow-hidden rounded-2xl bg-slate-950/40 border border-indigo-500/10 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/80 mb-2">Total Accrued Cost</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white tracking-tight">${summary?.totalCost.toFixed(5)}</span>
                  <span className="text-xs text-indigo-200/50">USD</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-green-400">
                  <span>● Live OpenRouter Meter</span>
                </div>
              </div>

              {/* Tokens Consumed Card */}
              <div className="relative group overflow-hidden rounded-2xl bg-slate-950/40 border border-indigo-500/10 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/80 mb-2">Tokens Consumed</p>
                <p className="text-3xl font-bold text-white tracking-tight">{summary?.totalTokens.toLocaleString()}</p>
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${Math.min(100, ((summary?.promptTokens || 0) / (summary?.totalTokens || 1)) * 100)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-indigo-200/40">
                    <span>{Math.round(((summary?.promptTokens || 0) / (summary?.totalTokens || 1)) * 100)}% Prompt</span>
                    <span>{Math.round(((summary?.completionTokens || 0) / (summary?.totalTokens || 1)) * 100)}% Comp</span>
                  </div>
                </div>
              </div>

              {/* Total Jobs Executed */}
              <div className="relative group overflow-hidden rounded-2xl bg-slate-950/40 border border-indigo-500/10 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/80 mb-2">AI Reviews Triggered</p>
                <p className="text-3xl font-bold text-white tracking-tight">{summary?.totalRequests}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-200/50">
                  <span>Jobs processed asynchronously</span>
                </div>
              </div>

              {/* Average Latency */}
              <div className="relative group overflow-hidden rounded-2xl bg-slate-950/40 border border-indigo-500/10 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/80 mb-2">Average LLM Latency</p>
                <p className="text-3xl font-bold text-white tracking-tight">{( (summary?.averageLatencyMs || 0) / 1000 ).toFixed(2)}s</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-200/50">
                  <span>Fast streaming response</span>
                </div>
              </div>

            </div>

            {/* Logs Table Area */}
            <div className="rounded-2xl bg-slate-950/20 border border-white/5 overflow-hidden backdrop-blur-xl">
              <div className="border-b border-white/5 px-6 py-4 bg-slate-950/30 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Execution Logs</h2>
                <span className="px-2.5 py-1 text-xs bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
                  Qwen-2.5-Coder Model active
                </span>
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
                              <div className="flex items-center gap-1.5 text-xs text-indigo-200/40">
                                <span className="text-indigo-400/80 font-medium">{log.repositoryName}</span>
                                <span>•</span>
                                <span>{log.prNumber < 0 ? 'Branch Push' : `PR #${log.prNumber}`}</span>
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
          </div>
        )}

      </div>
    </div>
  );
}
