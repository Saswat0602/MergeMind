'use client';

import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { KpiCards } from '../components/dashboard/KpiCards';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';
import { FiltersBar } from '../components/dashboard/FiltersBar';
import { PRTable } from '../components/dashboard/PRTable';

export default function DashboardHome() {
  const {
    stats,
    loading,
    refreshing,
    searchQuery,
    selectedRepo,
    selectedBranch,
    selectedSeverity,
    repositories,
    branches,
    filteredPrs,
    pagination,
    setSearchQuery,
    setSelectedRepo,
    setSelectedBranch,
    setSelectedSeverity,
    handleRefresh,
    handlePageChange,
  } = useDashboardData();

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 12, minHeight: '60vh',
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Loading MergeMind metrics…
        </p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <DashboardHeader refreshing={refreshing} onRefresh={handleRefresh} />
      <KpiCards stats={stats} />
      <DashboardCharts stats={stats} />
      <FiltersBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedRepo={selectedRepo}
        setSelectedRepo={setSelectedRepo}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        selectedSeverity={selectedSeverity}
        setSelectedSeverity={setSelectedSeverity}
        repositories={repositories}
        branches={branches}
      />
      <PRTable
        filteredPrs={filteredPrs}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
