import { useState, useEffect } from 'react';
import { type LogMessage } from '../constants/defaultWorkflow';

export interface UseWorkflowAuditLogsProps {
  selectedWorkflowId: string | null;
  currentRunId: string | null;
  activeTab: 'logic' | 'process';
  showLogsTray: boolean;
  activeLogTab: 'process' | 'system' | 'ai';
  backendUrl: string;
}

export function useWorkflowAuditLogs({
  selectedWorkflowId,
  currentRunId,
  activeTab,
  showLogsTray,
  activeLogTab,
  backendUrl,
}: UseWorkflowAuditLogsProps) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [workflowLogsMap, setWorkflowLogsMap] = useState<Record<string, LogMessage[]>>({});
  const [systemLogs, setSystemLogs] = useState<string>('');
  const [aiLogs, setAiLogs] = useState<string>('');

  const saveLogToBackend = (wfId?: string | null, logEntry?: LogMessage | null) => {
    if (!wfId || !logEntry) return;
    try {
      fetch(`${backendUrl}/api/workflows/${wfId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: logEntry })
      }).catch(() => {});
    } catch (e) {}
  };

  const appendGlobalLog = (msg: string, lvl: 'INFO' | 'ERROR' | 'SUCCESS' = 'INFO') => {
    const entry: LogMessage = {
      message: msg,
      level: lvl,
      timestamp: new Date().toISOString()
    };
    setLogs((prev) => [...prev, entry]);
    if (selectedWorkflowId) {
      setWorkflowLogsMap((prev) => ({ ...prev, [selectedWorkflowId]: [...(prev[selectedWorkflowId] || []), entry] }));
      saveLogToBackend(selectedWorkflowId, entry);
    }
  };

  const fetchWorkflowLogs = async (wfId: string) => {
    if (!wfId) return;
    try {
      const res = await fetch(`${backendUrl}/api/workflows/${wfId}/logs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          const parsed: LogMessage[] = data.logs.map((l: any) => ({
            timestamp: l.timestamp || new Date().toISOString(),
            level: (l.level === 'ERROR' || l.level === 'SUCCESS' ? l.level : 'INFO') as 'INFO' | 'ERROR' | 'SUCCESS',
            message: l.message || '',
            source_file: 'WF/' + wfId + '/log/' + wfId + '.log',
            log_type: 'general' as any
          }));
          setWorkflowLogsMap(prev => ({ ...prev, [wfId]: parsed }));
          if (selectedWorkflowId === wfId) {
            setLogs(parsed);
          }
        }
      }
    } catch (e) {
      console.error(`[fetchWorkflowLogs] Failed for ${wfId}:`, e);
    }
  };

  const clearWorkflowLogs = async (wfId?: string) => {
    if (wfId) {
      setWorkflowLogsMap(prev => ({ ...prev, [wfId]: [] }));
      if (selectedWorkflowId === wfId || currentRunId === wfId) {
        setLogs([]);
      }
      try {
        await fetch(`${backendUrl}/api/workflows/${wfId}/logs`, { method: 'DELETE' });
      } catch (e) {
        console.error(`[clearWorkflowLogs] Failed to delete logs from disk for ${wfId}:`, e);
      }
    } else {
      setLogs([]);
      if (selectedWorkflowId) {
        setWorkflowLogsMap(prev => ({ ...prev, [selectedWorkflowId]: [] }));
        try {
          await fetch(`${backendUrl}/api/workflows/${selectedWorkflowId}/logs`, { method: 'DELETE' });
        } catch (e) {}
      }
    }
  };

  const logUserAction = (
    action: string, 
    details?: any, 
    meta?: { file?: string; class?: string; func?: string; logType?: 'general' | 'process_action' | 'status_change' }
  ) => {
    const file = meta?.file || 'App.tsx';
    const cls = meta?.class || (activeTab === 'process' ? 'ProcessMonitor' : 'LogicWorkspace');
    let func = meta?.func || 'anonymous';
    if (func === 'anonymous') {
      try {
        const stack = new Error().stack?.split('\n') || [];
        for (let i = 2; i < stack.length; i++) {
          const line = stack[i].trim();
          if (line && !line.includes('logUserAction') && !line.includes('react-dom') && !line.includes('react_devtools')) {
            const match = line.match(/at\s+([^\s(]+)/);
            if (match && match[1] !== 'Object.<anonymous>') {
              const name = match[1].split('.').pop() || match[1];
              if (name !== 'onClick' && name !== 'anonymous') { func = name; break; }
            }
          }
        }
      } catch (e) {}
    }
    const logType = meta?.logType || (
      action.toLowerCase().includes('stop') || action.toLowerCase().includes('start') || action.toLowerCase().includes('play') || action.toLowerCase().includes('delete') || action.toLowerCase().includes('import') || action.toLowerCase().includes('export') || action.toLowerCase().includes('clear')
        ? 'process_action'
        : action.toLowerCase().includes('status')
        ? 'status_change'
        : 'general'
    );

    const sourceTag = `[File: ${file} | Class: ${cls} | Function: ${func}]`;
    const actionMessage = `${sourceTag} ${action} ${details?.workflowName ? `[Workflow: ${details.workflowName}]` : ''}`;

    setLogs(prev => [
      ...prev,
      {
        message: actionMessage,
        level: logType === 'status_change' ? 'SUCCESS' : 'INFO',
        timestamp: new Date().toISOString(),
        source_file: file,
        source_class: cls,
        source_function: func,
        log_type: logType
      }
    ]);

    fetch(`${backendUrl}/api/audit-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, tab: activeTab, source: { file, class: cls, function: func } })
    }).catch(err => console.error("Failed to log user action:", err));
  };

  useEffect(() => {
    let intervalId: any;
    if (showLogsTray && (activeLogTab === 'system' || activeLogTab === 'ai')) {
      const fetchLogs = async () => {
        try {
          if (activeLogTab === 'system') {
            const res = await fetch(`${backendUrl}/api/system-logs`);
            if (res.ok) {
              const data = await res.json();
              setSystemLogs(data.logs);
            }
          } else if (activeLogTab === 'ai') {
            const res = await fetch(`${backendUrl}/api/ai-logs`);
            if (res.ok) {
              const data = await res.json();
              setAiLogs(data.logs);
            }
          }
        } catch (e) {
          console.error("Error fetching logs", e);
        }
      };
      fetchLogs();
      intervalId = setInterval(fetchLogs, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showLogsTray, activeLogTab, backendUrl]);

  return {
    logs,
    setLogs,
    workflowLogsMap,
    setWorkflowLogsMap,
    systemLogs,
    setSystemLogs,
    aiLogs,
    setAiLogs,
    saveLogToBackend,
    appendGlobalLog,
    fetchWorkflowLogs,
    clearWorkflowLogs,
    logUserAction,
  };
}
