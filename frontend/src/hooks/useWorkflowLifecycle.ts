import { useCallback, useEffect, useRef } from 'react';
import type { Node, Edge } from 'reactflow';
import {
  sanitizeLoadedNodes,
  buildAgentNodesFromLogicNodes,
  buildAgentEdgesFromLogicEdges,
} from '../utils/nodeGraphUtils';
import { getAuthHeaders } from '../utils/apiConfig';

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
  const isInitialMountRef = useRef(true);
  const selectedWorkflowIdRef = useRef(selectedWorkflowId);
  useEffect(() => {
    selectedWorkflowIdRef.current = selectedWorkflowId;
  }, [selectedWorkflowId]);

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

      let rawNodes = wf.nodes;
      if (typeof rawNodes === 'string') {
        try { rawNodes = JSON.parse(rawNodes); } catch (e) { rawNodes = []; }
      }
      let rawEdges = wf.edges;
      if (typeof rawEdges === 'string') {
        try { rawEdges = JSON.parse(rawEdges); } catch (e) { rawEdges = []; }
      }
      let rawAgentNodes = wf.agentNodes || wf.agent_nodes;
      if (typeof rawAgentNodes === 'string') {
        try { rawAgentNodes = JSON.parse(rawAgentNodes); } catch (e) { rawAgentNodes = []; }
      }
      let rawAgentEdges = wf.agentEdges || wf.agent_edges;
      if (typeof rawAgentEdges === 'string') {
        try { rawAgentEdges = JSON.parse(rawAgentEdges); } catch (e) { rawAgentEdges = []; }
      }

      // Defensive check: Ensure all loaded nodes have a valid position to prevent React Flow crashes
      const sanitizedNodes = sanitizeLoadedNodes(rawNodes || []);
      setNodes(sanitizedNodes);
      setEdges(Array.isArray(rawEdges) ? rawEdges : []);

      // Load or reconstruct agent nodes and edges
      if (Array.isArray(rawAgentNodes) && rawAgentNodes.length > 0) {
        const sanitizedAgentNodes = sanitizeLoadedNodes(rawAgentNodes);
        setAgentNodes(sanitizedAgentNodes);
        setAgentEdges(Array.isArray(rawAgentEdges) ? rawAgentEdges : []);
      } else {
        setAgentNodes(buildAgentNodesFromLogicNodes(sanitizedNodes));
        setAgentEdges(buildAgentEdgesFromLogicEdges(Array.isArray(rawEdges) ? rawEdges : []));
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
      const res = await fetch(`${backendUrl}/api/init-process`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[INIT] Backend reported ${data.count} processes in WF folder.`, data.processes);
        // Only run navigation redirect on initial mount
        if (isInitialMountRef.current) {
          if (data.count === 0) {
            setShowCreateWorkflowDialog(true);
            setActiveTab('logic');
          } else {
            setShowCreateWorkflowDialog(false);
            setActiveTab('process');
          }
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
        const res = await fetch(`${backendUrl}/api/workflows`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setWorkflows(data);

          // Fetch active states from backend for hydration
          let activeStates: Record<string, any> = {};
          try {
            const stateRes = await fetch(`${backendUrl}/api/processes/active-state`, {
              headers: getAuthHeaders(),
            });
            if (stateRes.ok) {
              activeStates = await stateRes.json();
            }
          } catch (stateErr) {
            console.error('Failed to fetch active states', stateErr);
          }

          const currentId = activeWfId || selectedWorkflowIdRef.current;
          // Synchronize saved database workflows into Process monitor table (1 Workflow = 1 Process)
          setProcesses((prev) => {
            const prevMap = new Map();
            prev.forEach((p) => prevMap.set(p.workflowId || p.id, p));

            const newProcesses = (data || []).map((wf: any) => {
              const hydration = activeStates[wf.id] || {};
              const existing = prevMap.get(wf.id);
              let defaultStatus = hydration.status || existing?.status || 'idle';
              if (defaultStatus === 'completed') defaultStatus = 'success';
              const defaultNode = hydration.current_node_id || existing?.lastActiveNode || '';
              const activeRunId = hydration.run_id || existing?.activeRunId || '';

              let parsedNodes = wf.nodes;
              if (typeof parsedNodes === 'string') {
                try { parsedNodes = JSON.parse(parsedNodes); } catch (e) { parsedNodes = []; }
              }
              let parsedEdges = wf.edges;
              if (typeof parsedEdges === 'string') {
                try { parsedEdges = JSON.parse(parsedEdges); } catch (e) { parsedEdges = []; }
              }
              let parsedAgentNodes = wf.agentNodes || wf.agent_nodes;
              if (typeof parsedAgentNodes === 'string') {
                try { parsedAgentNodes = JSON.parse(parsedAgentNodes); } catch (e) { parsedAgentNodes = []; }
              }
              let parsedAgentEdges = wf.agentEdges || wf.agent_edges;
              if (typeof parsedAgentEdges === 'string') {
                try { parsedAgentEdges = JSON.parse(parsedAgentEdges); } catch (e) { parsedAgentEdges = []; }
              }

              return {
                id: wf.id,
                activeRunId,
                workflowId: wf.id,
                name: wf.name || existing?.name || 'Saved Workflow',
                description: wf.description !== undefined ? wf.description : (existing?.description || ''),
                color: wf.color || existing?.color || 'blue',
                group_id: wf.group_id || existing?.group_id || null,
                owner_id: wf.owner_id,
                owner_username: wf.owner_username,
                is_public: Boolean(wf.is_public),
                is_shared: Boolean(wf.is_shared),
                share_permission: wf.share_permission,
                can_edit: wf.can_edit !== undefined ? wf.can_edit : true,
                can_delete: wf.can_delete !== undefined ? wf.can_delete : true,
                startTime: wf.created_at || existing?.startTime || new Date().toISOString(),
                createdAt: wf.created_at || wf.createdAt || existing?.createdAt || new Date().toISOString(),
                status: defaultStatus,
                runMode: 'full',
                selectedProcessNodeIds: existing?.selectedProcessNodeIds || [],
                currentStep: existing?.currentStep || 1,
                lastActiveNode: defaultNode,
                nodes: Array.isArray(parsedNodes) && parsedNodes.length > 0 ? parsedNodes : (existing?.nodes || []),
                edges: Array.isArray(parsedEdges) && parsedEdges.length > 0 ? parsedEdges : (existing?.edges || []),
                agentNodes: Array.isArray(parsedAgentNodes) && parsedAgentNodes.length > 0 ? parsedAgentNodes : (existing?.agentNodes || []),
                agentEdges: Array.isArray(parsedAgentEdges) && parsedAgentEdges.length > 0 ? parsedAgentEdges : (existing?.agentEdges || []),
              };
            });

            return newProcesses;
          });

          // On initial startup, if existing workflows are found, navigate directly to Process dashboard
          if (isInitialMountRef.current && !currentId && data && data.length > 0) {
            isInitialMountRef.current = false;
            loadWorkflowData(data[0]);
            setShowCreateWorkflowDialog(false);
            setActiveTab('process');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    serializeCurrentState,
    init_process_workflow,
    fetchWorkflows,
    loadWorkflowData,
  };
}

