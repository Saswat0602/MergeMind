import { useEffect, useState } from 'react';
import { Repository, RepositoryRule } from '../types';

export function useRepositoryRules() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [rules, setRules] = useState<RepositoryRule[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active repositories
  useEffect(() => {
    async function fetchRepos() {
      try {
        setError(null);
        setLoadingRepos(true);
        const res = await fetch('/api/dashboard/repositories');
        if (!res.ok) throw new Error('Failed to load repositories');
        const rawData = await res.json();
        const data = rawData.success !== undefined ? rawData.data : rawData;
        setRepositories(data);
        if (data.length > 0) {
          setSelectedRepoId(data[0].id);
        }
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('Error fetching repositories:', err);
        setError(err.message || 'Error loading repositories');
      } finally {
        setLoadingRepos(false);
      }
    }
    fetchRepos();
  }, []);

  // Fetch rules whenever the selected repository changes
  useEffect(() => {
    if (!selectedRepoId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRules([]);
      return;
    }

    async function fetchRules() {
      try {
        setError(null);
        setLoadingRules(true);
        const res = await fetch(`/api/dashboard/repositories/${selectedRepoId}/rules`);
        if (!res.ok) throw new Error('Failed to load repository rules');
        const rawData = await res.json();
        const data = rawData.success !== undefined ? rawData.data : rawData;
        setRules(data);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('Error fetching rules:', err);
        setError(err.message || 'Error loading repository rules');
      } finally {
        setLoadingRules(false);
      }
    }
    fetchRules();
  }, [selectedRepoId]);

  // Toggle rule enable/disable state
  const handleToggleRule = async (ruleId: string, currentStatus: boolean) => {
    try {
      setError(null);
      // Optimistic update
      setRules(prev =>
        prev.map(r => (r.id === ruleId ? { ...r, isEnabled: !currentStatus } : r))
      );

      const res = await fetch(`/api/dashboard/rules/${ruleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to toggle rule state');
      const updatedRaw = await res.json();
      const updated = updatedRaw.success !== undefined ? updatedRaw.data : updatedRaw;
      
      // Sync from server
      setRules(prev => prev.map(r => (r.id === ruleId ? updated : r)));
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error toggling rule:', err);
      setError(err.message || 'Failed to update rule state');
      // Rollback optimistic update
      setRules(prev =>
        prev.map(r => (r.id === ruleId ? { ...r, isEnabled: currentStatus } : r))
      );
    }
  };

  // Create a new custom rule
  const handleCreateRule = async (rule: {
    name: string;
    description: string;
    pattern: string;
    type: string;
  }) => {
    if (!selectedRepoId) return;
    try {
      setError(null);
      setSaving(true);
      const res = await fetch(`/api/dashboard/repositories/${selectedRepoId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });

      if (!res.ok) throw new Error('Failed to create new custom rule');
      const newRuleRaw = await res.json();
      const newRule = newRuleRaw.success !== undefined ? newRuleRaw.data : newRuleRaw;
      setRules(prev => [...prev, newRule]);
      return true;
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error creating custom rule:', err);
      setError(err.message || 'Failed to create new custom rule');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete a custom rule
  const handleDeleteRule = async (ruleId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/dashboard/rules/${ruleId}/delete`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to delete repository rule');
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error deleting rule:', err);
      setError(err.message || 'Failed to delete repository rule');
    }
  };

  return {
    repositories,
    selectedRepoId,
    setSelectedRepoId,
    rules,
    loadingRepos,
    loadingRules,
    saving,
    error,
    handleToggleRule,
    handleCreateRule,
    handleDeleteRule,
  };
}
