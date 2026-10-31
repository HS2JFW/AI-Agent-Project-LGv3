import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';

export interface UseWorkflowProcessesProps {
  selectedWorkflowId: string | null;
  setSelectedWorkflowId: (id: string | null) => void;
  workflowName: string;
  setWorkflowName: (name: string) => void;
  setWorkflowDesc: (desc: string) => void;
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  agentNodes: Node[];
  setAgentNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  agentEdges: Edge[];
  setAgentEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  selectedNode?: any;
  setSelectedNode: React.Dispatch<React.SetStateAction<any>>;
  setActiveTab: (tab: 'logic' | 'process' | 'settings') => void;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  isRunningRef: React.MutableRefObject<boolean>;
  currentRunId: string | null;
  currentRunIdRef: React.MutableRefObject<string | null>;
  isSubflowModeActive: boolean;
  setIsSubflowModeActive: React.Dispatch<React.SetStateAction<boolean>>;
  selectedProcessNodeIds: string[];
  setSelectedProcessNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
  eventSourceRef: React.MutableRefObject<EventSource | null>;
  logUserAction?: (action: string, meta?: any, ctx?: any) => void;
  handleRunRef?: React.MutableRefObject<any>;
  getWorkflowStep?: (nodeId: string | undefined, category: string | undefined) => number | string;
  showAlert: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
  setCurrentFileName?: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentRunId?: React.Dispatch<React.SetStateAction<string | null>>;
  setIsShowingSettings?: React.Dispatch<React.SetStateAction<boolean>>;
  fetchWorkflowLogs?: (wfId: string) => Promise<any> | void;
  setLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  fetchWorkflows?: (id?: string) => Promise<any> | void;
  backendUrl?: string;
}

