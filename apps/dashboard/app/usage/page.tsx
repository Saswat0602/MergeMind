'use client';

import React from 'react';
import { useUsageStats } from '../../hooks/useUsageStats';
import { UsageMetrics } from '../../components/usage/UsageMetrics';
import { UsageLogsTable } from '../../components/usage/UsageLogsTable';
import { PageHeader } from '../../components/layout/PageHeader';

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
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 12, minHeight: '60vh',
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Loading usage analytics…
        </p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Compute & Usage"
        subtitle="Monitor token consumption, API trigger records, and budget costs"
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.25 15.6M20 20v-5h-.581" />
            </svg>
            {refreshing ? 'Syncing…' : 'Refresh'}
          </button>
        }
      />
      <UsageMetrics summary={summary} />
      <UsageLogsTable logs={logs} />
    </div>
  );
}
