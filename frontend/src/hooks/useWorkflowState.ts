import { useState, useCallback } from 'react';
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge
} from 'reactflow';

export interface WorkflowStateSnapshot {
  nodes: Node[];
  edges: Edge[];
  agentNodes: Node[];
  agentEdges: Edge[];
}

export interface UseWorkflowStateOptions {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  initialAgentNodes?: Node[];
  initialAgentEdges?: Edge[];
  initialWorkflowName?: string;
  initialWorkflowDesc?: string;
  historyLimit?: number;
}

export function useWorkflowState(options: UseWorkflowStateOptions = {}) {
  const {
    initialNodes = [],
    initialEdges = [],
    initialAgentNodes = [],
    initialAgentEdges = [],
    initialWorkflowName = 'My AI Agent Workflow',
    initialWorkflowDesc = 'Automated TOR audit and risk evaluation flow',
    historyLimit: initialHistoryLimit = 50
  } = options;

  // 1. Workflow Metadata
  const [workflowName, setWorkflowName] = useState<string>(initialWorkflowName);
  const [workflowDesc, setWorkflowDesc] = useState<string>(initialWorkflowDesc);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);

  // 2. Main Logic Canvas Elements
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 3. Agent Sub-canvas Elements
  const [agentNodes, setAgentNodes, onAgentNodesChange] = useNodesState(initialAgentNodes);
  const [agentEdges, setAgentEdges, onAgentEdgesChange] = useEdgesState(initialAgentEdges);

  // 4. Selection State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // 5. Undo / Redo History
  const [past, setPast] = useState<WorkflowStateSnapshot[]>([]);
  const [future, setFuture] = useState<WorkflowStateSnapshot[]>([]);
  const [historyLimit, setHistoryLimit] = useState<number>(initialHistoryLimit);

  const takeSnapshot = useCallback(() => {
    const currentStateCloned: WorkflowStateSnapshot = JSON.parse(
      JSON.stringify({ nodes, edges, agentNodes, agentEdges })
    );
    setPast((prevPast) => {
      const nextPast = [...prevPast, currentStateCloned];
      if (nextPast.length > historyLimit) {
        nextPast.shift();
      }
      return nextPast;
    });
    setFuture([]);
  }, [nodes, edges, agentNodes, agentEdges, historyLimit]);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previousState = past[past.length - 1];
    if (!previousState) return;

    const currentStateCloned: WorkflowStateSnapshot = JSON.parse(
      JSON.stringify({ nodes, edges, agentNodes, agentEdges })
    );
    setFuture((prevFuture) => [...prevFuture, currentStateCloned]);

    const restoredState: WorkflowStateSnapshot = JSON.parse(JSON.stringify(previousState));
    setNodes(restoredState.nodes);
    setEdges(restoredState.edges);
    setAgentNodes(restoredState.agentNodes);
    setAgentEdges(restoredState.agentEdges);

    if (selectedNode) {
      const syncedNode =
        restoredState.nodes.find((n) => n.id === selectedNode.id) ||
        restoredState.agentNodes.find((n) => n.id === selectedNode.id);
      setSelectedNode(syncedNode || null);
    }

    setPast((prevPast) => prevPast.slice(0, -1));
  }, [past, nodes, edges, agentNodes, agentEdges, selectedNode, setNodes, setEdges, setAgentNodes, setAgentEdges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const nextState = future[future.length - 1];
    if (!nextState) return;

    const currentStateCloned: WorkflowStateSnapshot = JSON.parse(
      JSON.stringify({ nodes, edges, agentNodes, agentEdges })
    );
    setPast((prevPast) => {
      const nextPast = [...prevPast, currentStateCloned];
      if (nextPast.length > historyLimit) {
        nextPast.shift();
      }
      return nextPast;
    });

    const restoredState: WorkflowStateSnapshot = JSON.parse(JSON.stringify(nextState));
    setNodes(restoredState.nodes);
    setEdges(restoredState.edges);
    setAgentNodes(restoredState.agentNodes);
    setAgentEdges(restoredState.agentEdges);

    if (selectedNode) {
      const syncedNode =
        restoredState.nodes.find((n) => n.id === selectedNode.id) ||
        restoredState.agentNodes.find((n) => n.id === selectedNode.id);
      setSelectedNode(syncedNode || null);
    }

    setFuture((prevFuture) => prevFuture.slice(0, -1));
  }, [future, nodes, edges, agentNodes, agentEdges, historyLimit, selectedNode, setNodes, setEdges, setAgentNodes, setAgentEdges]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    // Metadata
    workflowName,
    setWorkflowName,
    workflowDesc,
    setWorkflowDesc,
    currentWorkflowId,
    setCurrentWorkflowId,

    // Main Canvas
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,

    // Agent Sub-canvas
    agentNodes,
    setAgentNodes,
    onAgentNodesChange,
    agentEdges,
    setAgentEdges,
    onAgentEdgesChange,

    // Selection
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,

    // Undo / Redo
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    past,
    setPast,
    future,
    setFuture,
    historyLimit,
    setHistoryLimit,
  };
}

