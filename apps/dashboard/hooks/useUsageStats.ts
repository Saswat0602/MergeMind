import { useEffect, useState } from 'react';
import { LogRecord, UsageSummary } from '../types';

export function useUsageStats() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchUsageData = async () => {
    try {
      setError(null);
      const res = await fetch('/api/dashboard/usage');
      if (!res.ok) throw new Error('API server error');
      const data = await res.json();
      setLogs(data.logs);
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Could not fetch usage metrics from API:', err);
      setError(err.message || 'Failed to fetch usage metrics');
      setLogs([]);
      setSummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsageData();
  };

  return {
    logs,
    summary,
    loading,
    refreshing,
    handleRefresh,
  };
}
