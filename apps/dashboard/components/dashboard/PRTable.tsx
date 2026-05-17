import Link from 'next/link';
import { PRRecord, PaginationMeta } from '../../types';

interface PRTableProps {
  filteredPrs: PRRecord[];
  pagination: PaginationMeta | null;
  onPageChange: (newPage: number) => void;
}

export function PRTable({ filteredPrs, pagination, onPageChange }: PRTableProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500 bg-slate-800/20 border-slate-700/20';
    if (score > 70) return 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_12px_-4px_rgba(244,63,94,0.3)]';
    if (score >= 30) return 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_12px_-4px_rgba(245,158,11,0.3)]';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_12px_-4px_rgba(16,185,129,0.3)]';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
            COMPLETED
          </span>
        );
      case 'PROCESSING':
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            PROCESSING
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/25">
            FAILED
          </span>
        );
      default:
        return <span className="text-slate-400">{status}</span>;
    }
  };

  return (
    <section className="relative glass-card p-6 border border-white/5 rounded-xl bg-slate-900/5 backdrop-blur-md flex flex-col gap-6 z-10">
      <div className="flex justify-between items-center border-b border-slate-800/40 pb-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Review Audit Pipeline Logs</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Real-time status of analysis webhooks</p>
        </div>
        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-slate-800/50 text-slate-400 rounded-lg border border-slate-700">
          {filteredPrs.length} PRs matched
        </span>
      </div>

      <div className="overflow-x-auto">
        {filteredPrs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm font-medium flex flex-col items-center justify-center gap-3">
            <svg className="w-8 h-8 text-slate-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No pull request audits match the selected filter configuration.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="pb-3 pl-4">Pull Request / Branch</th>
                <th className="pb-3">Repository</th>
                <th className="pb-3">Author</th>
                <th className="pb-3">Pipeline Status</th>
                <th className="pb-3">Threat Rating</th>
                <th className="pb-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {filteredPrs.map(pr => (
                <tr key={pr.id} className="hover:bg-slate-800/15 transition-all duration-150">
                  <td className="py-4 pl-4 font-semibold text-white max-w-sm">
                    <div className="flex flex-col gap-1">
                      <a href={pr.htmlUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 font-bold flex items-center gap-1.5 text-xs truncate">
                        #{pr.number} - {pr.title}
                        <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h2" />
                        </svg>
                        {pr.branchName || 'main'}
                      </div>
                      {pr.commitMessage && (
                        <div className="text-[10px] text-slate-500 italic max-w-xs truncate pl-1 mt-0.5">
                          💬 "{pr.commitMessage}"
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-slate-300 font-mono text-[11px] font-semibold">{pr.repositoryName}</td>
                  <td className="py-4 text-slate-300">
                    <span className="font-semibold text-slate-500">@</span>{pr.authorHandle}
                  </td>
                  <td className="py-4">{getStatusBadge(pr.reviewStatus)}</td>
                  <td className="py-4">
                    {pr.severityScore !== null ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getScoreColor(pr.severityScore)}`}>
                        {pr.severityScore} / 100
                      </span>
                    ) : (
                      <span className="text-slate-600 font-semibold">—</span>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-right">
                    {pr.reviewStatus === 'COMPLETED' ? (
                      <Link
                        href={`/reviews/${pr.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                      >
                        Report
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ) : (
                      <button disabled className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded bg-slate-800/40 text-slate-600 border border-slate-800/60 cursor-not-allowed">
                        No Report
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dynamic Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center border-t border-slate-800/40 pt-4 mt-2">
          <span className="text-[11px] text-slate-500 font-medium">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total PRs)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-900/40 border border-slate-800 text-slate-300 hover:bg-slate-800/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[#090b14]/40 border border-slate-800 text-slate-300 hover:bg-slate-800/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
