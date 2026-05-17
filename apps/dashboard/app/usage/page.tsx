'use client';

import React from 'react';
import Link from 'next/link';
import { useUsageStats } from '../../hooks/useUsageStats';
import { UsageMetrics } from '../../components/usage/UsageMetrics';
import { UsageLogsTable } from '../../components/usage/UsageLogsTable';

export default function UsagePage() {
  const {
    logs,
    summary,
    loading,
    refreshing,
    handleRefresh,
  } = useUsageStats();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070913] text-slate-100 flex-col gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Loading AI Usage Analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))] text-[#f3f4f6] px-6 py-10 md:px-12 max-w-7xl mx-auto flex flex-col gap-8 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Header section */}
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/40 pb-6 z-10">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              ← Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-800/40 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
              Compute & Usage Analytics
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-3 tracking-tight bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-400 bg-clip-text text-transparent">
            AI Compute & Spendings
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Monitor active token consumption speeds, API trigger records, and budget costs.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-800 bg-slate-900/35 hover:bg-slate-800/40 text-slate-300 disabled:opacity-50 transition-all duration-300 backdrop-blur-md cursor-pointer"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.25 15.6M20 20v-5h-.581" />
            </svg>
            {refreshing ? 'Syncing...' : 'Sync Logs'}
          </button>
        </div>
      </header>

      {/* Accrued usage summary metrics cards */}
      <UsageMetrics summary={summary} />

      {/* Execution Logs Table */}
      <UsageLogsTable logs={logs} />
    </div>
  );
}
