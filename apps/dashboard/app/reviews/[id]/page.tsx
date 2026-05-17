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
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 12, minHeight: '60vh',
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Loading audit report…
        </p>
      </div>
    );
  }

  if (!pr) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 12, minHeight: '60vh',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Report not found.</p>
        <Link href="/" className="btn btn-secondary" style={{ fontSize: 13 }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'HIGH':   return 'badge-danger';
      case 'MEDIUM': return 'badge-warning';
      default:       return 'badge-success';
    }
  };

  const getCategoryBadge = (type: string) => {
    switch (type) {
      case 'SECURITY':    return { cls: 'badge-danger',  label: 'Security' };
      case 'PERFORMANCE': return { cls: 'badge-warning', label: 'Performance' };
      default:            return { cls: 'badge-accent',  label: 'Style' };
    }
  };

  const TABS = ['ALL', 'SECURITY', 'PERFORMANCE', 'STYLE', 'DIFF'] as const;
  const TAB_LABELS: Record<string, string> = {
    ALL: 'All', SECURITY: 'Security', PERFORMANCE: 'Performance', STYLE: 'Style', DIFF: 'Code Diff',
  };

  return (
    <div className="page-content">
      <PageHeader
        backLabel="Dashboard"
        backHref="/"
        breadcrumbTag={`PR #${pr.number}`}
        title={pr.title}
        subtitle={`Branch: ${latestReview?.branchName || 'main'} · @${pr.authorHandle}`}
        actions={
          <a
            href={pr.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            View on GitHub
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        }
      />

      {/* Two-column layout */}
      <div className="review-grid" style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: 20,
        alignItems: 'flex-start',
      }}>
        {/* Left: Summary panel */}
        <div style={{ minWidth: 0 }}>
          <ReviewSummary latestReview={latestReview} usageLogs={usageLogs} />
        </div>

        {/* Right: Tabs + comments */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tabs */}
          <div className="tab-list">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'DIFF' ? (
            <DiffViewer gitDiff={latestReview?.gitDiff} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredComments.length === 0 ? (
                <div className="card" style={{
                  padding: '48px 24px', textAlign: 'center',
                  color: 'var(--text-secondary)', fontSize: 13,
                }}>
                  No findings in this category. Excellent code quality!
                </div>
              ) : (
                filteredComments.map(comment => {
                  const cat = getCategoryBadge(comment.type);
                  return (
                    <div key={comment.id} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* File + badges */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                          {comment.filePath}:{comment.lineNumber}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className={`badge ${cat.cls}`}>{cat.label}</span>
                          <span className={`badge ${getSeverityColor(comment.severity)}`}>{comment.severity}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                        {comment.content}
                      </p>

                      {/* Code suggestion */}
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
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
