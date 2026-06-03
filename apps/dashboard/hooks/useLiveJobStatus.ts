import { useEffect, useState } from 'react';

export interface JobEvent {
  jobId: string;
  status: string;
  step: string;
  error?: string;
  pullRequestId?: string;
}

export function useLiveJobStatus() {
  const [liveEvents, setLiveEvents] = useState<JobEvent[]>([]);

  useEffect(() => {
    // Connect to the API's SSE endpoint
    const eventSource = new EventSource('/api/dashboard/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as JobEvent;
        console.log('Received real-time job update:', data);
        
        // Keep the last 10 events for toast notifications
        setLiveEvents((prev) => {
          const newEvents = [data, ...prev].slice(0, 10);
          return newEvents;
        });
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect SSE...');
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { liveEvents };
}
