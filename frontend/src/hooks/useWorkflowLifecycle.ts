import { useCallback, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import {
  sanitizeLoadedNodes,
  buildAgentNodesFromLogicNodes,
  buildAgentEdgesFromLogicEdges,
} from '../utils/nodeGraphUtils';

export interface UseWorkflowLifecycleProps {
  workflowName: string;
  setWorkflowName: React.Dispatch<React.SetStateAction<string>>;
  workflowDesc: string;
  setWorkflowDesc: React.Dispatch<React.SetStateAction<string>>;
  historyLimit: number;
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  agentNodes: Node[];
  setAgentNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  agentEdges: Edge[];
  setAgentEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  aiModels: any[];
  setAiModels: React.Dispatch<React.SetStateAction<any[]>>;
  selectedWorkflowId: string | null;
  setSelectedWorkflowId: React.Dispatch<React.SetStateAction<string | null>>;
  setWorkflows: React.Dispatch<React.SetStateAction<any[]>>;
  setProcesses: React.Dispatch<React.SetStateAction<any[]>>;
  setShowCreateWorkflowDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: React.Dispatch<React.SetStateAction<'logic' | 'process' | 'settings'>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node | null>>;
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  setPast: React.Dispatch<React.SetStateAction<any[]>>;
  setFuture: React.Dispatch<React.SetStateAction<any[]>>;
  fetchProcesses: (activeWfId?: string) => Promise<void>;
  fetchWorkflowLogs: (wfId: string) => Promise<void>;
  fetchWorkflowsRef: React.MutableRefObject<any>;
  setLastSavedState: React.Dispatch<React.SetStateAction<string>>;
  backendUrl: string;
}

export function useWorkflowLifecycle({
  workflowName,
  setWorkflowName,
  workflowDesc,
  setWorkflowDesc,
  historyLimit,
  nodes,
  setNodes,
  edges,
  setEdges,
  agentNodes,
  setAgentNodes,
  agentEdges,
  setAgentEdges,
  aiModels,
  setAiModels,
  selectedWorkflowId,
  setSelectedWorkflowId,
  setWorkflows,
  setProcesses,
  setShowCreateWorkflowDialog,
  setActiveTab,
  setSelectedNode,
  setLogs,
  setPast,
  setFuture,
  fetchProcesses,
  fetchWorkflowLogs,
  fetchWorkflowsRef,
  setLastSavedState,
  backendUrl,
}: UseWorkflowLifecycleProps) {
  // Helper to serialize current state for comparison and saving
  const serializeCurrentState = useCallback(() => {
    return JSON.stringify({
      name: workflowName,
      description: workflowDesc,
      historyLimit,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        animated: e.animated,
      })),
      agentNodes: agentNodes.map((n) => ({
        id: n.id,
        type: n.type,
        parentNode: n.parentNode,
        extent: n.extent,
        position: n.position,
        style: n.style,
        data: n.data,
        draggable: n.draggable,
      })),
      agentEdges: agentEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        style: e.style,
        animated: e.animated,
      })),
      aiModels,
    });
  }, [workflowName, workflowDesc, historyLimit, nodes, edges, agentNodes, agentEdges, aiModels]);

  const loadWorkflowData = useCallback(
    (wf: any) => {
      setSelectedWorkflowId(wf.id);
      setWorkflowName(wf.name);
      setWorkflowDesc(wf.description || '');

      // Defensive check: Ensure all loaded nodes have a valid position to prevent React Flow crashes
      const sanitizedNodes = sanitizeLoadedNodes(wf.nodes || []);
      setNodes(sanitizedNodes);
      setEdges(wf.edges || []);

      // Load or reconstruct agent nodes and edges
      if (wf.agentNodes && wf.agentNodes.length > 0) {
        const sanitizedAgentNodes = sanitizeLoadedNodes(wf.agentNodes || []);
        setAgentNodes(sanitizedAgentNodes);
        setAgentEdges(wf.agentEdges || []);
      } else {
        setAgentNodes(buildAgentNodesFromLogicNodes(sanitizedNodes));
        setAgentEdges(buildAgentEdgesFromLogicEdges(wf.edges || []));
      }

      if (wf.aiModels && Array.isArray(wf.aiModels) && wf.aiModels.length > 0) {
        setAiModels((prev) => {
          const newModels = [...prev];
          wf.aiModels.forEach((m: any) => {
            if (!newModels.find((nm) => nm.id === m.id || nm.modelName === m.modelName)) {
              newModels.push(m);
            }
          });
          return newModels;
        });
      }

      setSelectedNode(null);
      setLogs([]);
      setPast([]);
      setFuture([]);
      fetchProcesses(wf.id);
      fetchWorkflowLogs(wf.id);
    },
    [
      fetchProcesses,
      fetchWorkflowLogs,
      setAgentEdges,
      setAgentNodes,
      setAiModels,
      setEdges,
      setFuture,
      setLogs,
      setNodes,
      setPast,
      setSelectedNode,
      setSelectedWorkflowId,
      setWorkflowDesc,
      setWorkflowName,
    ]
  );

  const init_process_workflow = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/init-process`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[INIT] Backend reported ${data.count} processes in WF folder.`, data.processes);
        if (data.count === 0) {
          setShowCreateWorkflowDialog(true);
          setActiveTab('logic');
        } else {
          setShowCreateWorkflowDialog(false);
          setActiveTab('process');
        }
      }
    } catch (e) {
      console.error('Error calling /api/init-process:', e);
    }
  }, [backendUrl, setActiveTab, setShowCreateWorkflowDialog]);

  const fetchWorkflows = useCallback(
    async (activeWfId?: string) => {
      fetchWorkflowsRef.current = fetchWorkflows;

      try {
        const res = await fetch(`${backendUrl}/api/workflows`);
        if (res.ok) {
          const data = await res.json();
          setWorkflows(data);

          // Fetch active states from backend for hydration
          let activeStates: Record<string, any> = {};
          try {
            const stateRes = await fetch(`${backendUrl}/api/processes/active-state`);
            if (stateRes.ok) {
              activeStates = await stateRes.json();
            }
          } catch (stateErr) {
            console.error('Failed to fetch active states', stateErr);
          }

          const currentId = activeWfId || selectedWorkflowId;
          if (data && data.length > 0) {
            // Synchronize saved database/JSON workflows into Process monitor table (1 Workflow = 1 Process)
            setProcesses((prev) => {
              const processMap = new Map();
              prev.forEach((p) => processMap.set(p.workflowId || p.id, p));
              data.forEach((wf: any) => {
                const hydration = activeStates[wf.id] || {};
                let defaultStatus = hydration.status || 'idle';
                if (defaultStatus === 'completed') defaultStatus = 'success';
                const defaultNode = hydration.current_node_id || '';
                const activeRunId = hydration.run_id || '';

                if (!processMap.has(wf.id)) {
                  processMap.set(wf.id, {
                    id: wf.id,
                    activeRunId,
                    workflowId: wf.id,
                    name: wf.name || 'Saved Workflow',
                    description: wf.description || '',
                    startTime: wf.created_at || new Date().toISOString(),
                    createdAt: wf.created_at || wf.createdAt || new Date().toISOString(),
                    status: defaultStatus,
                    runMode: 'full',
                    selectedProcessNodeIds: [],
                    currentStep: 1,
                    lastActiveNode: defaultNode,
                    nodes: wf.nodes || [],
                    edges: wf.edges || [],
                    agentNodes: wf.agentNodes || [],
                    agentEdges: wf.agentEdges || [],
                  });
                } else {
                  const existing = processMap.get(wf.id);
                  processMap.set(wf.id, {
                    ...existing,
                    activeRunId: activeRunId || existing.activeRunId,
                    status: existing.status === 'idle' && defaultStatus !== 'idle' ? defaultStatus : existing.status,
                    lastActiveNode: existing.lastActiveNode || defaultNode,
                    name: wf.name || existing.name,
                    description: wf.description || existing.description,
                    createdAt:
                      existing.createdAt ||
                      wf.created_at ||
                      wf.createdAt ||
                      existing.startTime ||
                      new Date().toISOString(),
                    nodes: wf.nodes && wf.nodes.length > 0 ? wf.nodes : existing.nodes,
                    edges: wf.edges && wf.edges.length > 0 ? wf.edges : existing.edges,
                    agentNodes: wf.agentNodes && wf.agentNodes.length > 0 ? wf.agentNodes : existing.agentNodes,
                    agentEdges: wf.agentEdges && wf.agentEdges.length > 0 ? wf.agentEdges : existing.agentEdges,
                  });
                }
              });
              return Array.from(processMap.values());
            });

            // On app startup, if existing workflows are found, navigate directly to Process dashboard without flashing!
            if (!currentId) {
              loadWorkflowData(data[0]);
              setShowCreateWorkflowDialog(false);
              setActiveTab('process');
            }
          }
        }
      } catch (e) {
        console.error('Error fetching workflows', e);
      }
    },
    [
      backendUrl,
      fetchWorkflowsRef,
      loadWorkflowData,
      selectedWorkflowId,
      setActiveTab,
      setProcesses,
      setShowCreateWorkflowDialog,
      setWorkflows,
    ]
  );

  // Effect to load workflows and setup processes on mount
  useEffect(() => {
    init_process_workflow();
    fetchWorkflows();

    // Initialize lastSavedState with initial canvas state
    const initialState = JSON.stringify({
      name: '',
      description: '',
      historyLimit: 50,
      nodes: [],
      edges: [],
      agentNodes: [],
      agentEdges: [],
    });
    setLastSavedState(initialState);
  }, [fetchWorkflows, init_process_workflow, setLastSavedState]);

  return {
    serializeCurrentState,
    init_process_workflow,
    fetchWorkflows,
    loadWorkflowData,
  };
}

