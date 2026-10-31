import { useCallback, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import { isProtectedTimerNode } from '../utils/nodeGraphUtils';

export interface UseCanvasShortcutsProps {
  activeTab: 'logic' | 'process' | 'settings';
  nodes: Node[];
  edges: Edge[];
  agentNodes: Node[];
  agentEdges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setAgentNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setAgentEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  selectedNode: any;
  setSelectedNode: React.Dispatch<React.SetStateAction<any>>;
  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;
  logUserAction?: (action: string, meta?: any, ctx?: any) => void;
  reactFlowInstance?: any;
  lastMousePosRef?: React.MutableRefObject<{ x: number; y: number }>;
  handleManualSystemSave?: () => Promise<any> | void;
  handleOpenWorkflow?: () => Promise<any> | void;
}

export function useCanvasShortcuts({
  activeTab,
  nodes,
  edges,
  agentNodes,
  agentEdges,
  setNodes,
  setEdges,
  setAgentNodes,
  setAgentEdges,
  selectedNode,
  setSelectedNode,
  undo,
  redo,
  takeSnapshot,
  logUserAction = () => {},
  reactFlowInstance,
  lastMousePosRef = { current: { x: 0, y: 0 } },
  handleManualSystemSave = () => {},
  handleOpenWorkflow = () => {},
}: UseCanvasShortcutsProps) {
  const deleteSelectedElements = useCallback(() => {

    const currentNodes = activeTab === 'logic' ? nodes : [];

    const currentEdges = activeTab === 'logic' ? edges : [];



    const selectedNodeIds = new Set<string>();

    const selectedEdgeIds = new Set<string>();



    currentNodes.forEach((n) => {

      if (n.selected) {

        if (isProtectedTimerNode(n)) {

          console.warn(`[System] Node '${n.data?.label || n.data?.name}' (${n.id}) is a protected Workflow Timer node and cannot be deleted.`);

          return;

        }

        selectedNodeIds.add(n.id);

      }

    });



    currentEdges.forEach((e) => {

      if (e.selected) selectedEdgeIds.add(e.id);

    });



    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) {

      return;

    }



    takeSnapshot();



    setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)));

    setAgentNodes((ands) => ands.filter((n) => !selectedNodeIds.has(n.id)));



    setEdges((eds) =>

      eds.filter(

        (e) =>

          !selectedEdgeIds.has(e.id) &&

          !selectedNodeIds.has(e.source) &&

          !selectedNodeIds.has(e.target)

      )

    );

    setAgentEdges((aeds) =>

      aeds.filter(

        (e) =>

          !selectedEdgeIds.has(e.id) &&

          !selectedNodeIds.has(e.source) &&

          !selectedNodeIds.has(e.target)

      )

    );



    if (selectedNode && selectedNodeIds.has(selectedNode.id)) {

      setSelectedNode(null);

    }

  }, [activeTab, nodes, edges, agentNodes, agentEdges, selectedNode, takeSnapshot, setNodes, setAgentNodes, setEdges, setAgentEdges]);



  useEffect(() => {

    const handleGlobalKeyDown = (e: KeyboardEvent) => {

      // 1. Delete node/edge shortcut

      const currentNodes = activeTab === 'logic' ? nodes : [];

      const currentEdges = activeTab === 'logic' ? edges : [];

      const hasSelection = currentNodes.some(n => n.selected) || currentEdges.some(e => e.selected);



      if (

        (e.key === 'Delete' || e.key === 'Backspace') &&

        hasSelection &&

        document.activeElement?.tagName !== 'INPUT' &&

        document.activeElement?.tagName !== 'TEXTAREA' &&

        !document.activeElement?.hasAttribute('contenteditable')

      ) {

        e.preventDefault();

        deleteSelectedElements();

      }



      // 2. Undo shortcut (Ctrl + Z)

      if (

        e.ctrlKey && e.key.toLowerCase() === 'z' &&

        document.activeElement?.tagName !== 'INPUT' &&

        document.activeElement?.tagName !== 'TEXTAREA' &&

        !document.activeElement?.hasAttribute('contenteditable')

      ) {

        e.preventDefault();

        undo();

      }



      // 3. Redo shortcut (Ctrl + Y)

      if (

        e.ctrlKey && e.key.toLowerCase() === 'y' &&

        document.activeElement?.tagName !== 'INPUT' &&

        document.activeElement?.tagName !== 'TEXTAREA' &&

        !document.activeElement?.hasAttribute('contenteditable')

      ) {

        e.preventDefault();

        redo();

      }



      // 4. Copy shortcut (Ctrl + C / Cmd + C)

      if (

        (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'c' || e.code === 'KeyC') &&

        document.activeElement?.tagName !== 'INPUT' &&

        document.activeElement?.tagName !== 'TEXTAREA' &&

        !document.activeElement?.hasAttribute('contenteditable') &&

        !window.getSelection()?.toString()

      ) {

        let targetLogicNodes = activeTab === 'logic' ? nodes.filter(n => n.selected) : [];

        let targetAgentNodes = activeTab === 'process' ? agentNodes.filter(n => n.selected) : [];

        

        if (targetLogicNodes.length === 0 && targetAgentNodes.length > 0) {

           const selectedIds = new Set(targetAgentNodes.map(n => n.id));

           targetLogicNodes = nodes.filter(n => selectedIds.has(n.id));

        } else if (targetAgentNodes.length === 0 && targetLogicNodes.length > 0) {

           const selectedIds = new Set(targetLogicNodes.map(n => n.id));

           targetAgentNodes = agentNodes.filter(n => selectedIds.has(n.id));

        }



        if (targetLogicNodes.length > 0 || targetAgentNodes.length > 0) {

          e.preventDefault();

          const selectedIds = new Set(targetLogicNodes.map(n => n.id));

          const selectedEdges = edges.filter(e => selectedIds.has(e.source) && selectedIds.has(e.target));

          const selectedAgentEdges = agentEdges.filter(e => selectedIds.has(e.source) && selectedIds.has(e.target));

          

          const copyPayload = {

            logicNodes: targetLogicNodes,

            agentNodes: targetAgentNodes,

            logicEdges: selectedEdges,

            agentEdges: selectedAgentEdges,

            timestamp: Date.now()

          };

          localStorage.setItem('copied_workflow_nodes', JSON.stringify(copyPayload));

          logUserAction(`📋 คัดลอกโหนดไปยังหน่วยความจำเรียบร้อยแล้ว (${targetLogicNodes.length || targetAgentNodes.length} โหนด)`, { count: targetLogicNodes.length || targetAgentNodes.length }, { func: 'handleGlobalKeyDown', logType: 'general' });

        }

      }



      // 5. Paste shortcut (Ctrl + V / Cmd + V)

      if (

        (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'v' || e.code === 'KeyV') &&

        document.activeElement?.tagName !== 'INPUT' &&

        document.activeElement?.tagName !== 'TEXTAREA' &&

        !document.activeElement?.hasAttribute('contenteditable')

      ) {

        const stored = localStorage.getItem('copied_workflow_nodes');

        if (stored) {

          try {

            const parsed = JSON.parse(stored);

            if (parsed && ((Array.isArray(parsed.logicNodes) && parsed.logicNodes.length > 0) || (Array.isArray(parsed.agentNodes) && parsed.agentNodes.length > 0))) {

              e.preventDefault();

              takeSnapshot();



              let targetPos = { x: 100, y: 100 };

              if (reactFlowInstance) {

                targetPos = reactFlowInstance.screenToFlowPosition({

                  x: lastMousePosRef.current.x,

                  y: lastMousePosRef.current.y,

                });

              }



              const sourceNodesForCalc = activeTab === 'process' && (parsed.agentNodes || []).length > 0

                                         ? parsed.agentNodes

                                         : (parsed.logicNodes || []);

              const minX = Math.min(...sourceNodesForCalc.map((n: any) => n.position?.x ?? 0));

              const minY = Math.min(...sourceNodesForCalc.map((n: any) => n.position?.y ?? 0));

              const deltaX = targetPos.x - (isFinite(minX) ? minX : 0);

              const deltaY = targetPos.y - (isFinite(minY) ? minY : 0);



              const idMap: Record<string, string> = {};

              const now = Date.now();

              const newLogicNodes = parsed.logicNodes.map((oldNode: any, idx: number) => {

                const newId = `node_${now + idx}`;

                idMap[oldNode.id] = newId;

                

                const newData = JSON.parse(JSON.stringify(oldNode.data || {}));

                

                if (newData.parameters) {

                   delete newData.parameters.agentOutputsTable;

                   delete newData.parameters.pdfQueue;

                   delete newData.parameters.agentResultQueue;

                   delete newData.parameters.table;

                   delete newData.parameters.currentIndex;

                   delete newData.parameters.previous_max;

                   delete newData.parameters.previousMaxList;

                }



                return {

                  ...oldNode,

                  id: newId,

                  data: newData,

                  position: {

                    x: (oldNode.position?.x ?? 0) + deltaX,

                    y: (oldNode.position?.y ?? 0) + deltaY

                  },

                  selected: true

                };

              });



              const newAgentNodes = (parsed.agentNodes || []).map((oldAgentNode: any, idx: number) => {

                const mappedId = idMap[oldAgentNode.id] || `node_${now + idx}_agent`;

                

                const newData = JSON.parse(JSON.stringify(oldAgentNode.data || {}));

                

                if (newData.parameters) {

                   delete newData.parameters.agentOutputsTable;

                   delete newData.parameters.pdfQueue;

                   delete newData.parameters.agentResultQueue;

                   delete newData.parameters.table;

                   delete newData.parameters.currentIndex;

                   delete newData.parameters.previous_max;

                   delete newData.parameters.previousMaxList;

                }



                return {

                  ...oldAgentNode,

                  id: mappedId,

                  data: newData,

                  position: {

                    x: (oldAgentNode.position?.x ?? 0) + deltaX,

                    y: (oldAgentNode.position?.y ?? 0) + deltaY

                  },

                  selected: true

                };

              });



              const newLogicEdges = (parsed.logicEdges || []).map((oldEdge: any, idx: number) => {

                const source = idMap[oldEdge.source];

                const target = idMap[oldEdge.target];

                if (source && target) {

                  return {

                    ...oldEdge,

                    id: `reactflow__edge-${source}->${target}_${now}_${idx}`,

                    source,

                    target,

                    selected: false

                  };

                }

                return null;

              }).filter(Boolean) as any[];



              const newAgentEdges = (parsed.agentEdges || []).map((oldEdge: any, idx: number) => {

                const source = idMap[oldEdge.source];

                const target = idMap[oldEdge.target];

                if (source && target) {

                  return {

                    ...oldEdge,

                    id: `reactflow__edge-${source}->${target}_agent_${now}_${idx}`,

                    source,

                    target,

                    selected: false

                  };

                }

                return null;

              }).filter(Boolean) as any[];



              // Unselect existing nodes before pasting new ones

              setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newLogicNodes));

              setAgentNodes(ands => ands.map(n => ({ ...n, selected: false })).concat(newAgentNodes));

              if (newLogicEdges.length > 0) {

                setEdges(eds => eds.concat(newLogicEdges));

              }

              if (newAgentEdges.length > 0) {

                setAgentEdges(aeds => aeds.concat(newAgentEdges));

              }



              logUserAction(`📋 วางโหนดจากหน่วยความจำเสร็จสมบูรณ์ (${newLogicNodes.length} โหนด)`, { count: newLogicNodes.length }, { func: 'handleGlobalKeyDown', logType: 'general' });

            }

          } catch (err: any) {

            console.error("Failed to paste nodes:", err);

          }

        }

      }



      // 6. Manual Save shortcut (Ctrl + S / Cmd + S)

      if (

        (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's' || e.code === 'KeyS') &&

        document.activeElement?.tagName !== 'INPUT' &&

        document.activeElement?.tagName !== 'TEXTAREA' &&

        !document.activeElement?.hasAttribute('contenteditable')

      ) {

        e.preventDefault();

        handleManualSystemSave();

      }



      // 7. Open/Import Workflow shortcut (Ctrl + O / Cmd + O)

      if (

        (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'o' || e.code === 'KeyO') &&

        document.activeElement?.tagName !== 'INPUT' &&

        document.activeElement?.tagName !== 'TEXTAREA' &&

        !document.activeElement?.hasAttribute('contenteditable')

      ) {

        e.preventDefault();

        handleOpenWorkflow();

      }

    };



    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });

    return () => {

      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });

    };

  }, [selectedNode, undo, redo, deleteSelectedElements, activeTab, nodes, edges, agentNodes, agentEdges, takeSnapshot, setNodes, setAgentNodes, setEdges, setAgentEdges, logUserAction, reactFlowInstance, handleManualSystemSave, handleOpenWorkflow]);

  return {
    deleteSelectedElements,
  };
}
