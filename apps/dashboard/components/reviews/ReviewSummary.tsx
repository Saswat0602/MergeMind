import Link from 'next/link';
import { Review, UsageLog } from '../../types';

interface ReviewSummaryProps {
  latestReview: Review | null;
  usageLogs: UsageLog[];
}

export function ReviewSummary({ latestReview, usageLogs }: ReviewSummaryProps) {
  if (!latestReview) return null;

  const getScoreBadgeColor = (score: number) => {
    if (score > 70) return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    if (score > 30) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="lg:col-span-4 flex flex-col gap-8">
      {/* Diagnostic score */}
      <div className="glass-card p-6 flex flex-col items-center text-center gap-4 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg">
        <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Severity Threat Rating</span>
        <div className="relative flex items-center justify-center mt-2">
          <div className={`w-32 h-32 rounded-full border-[8px] border-[#0a0c16] flex flex-col items-center justify-center ${getScoreBadgeColor(latestReview.severityScore)} shadow-[0_0_20px_rgba(99,102,241,0.1)]`}>
            <span className="text-3xl font-black">{latestReview.severityScore}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-5">
          {latestReview.severityScore > 70 
            ? 'CRITICAL WARNING: Highly dangerous code patterns detected. Secure prior to merge.' 
            : latestReview.severityScore > 30 
              ? 'MODERATE: Non-blocking performance bugs or minor validations need refactoring.' 
              : 'CLEAN: Excellent code structure. Minor cleanups might apply.'}
        </p>
      </div>

      {/* AI Summary card */}
      <div className="glass-card p-6 flex flex-col gap-3 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg">
        <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">AI Executive Review</span>
        <p className="text-sm text-slate-300 leading-6 font-medium">
          {latestReview.summary}
        </p>
      </div>

      {/* AI token usage metadata */}
      {usageLogs.length > 0 && (
        <div className="glass-card p-6 flex flex-col gap-4 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Diagnostic Performance logs</span>
          
          {usageLogs.map((usage, idx) => (
            <div key={idx} className="flex flex-col gap-3 text-xs border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
              {usage.actionDescription && (
                <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-1">
                  {usage.actionDescription}
                </div>
              )}
              <div className="flex justify-between border-b border-slate-800/30 pb-2">
                <span className="text-slate-500 font-medium">LLM Model:</span>
                <span className="font-mono text-slate-300">{usage.modelName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/30 pb-2">
                <span className="text-slate-500 font-medium">Latency Speed:</span>
                <span className="text-slate-300 font-semibold">{(usage.latencyMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/30 pb-2">
                <span className="text-slate-500 font-medium">Token Footprint:</span>
                <span className="text-slate-300 font-semibold">{usage.totalTokens.toLocaleString()} tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">OpenRouter Spend:</span>
                <span className="text-violet-400 font-bold">${(usage.cost || 0).toFixed(4)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