export function useWorkflowProcesses({
  selectedWorkflowId,
  setSelectedWorkflowId,
  workflowName,
  setWorkflowName,
  setWorkflowDesc,
  nodes,
  setNodes,
  edges,
  setEdges,
  agentNodes,
  setAgentNodes,
  agentEdges,
  setAgentEdges,
  selectedNode,
  setSelectedNode,
  setActiveTab,
  isRunning,
  setIsRunning,
  isRunningRef,
  currentRunId,
  currentRunIdRef,
  isSubflowModeActive,
  setIsSubflowModeActive,
  selectedProcessNodeIds,
  setSelectedProcessNodeIds,
  eventSourceRef,
  logUserAction = () => {},
  handleRunRef,
  getWorkflowStep = () => 1,
  showAlert,
  setCurrentFileName = () => {},
  setCurrentRunId = () => {},
  setIsShowingSettings = () => {},
  fetchWorkflowLogs = () => {},
  setLogs = () => {},
  fetchWorkflows = () => {},
  backendUrl,
}: UseWorkflowProcessesProps) {
  void selectedNode;
  void edges;
  void agentNodes;
  void agentEdges;
  void selectedProcessNodeIds;
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

  const [processes, setProcesses] = useState<any[]>([]);
  const [processToDelete, setProcessToDelete] = useState<any | null>(null);
  const activeStreamsRef = useRef<Record<string, EventSource>>({});

  const handleStopProcess = async (processId: string) => {

    logUserAction(`Stop Process/Workflow (ID: ${processId})`, { processId }, { file: 'App.tsx', class: 'App', func: 'handleStopProcess', logType: 'process_action' });

    logUserAction(`Workflow Status Changed: Running -> Stopped`, { processId }, { file: 'App.tsx', class: 'App', func: 'handleStopProcess', logType: 'status_change' });

    const proc = processes.find(p => p.id === processId || p.workflowId === processId);

    const wfId = proc ? (proc.workflowId || proc.id) : processId;



    if (isRunning || currentRunId === processId || currentRunId === wfId || currentRunIdRef.current === processId || (processId === 'dummy_id' && isSubflowModeActive)) {

      if (eventSourceRef.current) {

        eventSourceRef.current.close();

        eventSourceRef.current = null;

      }

      setIsRunning(false);

      isRunningRef.current = false;

      setIsSubflowModeActive(false);

      setSelectedProcessNodeIds([]);

      setNodes((nds) => nds.map((n) => {

        const isQueue = (n.data?.nodeType || '').toLowerCase().includes('queue') || (n.type || '').toLowerCase().includes('queue') || (n.data?.name || '').toLowerCase().includes('queue');

        const isTimer = (n.data?.nodeType || '').toLowerCase().includes('timer') || (n.data?.name || '').toLowerCase().includes('timer') || (n.data?.label || '').toLowerCase().includes('timer');

        return {

          ...n,

          selected: false,

          data: {

            ...n.data,

            status: 'idle',

            parameters: {

              ...n.data?.parameters,

              activeSubflow: false,

              schedulerActive: false,

              ...(isQueue ? { currentIndex: 0, hasNext: false } : {}),

              ...(isTimer ? { runCount: 1 } : {})

            }

          }

        };

      }));

      setEdges((eds) => eds.map((edge) => ({ ...edge, className: '' })));

    }



    try {

      await fetch(`${BACKEND_URL}/api/workflows/runs/${processId}/stop`, {

        method: 'POST'

      });

    } catch (e) {

      console.error("Error stopping backend process:", e);

    }



    setProcesses((prev) =>

      prev.map((p) => {

        if (p.id === processId || p.workflowId === processId || p.id === wfId || p.status === 'running' || p.status === 'paused') {

          if (activeStreamsRef.current[p.id]) {

            activeStreamsRef.current[p.id].close();

            delete activeStreamsRef.current[p.id];

          }

          return { ...p, status: 'stopped' };

        }

        return p;

      })

    );



    if (activeStreamsRef.current[processId]) {

      activeStreamsRef.current[processId].close();

      delete activeStreamsRef.current[processId];

    }

    if (wfId && activeStreamsRef.current[wfId]) {

      activeStreamsRef.current[wfId].close();

      delete activeStreamsRef.current[wfId];

    }

  };






  const handleDeleteProcess = async (processId: string) => {

    logUserAction(`Delete Process Record (ID: ${processId})`, { processId }, { file: 'App.tsx', class: 'App', func: 'handleDeleteProcess', logType: 'process_action' });

    logUserAction(`Workflow Status Changed: Process removed from monitor`, { processId }, { file: 'App.tsx', class: 'App', func: 'handleDeleteProcess', logType: 'status_change' });

    if (isRunning && currentRunId === processId) {

      handleStopProcess(processId);

    }



    const targetProc = processes.find((proc) => proc.id === processId);

    const targetWfId = targetProc?.workflowId || processId;



    try {

      if (targetWfId && targetWfId !== 'default' && targetWfId !== 'wf_default') {

        const delRes = await fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(targetWfId)}`, { method: 'DELETE' });

        if (!delRes.ok) {

          console.warn(`[handleDeleteProcess] Failed to delete workflow ${targetWfId}`);

        }

      }

      if (processId && processId !== targetWfId) {

        await fetch(`${BACKEND_URL}/api/workflows/runs/${encodeURIComponent(processId)}`, { method: 'DELETE' }).catch(() => {});

      }

    } catch (e) {

      console.error("Error deleting backend process or workflow:", e);

    }



    // Refresh workflows list and sync process table from backend

    fetchWorkflows();



    setProcesses((prev) => {

      const remaining = prev.filter((proc) => proc.id !== processId && proc.workflowId !== targetWfId);

      if (remaining.length === 0 || (targetProc && (targetProc.workflowId === selectedWorkflowId || targetProc.name === workflowName || processId === selectedWorkflowId))) {

        setNodes([]);

        setEdges([]);

        setAgentNodes([]);

        setAgentEdges([]);

        setSelectedWorkflowId(null);

        setWorkflowName('');

        setWorkflowDesc('');

        setCurrentFileName(null);

      }

      return remaining;

    });



    if (activeStreamsRef.current[processId]) {

      activeStreamsRef.current[processId].close();

      delete activeStreamsRef.current[processId];

    }

    if (targetWfId && activeStreamsRef.current[targetWfId]) {

      activeStreamsRef.current[targetWfId].close();

      delete activeStreamsRef.current[targetWfId];

    }



    showAlert(`Workflow ${targetProc?.name || targetWfId} and all associated folders deleted successfully.`, "Workflow Deleted", "success");

  };



  const handleInspectProcess = (processId: string, tab: 'logic') => {

    const proc = processes.find((p) => p.id === processId || p.workflowId === processId);

    if (!proc) return;



    const wfId = proc.workflowId || proc.id;

    setSelectedWorkflowId(wfId);

    setWorkflowName(proc.name);

    setWorkflowDesc(proc.description || '');

    setNodes(proc.nodes || []);

    setEdges(proc.edges || []);

    setAgentNodes(proc.agentNodes || []);

    setAgentEdges(proc.agentEdges || []);



    if (proc.lastActiveNode) {

      const activeNode = (proc.nodes || []).find((n: any) => n.id === proc.lastActiveNode) ||

                         (proc.agentNodes || []).find((n: any) => n.id === proc.lastActiveNode);

      if (activeNode) {

        setSelectedNode(activeNode);

      }

    } else {

      setSelectedNode(null);

    }



    if (proc.runMode === 'subflow') {

      setIsSubflowModeActive(true);

      if (proc.selectedProcessNodeIds && proc.selectedProcessNodeIds.length > 0) {

        setSelectedProcessNodeIds(proc.selectedProcessNodeIds);

      }

    } else {

      setIsSubflowModeActive(false);

    }



    if (proc.status === 'running') {

      setIsRunning(true);

      isRunningRef.current = true;

      setCurrentRunId(wfId);

    }



    setIsShowingSettings(false);

    fetchWorkflowLogs(wfId);

    setActiveTab(tab);

  };



  const handlePlayProcess = async (processId: string) => {

    logUserAction(`Play/Resume Process (ID: ${processId})`, { processId }, { file: 'App.tsx', class: 'App', func: 'handlePlayProcess', logType: 'process_action' });

    logUserAction(`Workflow Status Changed: Idle/Stopped -> Running`, { processId }, { file: 'App.tsx', class: 'App', func: 'handlePlayProcess', logType: 'status_change' });

    const proc = processes.find(p => p.id === processId || p.workflowId === processId);

    if (!proc) return;



    const wfId = proc.workflowId || proc.id;



    // Immediately mark as running so UI badge changes from IDLE to PROCESS and Play button turns active and pulses!

    setProcesses((prev: any) =>

      prev.map((p: any) =>

        (p.id === processId || p.workflowId === processId || p.id === wfId || p.workflowId === wfId)

          ? { ...p, status: 'running' }

          : p

      )

    );



    if (selectedWorkflowId !== wfId && wfId !== 'default') {

      setSelectedWorkflowId(wfId);

      setWorkflowName(proc.name || 'Saved Workflow');

      setWorkflowDesc(proc.description || '');

      setNodes(proc.nodes || []);

      setEdges(proc.edges || []);

      setAgentNodes(proc.agentNodes || []);

      setAgentEdges(proc.agentEdges || []);

    }



    const mode = proc.runMode || 'full';

    const subflowIds = proc.selectedProcessNodeIds || [];



    if (mode === 'subflow' && subflowIds.length > 0) {

      setSelectedProcessNodeIds(subflowIds);

      setIsSubflowModeActive(true);

      if (handleRunRef?.current) {

        await handleRunRef.current?.(subflowIds, proc.nodes || nodes, false, wfId);

      }

    } else {

      setIsSubflowModeActive(false);

      if (handleRunRef?.current) {

        await handleRunRef.current?.(undefined, proc.nodes || nodes, false, wfId);

      }

    }

  };




  const fetchProcesses = useCallback(async (workflowId?: string) => {

    const wfId = workflowId || selectedWorkflowId;

    if (!wfId) return;

    try {

      const res = await fetch(`${BACKEND_URL}/api/workflows/${wfId}/runs`);

      if (res.ok) {

        const data = await res.json();

        if (Array.isArray(data)) {

          const mapped = data.map((run: any) => {

          const step = getWorkflowStep(run.current_node_id, undefined);

          return {

            id: run.id,

            workflowId: run.workflow_id,

            name: run.name || 'Workflow Run',

            description: run.description || '',

            startTime: run.created_at,

            status: run.status,

            currentStep: step,

            lastActiveNode: run.current_node_id || '',

            nodes: run.nodes && run.nodes.length > 0 ? run.nodes : [],

            edges: run.edges && run.edges.length > 0 ? run.edges : [],

            agentNodes: run.agentNodes && run.agentNodes.length > 0 ? run.agentNodes : [],

            agentEdges: run.agentEdges && run.agentEdges.length > 0 ? run.agentEdges : []

          };

        });

        setProcesses((prev) => {

          const processMap = new Map();

          prev.forEach((p) => processMap.set(p.workflowId || p.id, p));

          mapped.forEach((m: any) => {

            const key = m.workflowId || m.id;

            if (processMap.has(key)) {

              const existing = processMap.get(key);

              processMap.set(key, { ...existing, status: m.status || existing.status, currentStep: m.currentStep || existing.currentStep, lastActiveNode: m.lastActiveNode || existing.lastActiveNode });

            }

          });

          return Array.from(processMap.values());

        });

        }

      }

    } catch (e) {

      console.error("Error fetching workflow runs", e);

    }

  }, [selectedWorkflowId]);



  useEffect(() => {

    if (selectedWorkflowId) {

      fetchProcesses(selectedWorkflowId);

    }

  }, [selectedWorkflowId, fetchProcesses]);



  useEffect(() => {

    const runningProcs = processes.filter(p => p.status === 'running');

    

    runningProcs.forEach((proc) => {

      if (activeStreamsRef.current[proc.id]) return; // Already listening

      

      const targetRunId = proc.activeRunId || proc.id;

      const eventSource = new EventSource(`${BACKEND_URL}/api/workflows/runs/${targetRunId}/stream`);

      activeStreamsRef.current[proc.id] = eventSource;

      

      eventSource.addEventListener('log', (e: any) => {

        try {

          const data = JSON.parse(e.data);

          const wfId = proc.workflowId || proc.id;

          

          setLogs((prev: any) => [

            ...prev,

            {

              timestamp: data.timestamp || new Date().toISOString(),

              level: (data.level === 'ERROR' || data.level === 'SUCCESS' ? data.level : 'INFO') as 'INFO' | 'ERROR' | 'SUCCESS',

              message: data.message || '',

              source_file: 'WF/' + wfId + '/log/' + proc.id + '.log',

              log_type: 'general' as any

            }

          ]);

        } catch (err) {

          console.error("Failed to parse log event", err);

        }

      });

      

      eventSource.addEventListener('node_active', (e: any) => {

        const data = JSON.parse(e.data);

        const activeId = data.node_id;

        

        setProcesses((prev) =>

          prev.map((p) => {

            if (p.id === proc.id) {

              const matchedNode = p.nodes.find((n: any) => n.id === activeId) ||

                                  p.agentNodes.find((n: any) => n.id === activeId);

              const category = matchedNode?.data?.category;

              const step = getWorkflowStep(activeId, category);

              

              return {

                ...p,

                lastActiveNode: activeId,

                currentStep: step

              };

            }

            return p;

          })

        );

      });

      

      eventSource.addEventListener('node_complete', (e: any) => {

        const data = JSON.parse(e.data);

        const { node_id, outputs } = data;

        

        setProcesses((prev) =>

          prev.map((p) => {

            if (p.id === proc.id) {

              const updatedNodes = p.nodes.map((n: any) => {

                if (n.id === node_id) {

                  return {

                    ...n,

                    data: {

                      ...n.data,

                      parameters: { ...n.data.parameters, ...outputs }

                    }

                  };

                }

                return n;

              });

              return { ...p, nodes: updatedNodes };

            }

            return p;

          })

        );



        setNodes((nds) =>

          nds.map((n) => {

            if (n.id === node_id) {

              return {

                ...n,

                data: {

                  ...n.data,

                  parameters: { ...n.data.parameters, ...outputs }

                }

              };

            }

            return n;

          })

        );

        

        setSelectedNode((prev: any) => {

          if (prev && prev.id === node_id) {

            return {

              ...prev,

              data: {

                ...prev.data,

                parameters: { ...prev.data.parameters, ...outputs }

              }

            };

          }

          return prev;

        });

      });

      

      eventSource.addEventListener('complete', (e: any) => {

        const data = JSON.parse(e.data);

        setProcesses((prev) =>

          prev.map((p) => {

            if (p.id === proc.id) {

              return {

                ...p,

                status: data.status === 'success' ? 'success' : 'failed',

                currentStep: 6

              };

            }

            return p;

          })

        );

        eventSource.close();

        delete activeStreamsRef.current[proc.id];

      });

      

      eventSource.onerror = () => {

        setProcesses((prev) =>

          prev.map((p) => {

            if (p.id === proc.id) {

              return { ...p, status: 'failed' };

            }

            return p;

          })

        );

        eventSource.close();

        delete activeStreamsRef.current[proc.id];

      };

    });

    

    // Clean up streams for completed/non-running processes

    Object.keys(activeStreamsRef.current).forEach((id) => {

      const isStillRunning = processes.some(p => p.id === id && p.status === 'running');

      if (!isStillRunning) {

        try {

          activeStreamsRef.current[id].close();

        } catch {}

        delete activeStreamsRef.current[id];

      }

    });

  }, [processes]);




  return {
    processes,
    setProcesses,
    processToDelete,
    setProcessToDelete,
    activeStreamsRef,
    handleStopProcess,
    handleDeleteProcess,
    handleInspectProcess,
    handlePlayProcess,
    fetchProcesses,
  };
}
