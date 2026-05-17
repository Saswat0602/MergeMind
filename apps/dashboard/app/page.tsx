'use client';

import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { KpiCards } from '../components/dashboard/KpiCards';
import { QualityChart } from '../components/dashboard/QualityChart';
import { ThreatHeatmap } from '../components/dashboard/ThreatHeatmap';
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
      <DashboardHeader refreshing={refreshing} onRefresh={handleRefresh} />

      {/* KPI Cards Row */}
      <KpiCards stats={stats} />

      {/* Analytics & Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <QualityChart />
        <ThreatHeatmap />
      </section>

      {/* Filter bar */}
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

      {/* PR Table Section */}
      <PRTable
        filteredPrs={filteredPrs}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
