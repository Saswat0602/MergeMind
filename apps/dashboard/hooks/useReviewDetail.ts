import { useEffect, useState, useMemo } from 'react';
import { PRDetails } from '../types';

export function useReviewDetail(id: string) {
  const [pr, setPr] = useState<PRDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'ALL' | 'SECURITY' | 'PERFORMANCE' | 'STYLE' | 'DIFF'>('SUMMARY');

  // Interactive Code Sandbox States
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, string>>({});
  const [applyingFixId, setApplyingFixId] = useState<string | null>(null);
  const [applySuccessId, setApplySuccessId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);

  const fetchPRDetails = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/dashboard/prs/${id}`);
      if (!res.ok) {
        throw new Error('API server returned error code.');
      }
      const rawData = await res.json();
      setPr(rawData.success !== undefined ? rawData.data : rawData);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Could not fetch PR from API:', err);
      setError(err.message || 'Failed to fetch PR details');
      setPr(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPRDetails();
    }
  }, [id]);

  // Real-time job status polling
  useEffect(() => {
    if (!pr || !pr.jobs || pr.jobs.length === 0) return;
    
    const latestJob = pr.jobs[0];
    const isRunning = latestJob.status === 'PENDING' || latestJob.status === 'PROCESSING';
    
    if (isRunning) {
      const interval = setInterval(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchPRDetails();
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [pr, id]);

  // Sync suggestion changes
  useEffect(() => {
    if (pr?.reviews[0]?.comments) {
      const initial: Record<string, string> = {};
      pr.reviews[0].comments.forEach(c => {
        if (c.suggestion) {
          initial[c.id] = c.suggestion;
        }
      });
      setEditedSuggestions(prev => ({ ...initial, ...prev }));
    }
  }, [pr]);

  const handleApplyCommit = async (
    commentId: string,
    filePath: string,
    lineNumber: number,
  ) => {
    if (!pr) return;
    const currentSuggestion = editedSuggestions[commentId];
    if (!currentSuggestion) return;

    setApplyingFixId(commentId);
    setApplyError(prev => ({ ...prev, [commentId]: '' }));

    try {
      const response = await fetch('/api/dashboard/commit/apply-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pullRequestId: pr.id,
          commentId,
          filePath,
          suggestion: currentSuggestion,
          lineNumber,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to patch branch on GitHub');
      }

      setApplySuccessId(commentId);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setApplyError(prev => ({ ...prev, [commentId]: err.message || 'Unexpected server rejection' }));
    } finally {
      setApplyingFixId(null);
    }
  };

  const latestReview = useMemo(() => pr?.reviews?.[0] || null, [pr]);
  const comments = useMemo(() => latestReview?.comments || [], [latestReview]);
  const usageLogs = useMemo(() => latestReview?.usageLogs || [], [latestReview]);

  const filteredComments = useMemo(() => {
    if (activeTab === 'ALL') return comments;
    if (activeTab === 'DIFF' || activeTab === 'SUMMARY') return [];
    return comments.filter(c => c.type === activeTab);
  }, [comments, activeTab]);

  return {
    pr,
    loading,
    activeTab,
    editedSuggestions,
    applyingFixId,
    applySuccessId,
    applyError,
    latestReview,
    comments,
    usageLogs,
    filteredComments,
    error,
    setActiveTab,
    setEditedSuggestions,
    handleApplyCommit,
    fetchPRDetails,
  };
}
