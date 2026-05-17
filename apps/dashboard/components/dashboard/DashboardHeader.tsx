import Link from 'next/link';

interface DashboardHeaderProps {
  refreshing: boolean;
  onRefresh: () => void;
}


export function DashboardHeader({ refreshing, onRefresh }: DashboardHeaderProps) {
  return (
    <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/40 pb-6 z-10">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-400 bg-clip-text text-transparent">
            MergeMind
          </h1>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#a78bfa] border border-[#a78bfa]/20 px-2 py-0.5 rounded bg-violet-950/20 backdrop-blur-md">
            AI ENGINE CORE v2.0
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">Autonomous GitHub Code Quality Auditor & Deep Threat Security Core</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/usage"
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-indigo-500/30 bg-indigo-950/20 hover:bg-indigo-900/40 text-indigo-300 transition-all duration-300 backdrop-blur-md"
        >
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Compute Usage
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-800 bg-slate-900/35 hover:bg-slate-800/40 text-slate-300 transition-all duration-300 backdrop-blur-md"
        >
          <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          System Settings
        </Link>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-800 bg-slate-900/35 hover:bg-slate-800/40 text-slate-300 disabled:opacity-50 transition-all duration-300 backdrop-blur-md"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.25 15.6M20 20v-5h-.581" />
          </svg>
          {refreshing ? 'Syncing...' : 'Sync Hub'}
        </button>
      </div>
    </header>
  );
}
