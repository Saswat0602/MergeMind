import Link from 'next/link';
import { PRRecord, PaginationMeta } from '../../types';

interface PRTableProps {
  filteredPrs: PRRecord[];
  pagination: PaginationMeta | null;
  onPageChange: (newPage: number) => void;
}

function getScoreBadge(score: number | null) {
  if (score === null) return { cls: 'badge-neutral', label: '—' };
  if (score > 70)  return { cls: 'badge-danger',  label: `${score}` };
  if (score >= 30) return { cls: 'badge-warning', label: `${score}` };
  return            { cls: 'badge-success', label: `${score}` };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':   return { cls: 'badge-success', label: 'Completed' };
    case 'PROCESSING':
    case 'QUEUED':      return { cls: 'badge-accent',  label: 'Processing' };
    case 'FAILED':      return { cls: 'badge-danger',  label: 'Failed' };
    default:            return { cls: 'badge-neutral', label: status };
  }
}

function IconExternalLink() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// Mobile card for a single PR row
function PRCard({ pr }: { pr: PRRecord }) {
  const status = getStatusBadge(pr.reviewStatus);
  const score = getScoreBadge(pr.severityScore);

  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Title + external link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <a
          href={pr.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            textDecoration: 'none', flex: 1,
          }}
        >
          #{pr.number} {pr.title}
        </a>
        <a href={pr.htmlUrl} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
          <IconExternalLink />
        </a>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span style={{ fontFamily: 'monospace' }}>{pr.repositoryName}</span>
        <span>·</span>
        <span>@{pr.authorHandle}</span>
        {pr.branchName && (
          <>
            <span>·</span>
            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{pr.branchName}</span>
          </>
        )}
      </div>

      {/* Badges + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className={`badge ${status.cls}`}>{status.label}</span>
          {pr.severityScore !== null && (
            <span className={`badge ${score.cls}`}>{score.label}/100</span>
          )}
        </div>
        {pr.reviewStatus === 'COMPLETED' ? (
          <Link
            href={`/reviews/${pr.id}`}
            className="btn btn-primary"
            style={{ padding: '5px 12px', fontSize: 12 }}
          >
            Report <IconChevron />
          </Link>
        ) : (
          <button disabled className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12, opacity: 0.4 }}>
            No report
          </button>
        )}
      </div>
    </div>
  );
}

export function PRTable({ filteredPrs, pagination, onPageChange }: PRTableProps) {
  const emptyState = (
    <div style={{
      padding: '48px 0', textAlign: 'center',
      color: 'var(--text-secondary)', fontSize: 13,
    }}>
      No pull requests match the current filters.
    </div>
  );

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Audit Pipeline
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Real-time PR review status
          </p>
        </div>
        <span className="badge badge-neutral">{filteredPrs.length} results</span>
      </div>

      {/* Desktop table */}
      {filteredPrs.length === 0 ? emptyState : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table pr-table-desktop">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 16 }}>Pull Request</th>
                  <th>Repository</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th style={{ textAlign: 'right', paddingRight: 16 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrs.map(pr => {
                  const status = getStatusBadge(pr.reviewStatus);
                  const score = getScoreBadge(pr.severityScore);
                  return (
                    <tr key={pr.id}>
                      <td style={{ paddingLeft: 16, maxWidth: 320 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <a
                            href={pr.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                              textDecoration: 'none', display: 'flex', alignItems: 'center',
                              gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                          >
                            #{pr.number} {pr.title}
                            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><IconExternalLink /></span>
                          </a>
                          {pr.branchName && (
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                              {pr.branchName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {pr.repositoryName}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        @{pr.authorHandle}
                      </td>
                      <td>
                        <span className={`badge ${status.cls}`}>{status.label}</span>
                      </td>
                      <td>
                        {pr.severityScore !== null
                          ? <span className={`badge ${score.cls}`}>{score.label}/100</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>
                        }
                      </td>
                      <td style={{ paddingRight: 16, textAlign: 'right' }}>
                        {pr.reviewStatus === 'COMPLETED' ? (
                          <Link
                            href={`/reviews/${pr.id}`}
                            className="btn btn-primary"
                            style={{ padding: '5px 12px', fontSize: 12 }}
                          >
                            Report <IconChevron />
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="btn btn-secondary"
                            style={{ padding: '5px 12px', fontSize: 12, opacity: 0.4 }}
                          >
                            Pending
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="pr-card-list" style={{ padding: '12px' }}>
            {filteredPrs.map(pr => <PRCard key={pr.id} pr={pr} />)}
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Page {pagination.page} of {pagination.pages} · {pagination.total} total
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: 12 }}
            >
              ← Prev
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: 12 }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
