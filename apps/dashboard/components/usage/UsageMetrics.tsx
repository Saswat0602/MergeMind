import { UsageSummary } from '../../types';

interface UsageMetricsProps {
  summary: UsageSummary | null;
}

export function UsageMetrics({ summary }: UsageMetricsProps) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      {/* Accrued Cost Card */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-950/40 border border-indigo-500/10 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/80 mb-2">Total Accrued Cost</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white tracking-tight">${summary.totalCost.toFixed(5)}</span>
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
        <p className="text-3xl font-bold text-white tracking-tight">{summary.totalTokens.toLocaleString()}</p>
        <div className="mt-3 flex flex-col gap-1.5">
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full" 
              style={{ width: `${Math.min(100, (summary.promptTokens / (summary.totalTokens || 1)) * 100)}%` }} 
            />
          </div>
          <div className="flex justify-between text-[10px] text-indigo-200/40 font-mono">
            <span>{Math.round((summary.promptTokens / (summary.totalTokens || 1)) * 100)}% Prompt</span>
            <span>{Math.round((summary.completionTokens / (summary.totalTokens || 1)) * 100)}% Comp</span>
          </div>
        </div>
      </div>

      {/* Total Jobs Executed */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-950/40 border border-indigo-500/10 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/80 mb-2">AI Reviews Triggered</p>
        <p className="text-3xl font-bold text-white tracking-tight">{summary.totalRequests}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-200/50">
          <span>Jobs processed asynchronously</span>
        </div>
      </div>

      {/* Average Latency */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-950/40 border border-indigo-500/10 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/80 mb-2">Average LLM Latency</p>
        <p className="text-3xl font-bold text-white tracking-tight">{(summary.averageLatencyMs / 1000).toFixed(2)}s</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-200/50">
          <span>Fast streaming response</span>
        </div>
      </div>

    </div>
  );
}
