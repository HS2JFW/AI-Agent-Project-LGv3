import { useState, useEffect, useCallback } from 'react';
import type { Node } from 'reactflow';

export interface UseWorkflowTimersProps {
  selectedWorkflowId: string | null;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  backendUrl: string;
}

export function useWorkflowTimers({
  selectedWorkflowId,
  setNodes,
  backendUrl,
}: UseWorkflowTimersProps) {
  const [timersState, setTimersState] = useState<Record<string, any>>({});

  const fetchTimersState = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/workflows/timers/state`);
      if (res.ok) {
        const data = await res.json();
        setTimersState(data || {});
      }
    } catch (e) {
      console.error("Failed to fetch timers state:", e);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchTimersState();
    const interval = setInterval(fetchTimersState, 4000); // Poll every 4 seconds
    return () => clearInterval(interval);
  }, [fetchTimersState]);

  useEffect(() => {
    if (!selectedWorkflowId) return;
    setNodes((nds) => nds.map((n) => {
      const isTimer = n.data.name?.toLowerCase().includes('timer') || n.data.label?.toLowerCase().includes('timer');
      if (isTimer) {
        const lastRunKey = `${selectedWorkflowId}_${n.id}_last_interval_run`;
        const lastRun = timersState[lastRunKey];
        if (lastRun && n.data.parameters?.lastRun !== lastRun) {
          return {
            ...n,
            data: {
              ...n.data,
              parameters: {
                ...n.data.parameters,
                lastRun
              }
            }
          };
        }
      }
      return n;
    }));
  }, [timersState, selectedWorkflowId, setNodes]);

  return {
    timersState,
    setTimersState,
    fetchTimersState,
  };
}

