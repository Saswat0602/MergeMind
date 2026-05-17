'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Select, SelectTrigger, SelectContent, SelectItem } from '../components/ui/select';

interface Stats {
  totalPrs: number;
  activeRepositories: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  totalTokens: number;
  totalCost: number;
}

interface PRRecord {
  id: string;
  number: number;
  title: string;
  state: string;
  authorHandle: string;
  htmlUrl: string;
  repositoryName: string;
  reviewStatus: string; // PENDING, PROCESSING, COMPLETED, FAILED
  severityScore: number | null;
  branchName: string;
  commitMessage: string;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [prs, setPrs] = useState<PRRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'CRITICAL' | 'MODERATE' | 'CLEAN'>('ALL');

  const fetchData = async (pageToFetch = 1) => {
    try {
      setError(null);
      const [statsRes, prsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch(`/api/dashboard/prs?page=${pageToFetch}&limit=50`),
      ]);

      if (!statsRes.ok || !prsRes.ok) {
        throw new Error('API server returned error code. Running with mock data fallback.');
      }

      const statsData = await statsRes.json();
      const prsData = await prsRes.json();

      setStats(statsData);
      
      // Support paginated payload shape or flat array fallback
      if (prsData && prsData.prs) {
        setPrs(prsData.prs);
        setPagination(prsData.pagination);
      } else {
        setPrs(prsData);
        setPagination({
          total: prsData.length,
          page: 1,
          limit: 50,
          pages: 1
        });
      }
    } catch (err) {
      console.warn('Could not connect to API server. Loading gorgeous demo mock data:', err);
      loadMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMockData = () => {
    setStats({
      totalPrs: 14,
      activeRepositories: 3,
      highSeverityCount: 3,
      mediumSeverityCount: 7,
      lowSeverityCount: 15,
      totalTokens: 145020,
      totalCost: 0.087,
    });
    const mockPrs = [
      {
        id: '1',
        number: 42,
        title: 'feat: Add JWT refresh token session strategy',
        state: 'open',
        authorHandle: 'saswat0602',
        htmlUrl: 'https://github.com/Saswat0602/MergeMind/pull/42',
        repositoryName: 'Saswat0602/MergeMind',
        reviewStatus: 'COMPLETED',
        severityScore: 82,
        branchName: 'feature/auth-refresh',
        commitMessage: 'feat: Add JWT refresh token rotation mechanism',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: '2',
        number: 12,
        title: 'perf: Implement redis caching layer in dashboard controller',
        state: 'open',
        authorHandle: 'collaborator-dev',
        htmlUrl: 'https://github.com/Saswat0602/MergeMind/pull/12',
        repositoryName: 'Saswat0602/MergeMind',
        reviewStatus: 'COMPLETED',
        severityScore: 18,
        branchName: 'perf/redis-cache',
        commitMessage: 'perf: caching strategy optimized for critical endpoints',
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        id: '3',
        number: 104,
        title: 'fix: Unsafe raw SQL interpolation in user authentication module',
        state: 'closed',
        authorHandle: 'security-audit-bot',
        htmlUrl: 'https://github.com/Saswat0602/MergeMind/pull/104',
        repositoryName: 'Saswat0602/MergeMind',
        reviewStatus: 'COMPLETED',
        severityScore: 95,
        branchName: 'security/hotfix-injection',
        commitMessage: 'fix: escape query inputs with prisma parameters',
        createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
      },
      {
        id: '4',
        number: 5,
        title: 'docs: Add detailed API setup markdown guidelines',
        state: 'open',
        authorHandle: 'saswat0602',
        htmlUrl: 'https://github.com/Saswat0602/MergeMind/pull/5',
        repositoryName: 'Saswat0602/MergeMind',
        reviewStatus: 'COMPLETED',
        severityScore: 0,
        branchName: 'docs/setup-readme',
        commitMessage: 'docs: elaborate setup tutorial step by step',
        createdAt: new Date(Date.now() - 1000 * 60 * 2880).toISOString(),
      },
      {
        id: '5',
        number: 45,
        title: 'refactor: Standardize shared database dto structures',
        state: 'open',
        authorHandle: 'saswat0602',
        htmlUrl: 'https://github.com/Saswat0602/MergeMind/pull/45',
        repositoryName: 'Saswat0602/MergeMind-App',
        reviewStatus: 'PROCESSING',
        severityScore: null,
        branchName: 'refactor/db-dtos',
        commitMessage: 'refactor: unify backend interface shapes',
        createdAt: new Date(Date.now()).toISOString(),
      }
    ];
    setPrs(mockPrs);
    setPagination({
      total: mockPrs.length,
      page: 1,
      limit: 50,
      pages: 1
    });
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(currentPage);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Derive unique repositories & branch choices dynamically from data
  const repositories = ['ALL', ...Array.from(new Set(prs.map(pr => pr.repositoryName)))];
  const branches = ['ALL', ...Array.from(new Set(prs.map(pr => pr.branchName || 'main')))];

  // Apply filters in real time
  const filteredPrs = prs.filter(pr => {
    const matchesSearch = 
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.number.toString().includes(searchQuery) ||
      pr.authorHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pr.commitMessage && pr.commitMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRepo = selectedRepo === 'ALL' || pr.repositoryName === selectedRepo;
    const matchesBranch = selectedBranch === 'ALL' || (pr.branchName || 'main') === selectedBranch;

    const matchesSeverity = 
      selectedSeverity === 'ALL' ||
      (selectedSeverity === 'CRITICAL' && pr.severityScore !== null && pr.severityScore > 70) ||
      (selectedSeverity === 'MODERATE' && pr.severityScore !== null && pr.severityScore >= 30 && pr.severityScore <= 70) ||
      (selectedSeverity === 'CLEAN' && pr.severityScore !== null && pr.severityScore < 30);

    return matchesSearch && matchesRepo && matchesBranch && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070913] text-slate-100 flex-col gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Loading MergeMind active metrics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))] text-[#f3f4f6] px-6 py-10 md:px-12 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Decorative Grid Panel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Header Panel */}
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
            onClick={handleRefresh}
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

      {/* KPI Cards Row */}
      {stats && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
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
      )}

