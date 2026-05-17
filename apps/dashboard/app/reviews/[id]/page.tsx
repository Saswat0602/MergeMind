'use client';

import React from 'react';
import Link from 'next/link';
import { use } from 'react';
import { useReviewDetail } from '../../../hooks/useReviewDetail';
import { ReviewSummary } from '../../../components/reviews/ReviewSummary';
import { CodeSandbox } from '../../../components/reviews/CodeSandbox';
import { DiffViewer } from '../../../components/reviews/DiffViewer';
import { PageHeader } from '../../../components/layout/PageHeader';

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

const TABS = ['SUMMARY', 'ALL', 'SECURITY', 'PERFORMANCE', 'STYLE', 'DIFF'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  SUMMARY: 'Summary',
  ALL: 'All Findings',
  SECURITY: 'Security',
  PERFORMANCE: 'Performance',
  STYLE: 'Style',
  DIFF: 'Code Diff',
};

const CATEGORY_MAP: Record<string, { cls: string; label: string }> = {
  SECURITY:    { cls: 'badge-danger',  label: 'Security' },
  PERFORMANCE: { cls: 'badge-warning', label: 'Performance' },
  STYLE:       { cls: 'badge-accent',  label: 'Style' },
};

const SEVERITY_MAP: Record<string, string> = {
  HIGH:   'badge-danger',
  MEDIUM: 'badge-warning',
  LOW:    'badge-success',
};

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

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 12, minHeight: '60vh',
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading audit report…</p>
      </div>
    );
  }

  /* ── Not found ───────────────────────────────────────────── */
  if (!pr) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 12, minHeight: '60vh',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Report not found.</p>
        <Link href="/" className="btn btn-secondary" style={{ fontSize: 13 }}>← Back to Dashboard</Link>
      </div>
    );
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  const cat  = (type: string)     => CATEGORY_MAP[type] ?? { cls: 'badge-neutral', label: type };
  const sev  = (severity: string) => SEVERITY_MAP[severity] ?? 'badge-neutral';

  const countForTab = (tab: Tab) => {
    if (tab === 'DIFF' || tab === 'SUMMARY') return null;
    if (tab === 'ALL')  return (latestReview?.comments?.length ?? 0);
    return latestReview?.comments?.filter(c => c.type === tab).length ?? 0;
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="page-content">
      {/* ── Page header ─────────────────────────────────────── */}
      <PageHeader
        backLabel="Dashboard"
        backHref="/"
        breadcrumbTag={`PR #${pr.number}`}
        title={pr.title}
        subtitle={`${latestReview?.branchName ?? 'main'} · @${pr.authorHandle}`}
        actions={
          <a
            href={pr.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: 13 }}
          >
            View on GitHub
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        }
      />

      {/* ── Main Layout ──────────────────────────────────── */}
      <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto min-w-0">

        {/* Tab bar */}
        <div className="tab-list" style={{ marginBottom: 16 }}>
            {TABS.map(tab => {
              const count = countForTab(tab);
              return (
                <button
                  key={tab}
                  className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {TAB_LABELS[tab]}
                  {count !== null && count > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'var(--bg-elevated)',
                      color: activeTab === tab ? '#818cf8' : 'var(--text-muted)',
                      borderRadius: 20, padding: '1px 6px',
                      minWidth: 18, textAlign: 'center',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'SUMMARY' ? (
            <ReviewSummary latestReview={latestReview} usageLogs={usageLogs} />
          ) : activeTab === 'DIFF' ? (
            <DiffViewer gitDiff={latestReview?.gitDiff} />
          ) : filteredComments.length === 0 ? (
            <div className="card" style={{
              padding: '56px 24px', textAlign: 'center',
              color: 'var(--text-secondary)', fontSize: 13,
            }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No findings in this category — great code quality!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredComments.map(comment => {
                const c = cat(comment.type);
                return (
                  <div key={comment.id} className="card" style={{ padding: '16px 18px' }}>

                    {/* Top row: file + badges */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start',
                      justifyContent: 'space-between', gap: 12,
                      flexWrap: 'wrap', marginBottom: 12,
                    }}>
                      <code style={{
                        fontSize: 11, color: 'var(--text-secondary)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 4, padding: '2px 7px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        whiteSpace: 'normal',
                      }}>
                        {comment.filePath}
                        {comment.lineNumber ? ` : ${comment.lineNumber}` : ''}
                      </code>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <span className={`badge ${c.cls}`}>{c.label}</span>
                        <span className={`badge ${sev(comment.severity)}`}>{comment.severity}</span>
                      </div>
                    </div>

                    {/* Comment body */}
                    <p style={{
                      margin: 0, fontSize: 13.5, lineHeight: 1.75,
                      color: 'var(--text-primary)',
                    }}>
                      {comment.content}
                    </p>

                    {/* Code suggestion */}
                    {comment.suggestion && (
                      <div style={{ marginTop: 14 }}>
                        <CodeSandbox
                          comment={comment}
                          editedSuggestions={editedSuggestions}
                          setEditedSuggestions={setEditedSuggestions}
                          applyingFixId={applyingFixId}
                          applySuccessId={applySuccessId}
                          applyError={applyError}
                          branchName={latestReview?.branchName ?? 'main'}
                          onApplyCommit={handleApplyCommit}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
