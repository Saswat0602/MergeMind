'use client';

import React, { useEffect, useState } from 'react';
import { useLiveJobStatus, JobEvent } from '../../hooks/useLiveJobStatus';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function SseToast() {
  const { liveEvents } = useLiveJobStatus();
  const [latestEvent, setLatestEvent] = useState<JobEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (liveEvents.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLatestEvent(liveEvents[0]);
      setIsVisible(true);

      // Hide toast after 5 seconds if completed or failed
      if (liveEvents[0].status === 'COMPLETED' || liveEvents[0].status === 'FAILED') {
        const timer = setTimeout(() => setIsVisible(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [liveEvents]);

  if (!isVisible || !latestEvent) return null;

  const isCompleted = latestEvent.status === 'COMPLETED';
  const isFailed = latestEvent.status === 'FAILED';


  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#1e1e2e',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        minWidth: '320px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isCompleted 
            ? 'rgba(34, 197, 94, 0.1)' 
            : isFailed 
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(59, 130, 246, 0.1)',
          color: isCompleted 
            ? '#22c55e' 
            : isFailed 
              ? '#ef4444'
              : '#3b82f6',
        }}
      >
        {isCompleted ? <CheckCircle size={20} /> : isFailed ? <XCircle size={20} /> : <Loader2 size={20} className="animate-spin" />}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {isCompleted 
            ? 'Review Completed' 
            : isFailed 
              ? 'Review Failed' 
              : 'AI Review in Progress'}
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          {isCompleted
            ? 'PR analysis finished successfully.'
            : isFailed
              ? latestEvent.error || 'An error occurred during analysis.'
              : `Status: ${latestEvent.step?.replace('_', ' ') || 'Initializing...'}`}
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '4px',
        }}
      >
        &times;
      </button>
    </div>
  );
}
