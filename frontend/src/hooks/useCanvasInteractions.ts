import React, { useCallback } from 'react';
import { addEdge } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import { getNodeClass, getAgentEdgeStyle } from '../utils/nodeGraphUtils';
import { createNewNodeInstances } from '../utils/nodeFactory';
import { generateFinalPrompt, generateFinalPayload } from '../utils/promptPayloadGenerators';

export interface UseCanvasInteractionsProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  agentNodes: Node[];
  setAgentNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setAgentEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  selectedNode: any;
  setSelectedNode: React.Dispatch<React.SetStateAction<any>>;
  selectedProcessNodeIds: string[];
  setSelectedProcessNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedWorkflowId: string | null;
  reactFlowInstance: any;
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  takeSnapshot: () => void;
  setHoveredGroup?: (grp: string | null) => void;
  setIsShowingSettings?: (val: boolean) => void;
  setIsShowingModels?: (val: boolean) => void;
  logUserAction?: (action: string, meta?: any, ctx?: any) => void;
  backendUrl?: string;
}

export function useCanvasInteractions({
  nodes,
  setNodes,
  edges,
  setEdges,
  agentNodes,
  setAgentNodes,
  setAgentEdges,
  selectedNode,
  setSelectedNode,
  selectedProcessNodeIds,
  setSelectedProcessNodeIds,
  selectedWorkflowId,
  reactFlowInstance,
  reactFlowWrapper,
  takeSnapshot,
  setHoveredGroup = () => {},
  setIsShowingSettings = () => {},
  setIsShowingModels = () => {},
  logUserAction = () => {},
  backendUrl,
}: UseCanvasInteractionsProps) {
  void selectedProcessNodeIds;
  void logUserAction;
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

  const onConnect = useCallback(

    (params: any) => {

      const targetNode = nodes.find(n => n.id === params.target);

      if (targetNode) {

        const targetClass = getNodeClass(targetNode);

        if (targetClass.toLowerCase() === 'json connector list') {

          const hasIncoming = edges.some(e => e.target === params.target);

          if (hasIncoming) {

            alert("JSON Connector List node can only accept one input connection.");

            return;

          }

        }

      }



      takeSnapshot();

      const edgeId = `e_${Date.now()}`;

      const newEdgeLogic = { ...params, id: edgeId, animated: true };

      setEdges((eds) => addEdge(newEdgeLogic, eds));



      const newEdgeAgent = {

        ...params,

        id: edgeId,

        animated: true,

        style: getAgentEdgeStyle(params.source || '', params.target || ''),

      };

      setAgentEdges((aeds: Edge[]) => addEdge(newEdgeAgent, aeds));

    },

    [nodes, edges, setEdges, setAgentEdges, takeSnapshot]

  );



  // 3. Handle Drag & Drop of Nodes from Sidebar onto Canvas

  const onDragOver = useCallback((event: React.DragEvent) => {

    event.preventDefault();

    event.dataTransfer.dropEffect = 'move';

  }, []);



  const createNewNode = useCallback(
    (category: string, name: string, dropPosition?: { x: number; y: number }) => {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      const { newNodeLogic, newNodeAgent } = createNewNodeInstances(
        category,
        name,
        dropPosition,
        agentNodes,
        bounds,
        reactFlowInstance
      );

      takeSnapshot();
      setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), newNodeLogic]);
      setAgentNodes((ands) => [...ands, newNodeAgent]);
      setSelectedNode(newNodeLogic);
      setIsShowingSettings(false);
      setIsShowingModels(false);
      setHoveredGroup(null);
    },
    [reactFlowInstance, agentNodes, takeSnapshot]
  );



  const onDrop = useCallback(

    (event: React.DragEvent) => {

      event.preventDefault();



      if (!reactFlowWrapper.current) return;

      

      const currentInstance = reactFlowInstance;

      if (!currentInstance) return;



      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

      const type = event.dataTransfer.getData('application/reactflow/type');

      const category = event.dataTransfer.getData('application/reactflow/category');

      const name = event.dataTransfer.getData('application/reactflow/name');



      if (!type || !name) return;



      // Calculate drop position

      const position = currentInstance.project({

        x: event.clientX - reactFlowBounds.left,

        y: event.clientY - reactFlowBounds.top,

      });



      createNewNode(category, name, position);

    },

    [reactFlowInstance, createNewNode]

  );



  const onDragStart = (event: React.DragEvent, nodeType: string, category: string, name: string) => {

    event.dataTransfer.setData('application/reactflow/type', nodeType);

    event.dataTransfer.setData('application/reactflow/category', category);

    event.dataTransfer.setData('application/reactflow/name', name);

    event.dataTransfer.effectAllowed = 'move';

  };




  const onNodeClick = useCallback((_: any, node: Node) => {

    setSelectedNode(node);

    setIsShowingSettings(false);

    setIsShowingModels(false);

  }, []);



  const onPaneClick = useCallback(() => {

    setSelectedNode(null);

    setIsShowingSettings(false);

    setIsShowingModels(false);

    setHoveredGroup(null);

    setNodes(prev => prev.map(n => ({ ...n, selected: false })));

    setSelectedProcessNodeIds([]);

  }, []);







  const onSelectionChange = useCallback(

    ({ nodes: selectedNodes }: { nodes: Node[], edges: Edge[] }) => {

      const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

      

      // Update global Process Node list only upon direct user canvas interaction

      if (selectedNodeIds.size === 1) {

        setSelectedProcessNodeIds(Array.from(selectedNodeIds));

        setSelectedNode(selectedNodes[0]);

      } else if (selectedNodeIds.size > 1) {

        setSelectedProcessNodeIds(Array.from(selectedNodeIds));

        setSelectedNode(null); // Do not open single-node properties inspector when marquee selecting multiple nodes

      } else {

        setSelectedNode(null);

      }

      

      setEdges((eds) => {

        let hasChanges = false;

        const newEdges = eds.map((e) => {

          if (selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)) {

            if (!e.selected) {

              hasChanges = true;

              return { ...e, selected: true };

            }

          }

          return e;

        });

        return hasChanges ? newEdges : eds;

      });

    },

    [setEdges]

  );



  const updateSelectedNodeData = (field: string, val: any) => {

    if (!selectedNode) return;



    const updateList = (nds: Node[]) =>

      nds.map((n) => {

        if (n.id === selectedNode.id) {

          return {

            ...n,

            data: {

              ...n.data,

              [field]: val,

            },

          };

        }

        return n;

      });



    setNodes((nds) => {

      const nextNds = updateList(nds);

      const updatedNode = nextNds.find(n => n.id === selectedNode.id);

      if (updatedNode) setSelectedNode(updatedNode);

      return nextNds;

    });



    setAgentNodes((ands) => {

      const nextAnds = updateList(ands);

      const updatedNode = nextAnds.find(n => n.id === selectedNode.id);

      if (updatedNode) setSelectedNode(updatedNode);

      return nextAnds;

    });

  };



  const updateSelectedNodeDataFields = (fields: { [key: string]: any }) => {

    if (!selectedNode) return;



    const updateList = (nds: Node[]) =>

      nds.map((n) => {

        if (n.id === selectedNode.id) {

          return {

            ...n,

            data: {

              ...n.data,

              ...fields,

            },

          };

        }

        return n;

      });



    setNodes((nds) => {

      const nextNds = updateList(nds);

      const updatedNode = nextNds.find(n => n.id === selectedNode.id);

      if (updatedNode) setSelectedNode(updatedNode);

      return nextNds;

    });



    setAgentNodes((ands) => {

      const nextAnds = updateList(ands);

      const updatedNode = nextAnds.find(n => n.id === selectedNode.id);

      if (updatedNode) setSelectedNode(updatedNode);

      return nextAnds;

    });

  };





  const generateFinalPromptAsync = useCallback(
    (nodeId: string) => generateFinalPrompt(nodeId, nodes, edges, selectedWorkflowId, BACKEND_URL),
    [nodes, edges, selectedWorkflowId]
  );

  const generateFinalPayloadAsync = useCallback(
    (nodeId: string) => generateFinalPayload(nodeId, nodes, edges, selectedWorkflowId, BACKEND_URL),
    [nodes, edges, selectedWorkflowId]
  );



  const updateSelectedNodeParameter = (key: string, val: any) => {

    if (!selectedNode) return;

    const currentParams = selectedNode.data.parameters || {};

    const updatedParams = { ...currentParams, [key]: val };

    

    // If a Timer node's configuration changes, clear its remainingSeconds so it recalculates instantly

    const name = selectedNode.data.name?.toLowerCase() || '';

    const label = selectedNode.data.label?.toLowerCase() || '';

    const type = selectedNode.type?.toLowerCase() || '';

    const isTimer = name.includes('timer') || label.includes('timer') || type.includes('timer');

    

    if (isTimer) {

      delete updatedParams.remainingSeconds;

    }

    

    updateSelectedNodeData('parameters', updatedParams);

  };


  return {
    onConnect,
    onDragOver,
    createNewNode,
    onDrop,
    onDragStart,
    onNodeClick,
    onPaneClick,
    onSelectionChange,
    updateSelectedNodeData,
    updateSelectedNodeDataFields,
    generateFinalPromptAsync,
    generateFinalPayloadAsync,
    updateSelectedNodeParameter,
  };
}
