import { useState, useRef, useEffect, useCallback } from 'react';

export interface WorkflowLogItem {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'SUCCESS';
  message: string;
  source_file?: string;
  log_type?: string;
}

export interface StreamEventCallbacks {
  onLog?: (log: WorkflowLogItem) => void;
  onNodeActive?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, outputs: Record<string, any>) => void;
  onComplete?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useWorkflowExecution(backendUrl: string = '') {
  const activeStreamsRef = useRef<Record<string, EventSource>>({});
  const [logs, setLogs] = useState<WorkflowLogItem[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Clean up all active streams on unmount
  useEffect(() => {
    const streams = activeStreamsRef.current;
    return () => {
      Object.values(streams).forEach((es) => {
        try {
          es.close();
        } catch (e) {
          console.error('Error closing EventSource:', e);
        }
      });
    };
  }, []);

  const disconnectStream = useCallback((key: string) => {
    if (activeStreamsRef.current[key]) {
      try {
        activeStreamsRef.current[key].close();
      } catch (err) {
        console.warn(`Failed to close stream for ${key}:`, err);
      }
      delete activeStreamsRef.current[key];
    }
  }, []);

  const disconnectAllStreams = useCallback(() => {
    Object.keys(activeStreamsRef.current).forEach((key) => {
      disconnectStream(key);
    });
    setIsExecuting(false);
    setActiveNodeId(null);
  }, [disconnectStream]);

  const connectStream = useCallback(
    (key: string, runId: string, callbacks: StreamEventCallbacks = {}) => {
      if (activeStreamsRef.current[key]) {
        return activeStreamsRef.current[key];
      }

      const streamUrl = `${backendUrl}/api/workflows/runs/${runId}/stream`;
      const eventSource = new EventSource(streamUrl);
      activeStreamsRef.current[key] = eventSource;
      setIsExecuting(true);

      eventSource.addEventListener('log', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const newLog: WorkflowLogItem = {
            timestamp: data.timestamp || new Date().toISOString(),
            level: data.level === 'ERROR' || data.level === 'SUCCESS' ? data.level : 'INFO',
            message: data.message || '',
            source_file: data.source_file,
            log_type: data.log_type || 'general',
          };
          setLogs((prev) => [...prev, newLog]);
          callbacks.onLog?.(newLog);
        } catch (err) {
          console.error('Failed to parse SSE log event', err);
        }
      });

      eventSource.addEventListener('node_active', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const nId = data.node_id;
          setActiveNodeId(nId);
          callbacks.onNodeActive?.(nId);
        } catch (err) {
          console.error('Failed to parse node_active event', err);
        }
      });

      eventSource.addEventListener('node_complete', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          callbacks.onNodeComplete?.(data.node_id, data.outputs || {});
        } catch (err) {
          console.error('Failed to parse node_complete event', err);
        }
      });

      eventSource.addEventListener('complete', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          callbacks.onComplete?.(data);
        } catch (err) {
          console.error('Failed to parse complete event', err);
        } finally {
          disconnectStream(key);
          setIsExecuting(false);
          setActiveNodeId(null);
        }
      });

      eventSource.onerror = (err) => {
        console.warn(`SSE stream error on run ${runId}:`, err);
        callbacks.onError?.(err);
        disconnectStream(key);
        setIsExecuting(false);
        setActiveNodeId(null);
      };

      return eventSource;
    },
    [backendUrl, disconnectStream]
  );

  const stopRun = useCallback(
    async (runId: string): Promise<boolean> => {
      try {
        const res = await fetch(`${backendUrl}/api/workflows/runs/${runId}/stop`, {
          method: 'POST',
        });
        disconnectStream(runId);
        return res.ok;
      } catch (err) {
        console.error(`Failed to stop run ${runId}:`, err);
        return false;
      }
    },
    [backendUrl, disconnectStream]
  );

  const resumeRun = useCallback(
    async (runId: string): Promise<boolean> => {
      try {
        const res = await fetch(`${backendUrl}/api/workflows/runs/${runId}/resume`, {
          method: 'POST',
        });
        return res.ok;
      } catch (err) {
        console.error(`Failed to resume run ${runId}:`, err);
        return false;
      }
    },
    [backendUrl]
  );

  const deleteRun = useCallback(
    async (runId: string): Promise<boolean> => {
      try {
        const res = await fetch(`${backendUrl}/api/workflows/runs/${encodeURIComponent(runId)}`, {
          method: 'DELETE',
        });
        disconnectStream(runId);
        return res.ok;
      } catch (err) {
        console.error(`Failed to delete run ${runId}:`, err);
        return false;
      }
    },
    [backendUrl, disconnectStream]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    setLogs,
    clearLogs,
    isExecuting,
    activeNodeId,
    connectStream,
    disconnectStream,
    disconnectAllStreams,
    stopRun,
    resumeRun,
    deleteRun,
    activeStreamsRef,
  };
}

