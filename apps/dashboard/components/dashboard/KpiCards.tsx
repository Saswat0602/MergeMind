import Link from 'next/link';
import { Stats } from '../../types';

interface KpiCardsProps {
  stats: Stats | null;
}

export function KpiCards({ stats }: KpiCardsProps) {
  if (!stats) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
      {/* Audited PRs */}
      <div className="glass-card p-6 flex flex-col justify-between min-h-[140px] border border-white/5 hover:border-indigo-500/25 transition-all duration-300 rounded-xl bg-slate-900/10 shadow-[0_0_30px_-15px_rgba(99,102,241,0.15)]">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total PRs Audited</span>
          <h2 className="text-4xl font-black text-white mt-3 font-mono">{stats.totalPrs}</h2>
        </div>
        <div className="text-xs text-indigo-400 font-medium flex items-center gap-1.5 mt-4">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
          {stats.activeRepositories} Active Projects Monitored
        </div>
      </div>

      {/* Security Threat */}
      <div className="glass-card p-6 flex flex-col justify-between min-h-[140px] border border-white/5 hover:border-rose-500/25 transition-all duration-300 rounded-xl bg-slate-900/10 shadow-[0_0_30px_-15px_rgba(244,63,94,0.15)]">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Security Vulnerabilities</span>
          <h2 className="text-4xl font-black text-rose-500 mt-3 font-mono">{stats.highSeverityCount}</h2>
        </div>
        <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5 mt-4">
          <span className="flex h-2 w-2 rounded-full bg-rose-500 pulse-indicator shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
          Critical Threats Intercepted
        </div>
      </div>

      {/* Smells */}
      <div className="glass-card p-6 flex flex-col justify-between min-h-[140px] border border-white/5 hover:border-amber-500/25 transition-all duration-300 rounded-xl bg-slate-900/10 shadow-[0_0_30px_-15px_rgba(245,158,11,0.15)]">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Performance & Code smells</span>
          <h2 className="text-4xl font-black text-amber-500 mt-3 font-mono">{stats.mediumSeverityCount + stats.lowSeverityCount}</h2>
        </div>
        <div className="text-xs text-amber-400 font-medium flex items-center gap-1.5 mt-4">
          <span className="flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
          {stats.mediumSeverityCount} Performance, {stats.lowSeverityCount} Smells
        </div>
      </div>

      {/* Estimated Spend */}
      <div className="glass-card p-6 flex flex-col justify-between min-h-[140px] border border-white/5 hover:border-violet-500/25 transition-all duration-300 rounded-xl bg-slate-900/10 shadow-[0_0_30px_-15px_rgba(139,92,246,0.15)]">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Estimated Compute Cost</span>
          <h2 className="text-4xl font-black text-violet-400 mt-3 font-mono">${stats.totalCost.toFixed(4)}</h2>
        </div>
        <div className="text-xs text-violet-400 font-medium flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></span>
            {stats.totalTokens.toLocaleString()} LLM Tokens
          </div>
          <Link href="/usage" className="hover:underline font-bold text-violet-300 text-[11px] uppercase tracking-wider flex items-center gap-0.5">
            Logs →
          </Link>
        </div>
      </div>
    </section>
  );
}
