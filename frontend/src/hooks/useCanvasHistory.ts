import { useState, useRef, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';

export interface HistoryStateSnapshot {
  nodes: Node[];
  edges: Edge[];
  agentNodes: Node[];
  agentEdges: Edge[];
}

export interface UseCanvasHistoryProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  agentNodes: Node[];
  setAgentNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  agentEdges: Edge[];
  setAgentEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  selectedNode: any;
  setSelectedNode: React.Dispatch<React.SetStateAction<any>>;
  initialHistoryLimit?: number;
  logUserAction?: (action: string, meta?: any, ctx?: any) => void;
  selectedProcessNodeIds?: string[];
}

export function useCanvasHistory({
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
  initialHistoryLimit = 50,
  logUserAction = () => {},
  selectedProcessNodeIds = [],
}: UseCanvasHistoryProps) {
  const [past, setPast] = useState<HistoryStateSnapshot[]>([]);
  const [future, setFuture] = useState<HistoryStateSnapshot[]>([]);
  const [historyLimit, setHistoryLimit] = useState<number>(initialHistoryLimit);

  // Dragging and Editing start state refs
  const dragStartStateRef = useRef<HistoryStateSnapshot | null>(null);
  const propertyEditStartStateRef = useRef<HistoryStateSnapshot | null>(null);

  // Save current state as history snapshot
  const takeSnapshot = useCallback(() => {
    const currentStateCloned: HistoryStateSnapshot = JSON.parse(
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

    // Deep clone the current state to save in future
    const currentStateCloned: HistoryStateSnapshot = JSON.parse(
      JSON.stringify({ nodes, edges, agentNodes, agentEdges })
    );
    setFuture((prevFuture) => [...prevFuture, currentStateCloned]);

    // Restore previous state (deep cloned to prevent subsequent mutations from affecting history)
    const restoredState: HistoryStateSnapshot = JSON.parse(JSON.stringify(previousState));
    setNodes(restoredState.nodes);
    setEdges(restoredState.edges);
    setAgentNodes(restoredState.agentNodes);
    setAgentEdges(restoredState.agentEdges);

    if (selectedNode) {
      const syncedNode =
        restoredState.nodes.find((n: any) => n.id === selectedNode.id) ||
        restoredState.agentNodes.find((n: any) => n.id === selectedNode.id);
      setSelectedNode(syncedNode || null);
    }

    // Remove the last state from past
    setPast((prevPast) => prevPast.slice(0, -1));
  }, [past, nodes, edges, agentNodes, agentEdges, selectedNode, setNodes, setEdges, setAgentNodes, setAgentEdges, setSelectedNode]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const nextState = future[future.length - 1];
    if (!nextState) return;

    // Deep clone current state to save in past
    const currentStateCloned: HistoryStateSnapshot = JSON.parse(
      JSON.stringify({ nodes, edges, agentNodes, agentEdges })
    );
    setPast((prevPast) => {
      const nextPast = [...prevPast, currentStateCloned];
      if (nextPast.length > historyLimit) {
        nextPast.shift();
      }
      return nextPast;
    });

    // Restore next state
    const restoredState: HistoryStateSnapshot = JSON.parse(JSON.stringify(nextState));
    setNodes(restoredState.nodes);
    setEdges(restoredState.edges);
    setAgentNodes(restoredState.agentNodes);
    setAgentEdges(restoredState.agentEdges);

    if (selectedNode) {
      const syncedNode =
        restoredState.nodes.find((n: any) => n.id === selectedNode.id) ||
        restoredState.agentNodes.find((n: any) => n.id === selectedNode.id);
      setSelectedNode(syncedNode || null);
    }

    // Remove the last state from future
    setFuture((prevFuture) => prevFuture.slice(0, -1));
  }, [future, nodes, edges, agentNodes, agentEdges, historyLimit, selectedNode, setNodes, setEdges, setAgentNodes, setAgentEdges, setSelectedNode]);

  // Drag hooks to record start and end positions
  const onNodeDragStart = useCallback(() => {
    dragStartStateRef.current = JSON.parse(
      JSON.stringify({ nodes, edges, agentNodes, agentEdges })
    );
  }, [nodes, edges, agentNodes, agentEdges]);

  const onNodeDragStop = useCallback(() => {
    logUserAction(
      `Node Drag Stopped on Workspace`,
      { selectedCount: selectedProcessNodeIds.length },
      { file: 'App.tsx', class: 'App', func: 'onNodeDragStop', logType: 'general' }
    );
    if (dragStartStateRef.current) {
      // Check if actual coordinates changed
      const hasNodesChanged =
        JSON.stringify(dragStartStateRef.current.nodes) !== JSON.stringify(nodes);
      const hasAgentNodesChanged =
        JSON.stringify(dragStartStateRef.current.agentNodes) !== JSON.stringify(agentNodes);

      if (hasNodesChanged || hasAgentNodesChanged) {
        setPast((prevPast) => {
          const nextPast = [...prevPast, dragStartStateRef.current!];
          if (nextPast.length > historyLimit) {
            nextPast.shift();
          }
          return nextPast;
        });
        setFuture([]);
      }
      dragStartStateRef.current = null;
    }
  }, [nodes, agentNodes, historyLimit, logUserAction, selectedProcessNodeIds.length]);

  // Bubbled handlers for properties panel inputs
  const handleInspectorFocus = useCallback(() => {
    if (!propertyEditStartStateRef.current) {
      propertyEditStartStateRef.current = JSON.parse(
        JSON.stringify({ nodes, edges, agentNodes, agentEdges })
      );
    }
  }, [nodes, edges, agentNodes, agentEdges]);

  const handleInspectorBlur = useCallback(
    (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as any)) {
        if (propertyEditStartStateRef.current) {
          const hasNodesChanged =
            JSON.stringify(propertyEditStartStateRef.current.nodes) !== JSON.stringify(nodes) ||
            JSON.stringify(propertyEditStartStateRef.current.edges) !== JSON.stringify(edges);
          const hasAgentNodesChanged =
            JSON.stringify(propertyEditStartStateRef.current.agentNodes) !==
              JSON.stringify(agentNodes) ||
            JSON.stringify(propertyEditStartStateRef.current.agentEdges) !==
              JSON.stringify(agentEdges);

          if (hasNodesChanged || hasAgentNodesChanged) {
            setPast((prevPast) => {
              const nextPast = [...prevPast, propertyEditStartStateRef.current!];
              if (nextPast.length > historyLimit) {
                nextPast.shift();
              }
              return nextPast;
            });
            setFuture([]);
          }
          propertyEditStartStateRef.current = null;
        }
      }
    },
    [nodes, edges, agentNodes, agentEdges, historyLimit]
  );

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    past,
    setPast,
    future,
    setFuture,
    historyLimit,
    setHistoryLimit,
    takeSnapshot,
    undo,
    redo,
    onNodeDragStart,
    onNodeDragStop,
    handleInspectorFocus,
    handleInspectorBlur,
    clearHistory,
    dragStartStateRef,
    propertyEditStartStateRef,
  };
}

