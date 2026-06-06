import { useEffect, useState, useMemo } from 'react';
import { Stats, PRRecord, PaginationMeta } from '../types';

export function useDashboardData() {
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
        throw new Error('API server returned error code.');
      }

      const statsRaw = await statsRes.json();
      const prsRaw = await prsRes.json();

      const statsData = statsRaw.success !== undefined ? statsRaw.data : statsRaw;
      const prsData = prsRaw.success !== undefined ? prsRaw.data : prsRaw;

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
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Could not connect to API server:', err);
      setError(err.message || 'Failed to load dashboard statistics');
      setStats(null);
      setPrs([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const repositories = useMemo(() => {
    return ['ALL', ...Array.from(new Set(prs.map(pr => pr.repositoryName)))];
  }, [prs]);

  const branches = useMemo(() => {
    return ['ALL', ...Array.from(new Set(prs.map(pr => pr.branchName || 'main')))];
  }, [prs]);

  // Apply filters in real time
  const filteredPrs = useMemo(() => {
    return prs.filter(pr => {
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
  }, [prs, searchQuery, selectedRepo, selectedBranch, selectedSeverity]);

  return {
    stats,
    prs,
    pagination,
    loading,
    refreshing,
    error,
    currentPage,
    searchQuery,
    selectedRepo,
    selectedBranch,
    selectedSeverity,
    repositories,
    branches,
    filteredPrs,
    setSearchQuery,
    setSelectedRepo,
    setSelectedBranch,
    setSelectedSeverity,
    handleRefresh,
    handlePageChange,
  };
}