      {/* Advanced Multi-Dimensional Filter bar */}
      <section className="relative glass-card p-6 border border-white/5 rounded-xl bg-slate-900/5 backdrop-blur-md flex flex-col gap-5 z-20">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Interactive Filters & Search Parameters
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Refine logs by branch name, code repository, severity threat score, or string query.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Search Keywords</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PR, author, commit..."
                className="w-full px-3.5 py-2 bg-[#090b14]/80 border border-slate-800/80 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all duration-300 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Repository Dropdown (Shadcn Custom Select) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Filter Repository</label>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger>{selectedRepo === 'ALL' ? 'All Repositories' : selectedRepo}</SelectTrigger>
              <SelectContent>
                {repositories.map(repo => (
                  <SelectItem key={repo} value={repo}>
                    {repo === 'ALL' ? 'All Repositories' : repo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch Dropdown (Shadcn Custom Select) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Filter Branch Name</label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="font-mono">{selectedBranch === 'ALL' ? 'All Branches' : selectedBranch}</SelectTrigger>
              <SelectContent>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch}>
                    {branch === 'ALL' ? 'All Branches' : branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity Score Filter (Shadcn Custom Select) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Threat Severity Rating</label>
            <Select value={selectedSeverity} onValueChange={(val) => setSelectedSeverity(val as any)}>
              <SelectTrigger>
                {selectedSeverity === 'ALL' && 'All Levels'}
                {selectedSeverity === 'CRITICAL' && 'Critical Threat (> 70)'}
                {selectedSeverity === 'MODERATE' && 'Moderate Severity (30 - 70)'}
                {selectedSeverity === 'CLEAN' && 'Clean Code (< 30)'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="CRITICAL">Critical Threat (&gt; 70)</SelectItem>
                <SelectItem value="MODERATE">Moderate Severity (30 - 70)</SelectItem>
                <SelectItem value="CLEAN">Clean Code (&lt; 30)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* PR Table Section */}
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
                {filteredPrs.map(pr => {
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
                  );
                })}
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
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-900/40 border border-slate-800 text-slate-300 hover:bg-slate-800/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-900/40 border border-slate-800 text-slate-300 hover:bg-slate-800/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
