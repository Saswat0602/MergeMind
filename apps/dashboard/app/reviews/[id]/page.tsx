'use client';

import React from 'react';
import Link from 'next/link';
import { use } from 'react';
import { useReviewDetail } from '../../../hooks/useReviewDetail';
import { ReviewSummary } from '../../../components/reviews/ReviewSummary';
import { CodeSandbox } from '../../../components/reviews/CodeSandbox';
import { DiffViewer } from '../../../components/reviews/DiffViewer';

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const { id } = use(params);
  
  const {
    pr,
    loading,
    activeTab,
    editedSuggestions,
    applyingFixId,
    applySuccessId,
    applyError,
    latestReview,
    usageLogs,
    filteredComments,
    setActiveTab,
    setEditedSuggestions,
    handleApplyCommit,
  } = useReviewDetail(id);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070913] text-slate-100 flex-col gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Loading AI Code Diagnostic Report...</p>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070913] text-slate-100 flex-col gap-4">
        <p className="text-sm font-semibold text-slate-400">Report details not found.</p>
        <Link href="/" className="text-violet-400 underline font-bold text-xs uppercase">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'HIGH': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getCategoryBadge = (type: string) => {
    switch (type) {
      case 'SECURITY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/25">
            SECURITY AUDIT
          </span>
        );
      case 'PERFORMANCE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
            PERFORMANCE
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            STYLE & CLEANUP
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.1),rgba(255,255,255,0))] text-[#f3f4f6] px-6 py-10 md:px-12 max-w-7xl mx-auto flex flex-col gap-8 relative">
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
              PR #{pr.number} Audit
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-3 leading-snug">
            {pr.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Analyzed branch: <code className="text-violet-300 font-mono text-[11px] bg-violet-950/20 px-1.5 py-0.5 rounded border border-violet-800/20">{latestReview?.branchName || 'main'}</code> by user <span className="font-semibold text-slate-300">@{pr.authorHandle}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={pr.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-800 bg-slate-900/35 hover:bg-slate-800/40 text-slate-300 transition-all duration-300 backdrop-blur-md"
          >
            GitHub PR
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </header>

      {/* Grid Layout containing Summary & Detailed Tabs */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left column - Diagnostic gauges & AI Overview */}
        <ReviewSummary latestReview={latestReview} usageLogs={usageLogs} />

        {/* Right column - Audit Recommendations tabs & diff viewer */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex border-b border-slate-800/60 pb-3 gap-2 overflow-x-auto">
            {(['ALL', 'SECURITY', 'PERFORMANCE', 'STYLE', 'DIFF'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-violet-600/90 text-white border border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                {tab === 'ALL' && 'All Recommendations'}
                {tab === 'SECURITY' && 'Security Audits'}
                {tab === 'PERFORMANCE' && 'Performance Optimization'}
                {tab === 'STYLE' && 'Style & Consistency'}
                {tab === 'DIFF' && 'PR Code Diff'}
              </button>
            ))}
          </div>

          {activeTab === 'DIFF' ? (
            <DiffViewer gitDiff={latestReview?.gitDiff} />
          ) : (
            <div className="flex flex-col gap-6">
              {filteredComments.length === 0 ? (
                <div className="glass-card p-12 text-center text-slate-500 text-sm border border-white/5 rounded-xl bg-slate-900/10">
                  Zero findings registered under this category! Excellent code quality.
                </div>
              ) : (
                filteredComments.map((comment) => (
                  <div key={comment.id} className="glass-card p-6 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg flex flex-col gap-4 relative">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-slate-500 font-mono text-[10px] font-bold">
                          {comment.filePath} : line {comment.lineNumber}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {getCategoryBadge(comment.type)}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getSeverityColor(comment.severity)}`}>
                            {comment.severity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 leading-6 font-medium pl-1 mt-1">
                      {comment.content}
                    </p>

                    {comment.suggestion && (
                      <CodeSandbox
                        comment={comment}
                        editedSuggestions={editedSuggestions}
                        setEditedSuggestions={setEditedSuggestions}
                        applyingFixId={applyingFixId}
                        applySuccessId={applySuccessId}
                        applyError={applyError}
                        branchName={latestReview?.branchName || 'main'}
                        onApplyCommit={handleApplyCommit}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
