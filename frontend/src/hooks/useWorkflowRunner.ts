import { calculateNextTimerSeconds } from '../timerHelpers';
import React, { useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import type { LogMessage } from '../constants/defaultWorkflow';
import {
  cleanAgentNodesForSave,
  getNodeClass,
  isTargetAgentNode,
  getParentMaxListForNode,
  getChildCompletedCountForNode,
  isWorkflowTimerNode,
  isRegularTimerNode,
} from '../utils/nodeGraphUtils';

export interface UseWorkflowRunnerProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  agentNodes: Node[];
  setAgentNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  agentEdges: Edge[];
  setAgentEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  selectedWorkflowId: string | null;
  setSelectedWorkflowId?: React.Dispatch<React.SetStateAction<string | null>>;
  workflowName: string;
  workflowDesc?: string;
  aiModels?: any[];
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  currentRunId: string | null;
  setCurrentRunId: React.Dispatch<React.SetStateAction<string | null>>;
  isRunningRef: React.MutableRefObject<boolean>;
  currentRunIdRef: React.MutableRefObject<string | null>;
  nodesRef: React.MutableRefObject<Node[]>;
  edgesRef: React.MutableRefObject<Edge[]>;
  inFlightWakeUpNodesRef: React.MutableRefObject<Set<string>>;
  handleRunRef: React.MutableRefObject<any>;
  selectedNode: any;
  setSelectedNode: React.Dispatch<React.SetStateAction<any>>;
  setLogs: React.Dispatch<React.SetStateAction<LogMessage[]>>;
  setWorkflowLogsMap: React.Dispatch<React.SetStateAction<Record<string, LogMessage[]>>>;
  setProcesses: React.Dispatch<React.SetStateAction<any[]>>;
  appendLog?: (msg: string, level?: string, sourceFile?: string, logType?: string) => void;
  appendGlobalLog?: (msg: string, lvl?: 'INFO' | 'ERROR' | 'SUCCESS', src?: string, type?: string) => void;
  saveLogToBackend?: (wfId?: string | null, logEntry?: LogMessage | null) => void;
  getWorkflowStep?: (nodeId: string | undefined, category: string | undefined) => number | string;
  fetchWorkflows?: (id?: string) => void | Promise<any>;
  showAlert: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
  logUserAction: (action: string, meta?: any, ctx?: any) => void;
  isSubflowModeActive?: boolean;
  selectedProcessNodeIds?: string[];
  backendUrl?: string;
}

export function useWorkflowRunner({
  nodes,
  setNodes,
  edges,
  setEdges,
  agentNodes,
  setAgentNodes,
  agentEdges,
  setAgentEdges,
  selectedWorkflowId,
  setSelectedWorkflowId,
  workflowName,
  workflowDesc = '',
  aiModels = [],
  isRunning,
  setIsRunning,
  currentRunId,
  setCurrentRunId,
  isRunningRef,
  currentRunIdRef,
  nodesRef,
  edgesRef,
  inFlightWakeUpNodesRef,
  handleRunRef,
  selectedNode,
  setSelectedNode,
  setLogs,
  setWorkflowLogsMap,
  setProcesses,
  appendLog = () => {},
  appendGlobalLog = () => {},
  saveLogToBackend = () => {},
  getWorkflowStep = () => 1,
  fetchWorkflows,
  showAlert,
  logUserAction,
  isSubflowModeActive,
  selectedProcessNodeIds,
  backendUrl,
}: UseWorkflowRunnerProps) {
  void setAgentEdges;
  void appendLog;
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
  void currentRunId;
  void selectedNode;

  // 5. Run Workflow and subscribe to Server-Sent Events (SSE) stream

  const handleRun = async (selectedNodeIds?: string[], nodesToSave?: Node[], appendLogsMode?: boolean, targetWorkflowId?: string) => {

    const isSub = selectedNodeIds && selectedNodeIds.length > 0;

    logUserAction(isSub ? `Start Sub-Workflow (${selectedNodeIds.length} nodes)` : `Start Workflow Execution`, { workflowName: workflowName, workflowId: selectedWorkflowId }, { file: 'App.tsx', class: 'App', func: 'handleRun', logType: 'process_action' });

    logUserAction(`Workflow Status Changed: Idle/Paused -> Running`, { workflowName: workflowName, workflowId: selectedWorkflowId }, { file: 'App.tsx', class: 'App', func: 'handleRun', logType: 'status_change' });

    if (isRunning && !appendLogsMode) return;



    let workingNodes = nodesToSave || nodes;



    if (selectedNodeIds && selectedNodeIds.length > 0) {

      workingNodes = workingNodes.map(n => {

        const isTimer = (n.type || '').toLowerCase().includes('timer') || (n.data?.name || '').toLowerCase().includes('timer') || (n.data?.label || '').toLowerCase().includes('timer');

        const inSub = selectedNodeIds.includes(n.id);

        

        if (inSub) {

          

          let additionalParams: any = { activeSubflow: true };

          if (isTimer) {

             additionalParams.subflowNodeIds = selectedNodeIds;

          }

          

          return {

            ...n,

            data: {

              ...n.data,

              parameters: { ...n.data.parameters, ...additionalParams }

            }

          };

        }

        

        return {

          ...n,

          data: {

            ...n.data,

            parameters: { ...n.data.parameters, activeSubflow: false }

          }

        };

      });

      setNodes(workingNodes);

      if (nodesToSave) nodesToSave = workingNodes;

    } else if (nodesToSave) {

      setNodes(nodesToSave);

    }



    // Find the Timer node and get its runCount to print the starting round log

    const timerNode = (nodesToSave || workingNodes).find(n => {

      const name = n.data.name?.toLowerCase() || '';

      const label = n.data.label?.toLowerCase() || '';

      const type = n.type?.toLowerCase() || '';

      return name.includes('timer') || label.includes('timer') || type.includes('timer');

    });

    const runCount = timerNode?.data?.parameters?.runCount;



    // Check if this run is triggered by a timer

    const isTimerTrigger = appendLogsMode && timerNode?.data?.parameters?.schedulerActive === true;



    if (!appendLogsMode) {

      const initLog: LogMessage = {

        message: "⚙️ Starting workflow execution. Preparing nodes...",

        level: 'INFO',

        timestamp: new Date().toISOString()

      };

      setLogs([initLog]);

      if (selectedWorkflowId) {

        setWorkflowLogsMap(prev => ({ ...prev, [selectedWorkflowId]: [initLog] }));

        saveLogToBackend(selectedWorkflowId, initLog);

      }

    } else if (!isTimerTrigger) {

      const resumeLog: LogMessage = {

        message: "⚙️ Resuming or appending to active workflow execution...",

        level: 'INFO',

        timestamp: new Date().toISOString()

      };

      setLogs(prev => [...prev, resumeLog]);

      if (selectedWorkflowId) {

        setWorkflowLogsMap(prev => ({ ...prev, [selectedWorkflowId]: [...(prev[selectedWorkflowId] || []), resumeLog] }));

        saveLogToBackend(selectedWorkflowId, resumeLog);

      }

    }

    // Note: If isTimerTrigger is true, checkScheduler already logged the timer countdown event, so we skip duplicating it.

    setIsRunning(true);

    isRunningRef.current = true;



    // First save the current workflow status

    const payload = {

      name: workflowName,

      description: workflowDesc,

      nodes: nodesToSave || nodes,

      edges,

      agentNodes,

      agentEdges,

      aiModels

    };



    let wfId = targetWorkflowId || selectedWorkflowId;

    try {

      let res;

      if (wfId) {

        res = await fetch(`${BACKEND_URL}/api/workflows/${wfId}`, {

          method: 'PUT',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(payload),

        });

      } else {

        res = await fetch(`${BACKEND_URL}/api/workflows`, {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(payload),

        });

      }

      

      if (res.ok) {

        const data = await res.json();

        wfId = data.id || wfId;

        setSelectedWorkflowId?.(wfId);

        fetchWorkflows?.(wfId || undefined);

      } else {

        setIsRunning(false);

        showAlert('Failed to save workflow before running.', 'Execution Error', 'error');

        return;

      }

    } catch (e) {

      console.error("Backend save failed, but continuing execution:", e);

      // setIsRunning(false);

      // return;

    }



    // Trigger execution on the Frontend Client (1 Workflow = 1 Process Architecture)

    const unifiedRunId = wfId || targetWorkflowId || selectedWorkflowId || 'wf-default';

    const runId = unifiedRunId;

    setCurrentRunId(runId);

    currentRunIdRef.current = runId;



    const isSubflowRun = Boolean((selectedNodeIds && selectedNodeIds.length > 0) || (isSubflowModeActive && selectedProcessNodeIds && selectedProcessNodeIds.length > 0));

    const activeTargetIds = (selectedNodeIds && selectedNodeIds.length > 0) ? selectedNodeIds : (isSubflowModeActive ? (selectedProcessNodeIds || []) : []);



    // Update unified process record or insert if not exists

    const baseProcess = {

      id: runId,

      workflowId: runId,

      name: workflowName || 'Saved Workflow',

      description: workflowDesc,

      startTime: new Date().toISOString(),

      status: 'running',

      runMode: isSubflowRun ? 'subflow' : 'full',

      selectedProcessNodeIds: activeTargetIds,

      currentStep: 1,

      lastActiveNode: '',

      nodes: [...(nodesToSave || nodes)],

      edges: [...edges],

      agentNodes: [...agentNodes],

      agentEdges: [...agentEdges]

    };



    setProcesses((prev) => {

      const existingIdx = prev.findIndex(p => p.id === runId || p.workflowId === runId || (targetWorkflowId && (p.id === targetWorkflowId || p.workflowId === targetWorkflowId)));

      if (existingIdx >= 0) {

        const updated = [...prev];

        updated[existingIdx] = {

          ...updated[existingIdx],

          ...baseProcess,

          name: isSubflowRun ? `${workflowName || updated[existingIdx].name}` : `${workflowName || updated[existingIdx].name}`,

          status: 'running',

          runMode: isSubflowRun ? 'subflow' : 'full',

          selectedProcessNodeIds: activeTargetIds,

          startTime: new Date().toISOString(),

          nodes: [...(nodesToSave || nodes)],

          edges: [...edges]

        };

        return updated;

      }

      return [baseProcess, ...prev];

    });

// Graph Orchestration Loop running on Client

    (async () => {

      const activeNodes = new Set<string>();

      const completedNodes = new Set<string>();

      const failedNodes = new Set<string>();



      const currentNodes = nodesToSave || nodes;

      const allWorkflowNodes = [...currentNodes, ...cleanAgentNodesForSave(agentNodes)];



      // Filter nodes and edges based strictly on Process Node Tab (selectedProcessNodeIds / subflow selection)

      const allWorkflowEdges = [...edges, ...agentEdges.filter(ae => !edges.some(e => e.source === ae.source && e.target === ae.target))];

      let targetNodeIds = allWorkflowNodes.map(n => n.id);

      let targetEdges = allWorkflowEdges;

      const isSubflowActive = Boolean((selectedNodeIds && selectedNodeIds.length > 0) || (isSubflowModeActive && selectedProcessNodeIds && selectedProcessNodeIds.length > 0));

      const effectiveSelectedIds = (selectedNodeIds && selectedNodeIds.length > 0) 

        ? selectedNodeIds 

        : (isSubflowModeActive ? (selectedProcessNodeIds || []) : []);

        

      if (isSubflowActive && effectiveSelectedIds.length > 0) {

        targetNodeIds = allWorkflowNodes.map(n => n.id).filter(id => effectiveSelectedIds.includes(id));

        targetEdges = allWorkflowEdges.filter(e => targetNodeIds.includes(e.source) && targetNodeIds.includes(e.target));

      }



      // Local variables state dict

      let runVariables: Record<string, any> = {

        "_workflow_nodes": allWorkflowNodes.map(n => ({ id: n.id, type: n.type, data: n.data })),

        "_workflow_edges": allWorkflowEdges.map(e => ({ source: e.source, target: e.target })),

        "ai_models": aiModels,

        "selected_node_ids": isSubflowActive && effectiveSelectedIds.length > 0 ? targetNodeIds : undefined

      };

      

      if (timerNode?.data?.parameters?.schedulerActive) {

        runVariables["run_count"] = runCount;

      }



      // Add visual runner update helpers

      const setNodeActive = (id: string, active: boolean) => {

        setNodes((nds) => nds.map((n) => {

          if (n.id === id) {

            return {

              ...n,

              data: {

                ...n.data,

                status: active ? 'running' : 'idle',

                parameters: {

                  ...n.data.parameters,

                  progress: active ? (typeof n.data.parameters?.progress === 'number' && n.data.parameters.progress > 0 && n.data.parameters.progress < 100 ? n.data.parameters.progress : 25) : 100

                }

              }

            };

          }

          return n;

        }));

        setAgentNodes((ands) => ands.map((n) => {

          if (n.id === id) {

            return {

              ...n,

              data: {

                ...n.data,

                status: active ? 'running' : 'idle',

                parameters: {

                  ...n.data.parameters,

                  progress: active ? (typeof n.data.parameters?.progress === 'number' && n.data.parameters.progress > 0 && n.data.parameters.progress < 100 ? n.data.parameters.progress : 25) : 100

                }

              }

            };

          }

          return n;

        }));

        setEdges((eds) => eds.map((edge) => {

          if (edge.target === id || edge.source === id) {

            return { ...edge, className: active ? 'running' : '' };

          }

          return edge;

        }));

        setProcesses((prev) => prev.map((proc) => {

          if (proc.id === runId) {

            const updatedNodes = proc.nodes.map((n: any) => ({

              ...n,

              data: { ...n.data, status: n.id === id ? (active ? 'running' : 'idle') : n.data.status }

            }));

            const matchedNode = proc.nodes.find((n: any) => n.id === id);

            const step = getWorkflowStep(id, matchedNode?.data?.category);

            return { ...proc, lastActiveNode: id, currentStep: step, nodes: updatedNodes };

          }

          return proc;

        }));

      };



      // Helper to append a single log message from client side

      const appendLog = (msg: string, lvl: 'INFO' | 'ERROR' | 'SUCCESS' = 'INFO') => {

        const entry: LogMessage = {

          message: msg,

          level: lvl,

          timestamp: new Date().toISOString()

        };

        setLogs((prev) => [...prev, entry]);

        setWorkflowLogsMap((prev) => ({ ...prev, [runId]: [...(prev[runId] || []), entry] }));

        saveLogToBackend(runId, entry);

      };



      appendLog(`[System] Starting Client-side Workflow Execution Run.`, 'INFO');



      // Topologically find active queue

      const getReadyNodes = () => {

        return targetNodeIds.filter(nId => {

          if (completedNodes.has(nId) || activeNodes.has(nId) || failedNodes.has(nId)) return false;

          

          const nodeObj = allWorkflowNodes.find(n => n.id === nId);

          const incomingEdges = targetEdges.filter(e => e.target === nId);



          if (incomingEdges.length === 0) return true;



          // For target AI Agent nodes, check if parent has produced items for our next index

          if (isTargetAgentNode(nodeObj)) {

            const { parentMax } = getParentMaxListForNode(nId, allWorkflowNodes, allWorkflowEdges);

            const childCount = getChildCompletedCountForNode(nodeObj as Node);

            

            // If parent has items beyond our current completed count, we are ready to process!

            if (parentMax > 0 && childCount < parentMax) {

              return true;

            }

            // If parent has finished and we also finished all available rows, mark completed

            if (parentMax > 0 && childCount >= parentMax && incomingEdges.every(e => completedNodes.has(e.source))) {

              completedNodes.add(nId);

              return false;

            }

          }



          // Default DAG rule: all incoming sources are completed

          return incomingEdges.every(e => completedNodes.has(e.source));

        });

      };



      // Clear any previous stop state for this runId on the backend

      try {

        await fetch(`${BACKEND_URL}/api/workflows/runs/${runId}/resume`, { method: 'POST' });

      } catch (e) {

        console.error("Failed to resume run on backend", e);

      }



      // Execution Loop

      try {

        let loopSafety = 0;

        while (completedNodes.size + failedNodes.size < targetNodeIds.length && loopSafety < 500) {

          loopSafety++;

          if (!isRunningRef.current || (currentRunIdRef.current && currentRunIdRef.current !== runId)) {

            appendLog(`[System] Execution stopped by user. Halting all active nodes.`, 'ERROR');

            break;

          }

          const ready = getReadyNodes();

          if (ready.length === 0) {

            if (activeNodes.size > 0) {

              if (loopSafety % 50 === 0) {

                const waitingNodes = targetNodeIds.filter(nId => {

                  if (completedNodes.has(nId) || activeNodes.has(nId) || failedNodes.has(nId)) return false;

                  return true;

                });

                if (waitingNodes.length > 0) {

                  waitingNodes.forEach(nId => {

                    const incoming = targetEdges.filter(e => e.target === nId);

                    const waitingFor = incoming.filter(e => !completedNodes.has(e.source)).map(e => {

                      const srcNode = allWorkflowNodes.find(n => n.id === e.source);

                      return srcNode ? (srcNode.data?.label || srcNode.data?.name || e.source) : e.source;

                    });

                    if (waitingFor.length > 0) {

                      const tgtNode = allWorkflowNodes.find(n => n.id === nId);

                      const tgtName = tgtNode ? (tgtNode.data?.label || tgtNode.data?.name || nId) : nId;

                      appendLog(`[System] Node '${tgtName}' is waiting for: ${waitingFor.join(', ')}`, 'INFO');

                    }

                  });

                }

              }

              await new Promise(resolve => setTimeout(resolve, 100));

              continue;

            } else {

              break;

            }

          }

          // Execute ready nodes concurrently

          const execPromises = ready.map(async (nodeId) => {

            if (!isRunningRef.current || (currentRunIdRef.current && currentRunIdRef.current !== runId)) {

              return;

            }

            activeNodes.add(nodeId);

            setNodeActive(nodeId, true);



            const node = allWorkflowNodes.find(n => n.id === nodeId);

            if (!node) {

              appendLog(`ไม่พบข้อมูลของโหนดไอดี '${nodeId}' ใน Workflow (ข้ามการทำงาน)`, 'ERROR');

              completedNodes.add(nodeId);

              activeNodes.delete(nodeId);

              setNodeActive(nodeId, false);

              return;

            }

            const label = node.data?.label || node.data?.name || nodeId;



            // If we are in subflow mode, check strictly if node is present in the Process Node Tab or selected subflow targets

            const isSubflowMode = Boolean((selectedNodeIds && selectedNodeIds.length > 0) || (isSubflowModeActive && selectedProcessNodeIds && selectedProcessNodeIds.length > 0));

            const activeSubflowIds = (selectedNodeIds && selectedNodeIds.length > 0) 

              ? selectedNodeIds 

              : (isSubflowModeActive ? (selectedProcessNodeIds || []) : []);

            const isNodeActiveInSubflow = !isSubflowMode || activeSubflowIds.includes(nodeId);



            if (!isNodeActiveInSubflow) {

              appendLog(`โหนด '${label}' (ID: ${nodeId}) ข้ามการทำงานเนื่องจากไม่อยู่ใน Process Node Tab ของ Sub Work Flow`, 'INFO');

              completedNodes.add(nodeId);

              activeNodes.delete(nodeId);

              setNodeActive(nodeId, false);

              return;

            }



            // Check node type

            const nodeTypeLower = (node.data?.nodeType || '').toLowerCase();

            const typeLower = (node.type || '').toLowerCase();

            const nameLower = (node.data?.name || '').toLowerCase();

            const labelLower = (node.data?.label || '').toLowerCase();

            const nodeClassLower = getNodeClass(node).toLowerCase();

            const isTimer = nodeTypeLower.includes('timer') || typeLower.includes('timer') || nameLower.includes('timer') || labelLower.includes('timer') || nodeClassLower.includes('timer');

            const isDb = nodeTypeLower === 'db' || nodeTypeLower.includes('db') || typeLower.includes('db') || typeLower.includes('database') || nameLower.includes('db') || nameLower.includes('database') || labelLower.includes('db') || labelLower.includes('database') || labelLower.includes('supabase') || nodeClassLower.includes('db');



            if (isDb) {

              const currentRound = runVariables["run_count"] || node.data?.parameters?.runCount || 1;

              appendLog(`Database: กำลังรัน SQL Query ของโหนด '${label}' (รอบที่ ${currentRound})...`, 'INFO');

            } else {

              appendLog(`Node '${label}' (${node.data?.nodeType || getNodeClass(node) || node.type || 'WorkflowNode'}) started execution.`, 'INFO');

            }



            // Resolve incoming node IDs

            const incomingIds = allWorkflowEdges.filter(e => e.target === nodeId).map(e => e.source);



            if (isTimer) {

              const currentRound = runVariables["run_count"] || node.data?.parameters?.runCount || 1;

              const successorEdges = targetEdges.filter(e => e.source === nodeId);

              const successorLabels = successorEdges.map(edge => {

                const succNode = allWorkflowNodes.find(n => n.id === edge.target);

                return succNode ? `'${succNode.data?.label || succNode.data?.name}'` : `'${edge.target}'`;

              }).join(', ');



              // Find connected DB or API Incremental nodes to customize log message

              const dbSuccessors = successorEdges

                .map(edge => allWorkflowNodes.find(n => n.id === edge.target))

                .filter(n => n && (n.data?.name?.toLowerCase().includes('db') || n.data?.label?.toLowerCase().includes('db') || n.data?.name?.toLowerCase().includes('database') || n.data?.label?.toLowerCase().includes('database') || n.data?.label?.toLowerCase().includes('supabase')));



              const apiIncSuccessors = successorEdges

                .map(edge => allWorkflowNodes.find(n => n.id === edge.target))

                .filter(n => n && (n.data?.name?.toLowerCase().includes('incremental') || n.data?.label?.toLowerCase().includes('incremental') || getNodeClass(n) === 'API Incremental'));



              if (dbSuccessors.length > 0) {

                const dbLabels = dbSuccessors.map(n => `'${n!.data.label || n!.data.name}'`).join(', ');

                appendLog(`Timer ⏱️: ส่งสัญญาณ Wake Up ปลุกโหนดฐานข้อมูล ${dbLabels} ให้ทำงานในรอบที่ ${currentRound}...`, 'INFO');

              } else if (apiIncSuccessors.length > 0) {

                const incLabels = apiIncSuccessors.map(n => `'${n!.data.label || n!.data.name}'`).join(', ');

                appendLog(`Timer ⏱️: ส่งสัญญาณ Wake Up ปลุกโหนด ${incLabels} ให้ทำงานในรอบที่ ${currentRound} (Automatic Pagination Query)...`, 'INFO');

              } else {

                appendLog(`Timer ⏱️: ส่งสัญญาณ Wake Up ปลุกโหนด ${successorLabels} ให้ทำงานในรอบที่ ${currentRound}...`, 'INFO');

              }



              completedNodes.add(nodeId);

              activeNodes.delete(nodeId);

              setNodeActive(nodeId, false);

              return;

            }



            if (!isRunningRef.current || (currentRunIdRef.current && currentRunIdRef.current !== runId)) {

              activeNodes.delete(nodeId);

              setNodeActive(nodeId, false);

              return;

            }



            // For other nodes, invoke POST /api/nodes/execute on the backend

            try {

              const executePayloadStr = JSON.stringify({

                node_id: nodeId,

                node_type: node.data?.nodeType || getNodeClass(node) || node.type || 'WorkflowNode',

                node_data: node.data,

                incoming_node_ids: incomingIds,

                variables: runVariables,

                workflow_nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),

                workflow_edges: edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),

                current_run_id: runId,

                workflow_id: selectedWorkflowId

              });

              

              if (executePayloadStr.length > 500000) { // If larger than 500KB

                 console.warn("HUGE PAYLOAD DETECTED! Size:", executePayloadStr.length);

                 Object.keys(node.data?.parameters || {}).forEach(k => {

                    const paramStr = JSON.stringify(node.data.parameters[k] || "");

                    if (paramStr.length > 10000) {

                        appendLog(`⚠️ พารามิเตอร์ '${k}' มีขนาดใหญ่มาก: ${(paramStr.length/1024/1024).toFixed(2)} MB`, 'INFO');

                    }

                 });

                 // Scan all workflow nodes for huge parameters

                 runVariables["_workflow_nodes"].forEach((n: any) => {

                    Object.keys(n.data?.parameters || {}).forEach(k => {

                        const paramStr = JSON.stringify(n.data.parameters[k] || "");

                        if (paramStr.length > 100000) {

                            appendLog(`⚠️ โหนด '${n.data.label}' มีพารามิเตอร์ '${k}' ขนาดใหญ่มาก: ${(paramStr.length/1024/1024).toFixed(2)} MB`, 'INFO');

                        }

                    });

                 });

              }



              const res = await fetch(`${BACKEND_URL}/api/nodes/execute`, {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: executePayloadStr

              });



              if (!isRunningRef.current || (currentRunIdRef.current && currentRunIdRef.current !== runId)) {

                activeNodes.delete(nodeId);

                setNodeActive(nodeId, false);

                return;

              }



              if (!res.ok) {

                throw new Error(`Execution request returned status ${res.status}`);

              }



              const result = await res.json();

              

              // Stream logs to console

              if (result.logs && Array.isArray(result.logs)) {

                result.logs.forEach((l: any) => {

                  appendLog(l.message, l.level);

                });

              }



              if (result.status === 'success') {

                runVariables = { ...runVariables, ...result.updated_variables };



                if (result.outputs) {

                  // Update allWorkflowNodes dynamically so getReadyNodes and getParentMaxListForNode have fresh parent outputs

                  const targetIdx = allWorkflowNodes.findIndex(n => n.id === nodeId);

                  if (targetIdx >= 0) {

                    allWorkflowNodes[targetIdx] = {

                      ...allWorkflowNodes[targetIdx],

                      data: {

                        ...allWorkflowNodes[targetIdx].data,

                        parameters: {

                          ...(allWorkflowNodes[targetIdx].data?.parameters || {}),

                          ...result.outputs

                        }

                      }

                    };

                  }



                  // Update local runVariables for subsequent nodes in this run

                  if (runVariables["_workflow_nodes"]) {

                    runVariables["_workflow_nodes"] = runVariables["_workflow_nodes"].map((n: any) => {

                      if (n.id === nodeId) {

                        return {

                          ...n,

                          data: {

                            ...n.data,

                            parameters: { ...(n.data?.parameters || {}), ...result.outputs }

                          }

                        };

                      }

                      return n;

                    });

                  }



                  setNodes((nds) => nds.map((n) => {

                    if (n.id === nodeId) {

                      return {

                        ...n,

                        data: {

                          ...n.data,

                          parameters: { ...n.data.parameters, ...result.outputs }

                        }

                      };

                    }

                    return n;

                  }));



                  // Sync selectedNode state if the executed node is currently selected

                  if (selectedNode && selectedNode.id === nodeId) {

                    setSelectedNode((prev: any) => prev ? {

                      ...prev,

                      data: {

                        ...prev.data,

                        parameters: { ...prev.data.parameters, ...result.outputs }

                      }

                    } : null);

                  }

                }



                appendLog(`Node '${label}' completed execution.`, 'INFO');



                // If this is an API Incremental or Datasource node, log explicit Wake Up signal to child nodes

                const childEdges = targetEdges.filter(e => e.source === nodeId);

                if (childEdges.length > 0) {

                  const isApiOrQuery = typeLower.includes('incremental') || nameLower.includes('incremental') || labelLower.includes('incremental') || typeLower.includes('query') || nameLower.includes('query');

                  if (isApiOrQuery) {

                    const childLabels = childEdges.map(edge => {

                      const chNode = allWorkflowNodes.find(n => n.id === edge.target);

                      return chNode ? `'${chNode.data?.label || chNode.data?.name || edge.target}'` : `'${edge.target}'`;

                    }).join(', ');

                    appendLog(`⚡ API Incremental: ส่งสัญญาณ Wake Up ปลุกโหนดลูกทั้งหมด ${childLabels} ให้ทำงานต่อในรอบนี้...`, 'INFO');

                  }

                }



                // Check for Queue/Agent Loop conditions & Multi-Agent chaining

                const hasNextVal = result.outputs?.hasNext ?? result.updated_variables?.hasNext ?? result.updated_variables?.has_next ?? runVariables.hasNext;

                const isHasNextTrue = hasNextVal === true || String(hasNextVal).toLowerCase() === 'true' || String(hasNextVal) === '1';

                const isAgentNode = nodeTypeLower.includes('agent') || nodeTypeLower.includes('ocr') || nodeClassLower.includes('pdf') || typeLower.includes('pdf') || nameLower.includes('pdf') || labelLower.includes('pdf') || nodeClassLower.includes('agent') || typeLower.includes('agent') || nameLower.includes('ai agent') || labelLower.includes('ai agent') || nameLower.includes('mark it down') || labelLower.includes('mark it down') || nodeClassLower.includes('mark it down');

                const isQueueNode = nodeTypeLower.includes('queue') || nodeClassLower.includes('queue') || typeLower.includes('queue') || nameLower.includes('queue') || labelLower.includes('queue');



                // Check if this executed node has any downstream connected AI Agent inside targetNodeIds

                const downstreamAiNodes = allWorkflowNodes.filter(n => {

                  const nType = (n.data?.nodeType || '').toLowerCase();

                  const nClass = getNodeClass(n).toLowerCase();

                  const nRfType = (n.type || '').toLowerCase();

                  const nName = (n.data?.name || '').toLowerCase();

                  const nLabel = (n.data?.label || '').toLowerCase();

                  const isAg = (nType.includes('agent') || nClass.includes('pdf') || nRfType.includes('pdf') || nName.includes('pdf') || nLabel.includes('pdf') || nClass.includes('agent') || nName.includes('ai agent') || nLabel.includes('ai agent') || nRfType.includes('agent')) && !nType.includes('queue') && !nClass.includes('queue') && !nRfType.includes('queue') && !nName.includes('queue');

                  return isAg && targetEdges.some(e => e.source === nodeId && e.target === n.id) && targetNodeIds.includes(n.id);

                });

                const hasDownstreamAi = downstreamAiNodes.length > 0;



                // Check if this executed node has any upstream connected AI Agent

                const upstreamAiNodes = allWorkflowNodes.filter(n => {

                  const nType = (n.data?.nodeType || '').toLowerCase();

                  const nClass = getNodeClass(n).toLowerCase();

                  const nRfType = (n.type || '').toLowerCase();

                  const nName = (n.data?.name || '').toLowerCase();

                  const nLabel = (n.data?.label || '').toLowerCase();

                  const isAg = (nType.includes('agent') || nClass.includes('pdf') || nRfType.includes('pdf') || nName.includes('pdf') || nLabel.includes('pdf') || nClass.includes('agent') || nName.includes('ai agent') || nLabel.includes('ai agent') || nRfType.includes('agent')) && !nType.includes('queue') && !nClass.includes('queue') && !nRfType.includes('queue') && !nName.includes('queue');

                  return isAg && targetEdges.some(e => e.source === n.id && e.target === nodeId);

                });



                // If this is an AI Agent and has downstream AI agent, set its latest output file status to 'Queue'

                if (isAgentNode && !isQueueNode && hasDownstreamAi) {

                  setNodes(nds => nds.map(n => {

                    if (n.id === nodeId) {

                      const outputsArr = Array.isArray(n.data.parameters?.agentOutputsTable) ? n.data.parameters.agentOutputsTable : (Array.isArray(result.outputs?.agentOutputsTable) ? result.outputs.agentOutputsTable : []);

                      const statusesMap = { ...(n.data.parameters?.agentOutputStatusesMap || {}) };

                      outputsArr.forEach((fn: string, idx: number) => {

                        if (idx === outputsArr.length - 1) {

                          statusesMap[fn] = 'Queue';

                        } else if (!statusesMap[fn]) {

                          statusesMap[fn] = 'Complete';

                        }

                      });

                      return {

                        ...n,

                        data: { ...n.data, parameters: { ...n.data.parameters, agentOutputStatusesMap: statusesMap } }

                      };

                    }

                    return n;

                  }));

                }



                // If this node finished analyzing data from an upstream AI Agent, mark upstream agent's output items as 'Complete'

                if (upstreamAiNodes.length > 0 && !isQueueNode) {

                  setNodes(nds => nds.map(n => {

                    if (upstreamAiNodes.some(up => up.id === n.id)) {

                      const outputsArr = Array.isArray(n.data.parameters?.agentOutputsTable) ? n.data.parameters.agentOutputsTable : [];

                      const statusesMap = { ...(n.data.parameters?.agentOutputStatusesMap || {}) };

                      outputsArr.forEach((fn: string) => {

                        statusesMap[fn] = 'Complete';

                      });

                      return {

                        ...n,

                        data: { ...n.data, parameters: { ...n.data.parameters, agentOutputStatusesMap: statusesMap } }

                      };

                    }

                    return n;

                  }));

                }



                if (isAgentNode && !isQueueNode && isHasNextTrue) {

                  // Agent still has items to process (hasNext is true), loop on this agent (Batch Loop)

                  // We DO NOT add this agent to completedNodes, allowing getReadyNodes() to trigger it again for the next row.

                  appendLog(`[Batch Loop] โหนด '${label}' ประมวลผลแถวที่ ${result.outputs?.currentIndex || ''} เสร็จสิ้น มีคิวถัดไป กำลังประมวลผลต่อ...`, 'INFO');

                  return;

                } else if (isQueueNode && !isHasNextTrue) {

                  completedNodes.add(nodeId);

                  appendLog(`[Queue Node] Queue download complete.`, 'INFO');

                } else {

                  completedNodes.add(nodeId);

                }

              } else {

                throw new Error(result.message || result.error || result.logs?.[0]?.message || 'Stateless execution failed');

              }

            } catch (err: any) {

              appendLog(`Node '${label}' failed: ${err.message}`, 'ERROR');

              failedNodes.add(nodeId);

            } finally {

              activeNodes.delete(nodeId);

              setNodeActive(nodeId, false);

            }

          });



          await Promise.all(execPromises);

        }



        const hasFailures = failedNodes.size > 0;

        appendLog(

          hasFailures 

            ? `[System] Client-side Workflow Run finished with errors.` 

            : `[System] Client-side Workflow Run completed successfully.`,

          hasFailures ? 'ERROR' : 'SUCCESS'

        );



        setProcesses((prev) =>

          prev.map((proc) => {

            if (proc.id === runId || proc.workflowId === runId || (targetWorkflowId && (proc.id === targetWorkflowId || proc.workflowId === targetWorkflowId))) {

              return {

                ...proc,

                status: hasFailures ? 'failed' : 'idle',

                currentStep: 6

              };

            }

            return proc;

          })

        );

      } catch (err: any) {

        appendLog(`[System] Execution loop error: ${err.message}`, 'ERROR');

      setIsRunning(false);

        isRunningRef.current = false;

      }

    })();

  };



  // handleRunRef declared near top of component

  useEffect(() => {

    handleRunRef.current = handleRun;

  }, [handleRun]);



  // Direct Execution Wake Up for idle AI Agents (Workflow Timer Orchestrator)

  const executeSingleNodeWakeUp = async (nodeId: string) => {

    const currentNodes = nodesRef.current;

    const currentEdges = edgesRef.current || [];

    const targetNode = currentNodes.find(n => n.id === nodeId);

    if (!targetNode || !targetNode.data) return;



    if (targetNode.data.status === 'running' || inFlightWakeUpNodesRef.current.has(nodeId)) {

      console.log(`[Workflow Timer ⏱️] โหนด '${targetNode.data.label || targetNode.data.name}' กำลังประมวลผลอยู่ (running/in-flight) -> ข้ามการ Wake Up`);

      return;

    }



    inFlightWakeUpNodesRef.current.add(nodeId);



    // STRICT SUBFLOW GUARD: If subflow mode is active, only wake up allowed subflow nodes

    const wfTimer = currentNodes.find(n => isWorkflowTimerNode(n));

    const isSubflow = wfTimer?.data?.parameters?.runMode === 'subflow' || isSubflowModeActive;

    if (isSubflow) {

      const allowedIds = (wfTimer?.data?.parameters?.subflowNodeIds && Array.isArray(wfTimer.data.parameters.subflowNodeIds) && wfTimer.data.parameters.subflowNodeIds.length > 0)

        ? wfTimer.data.parameters.subflowNodeIds

        : (selectedProcessNodeIds && selectedProcessNodeIds.length > 0 ? selectedProcessNodeIds : []);

      if (allowedIds.length > 0 && !allowedIds.includes(nodeId)) {

        console.log(`[Workflow Timer ⏱️] โหนด '${targetNode.data.label || targetNode.data.name}' ข้ามการ Wake Up เนื่องจากไม่อยู่ในรายชื่อ Process Inspector / Subflow`);

        inFlightWakeUpNodesRef.current.delete(nodeId);

        return;

      }

    }



    const { parentMax, parentName } = getParentMaxListForNode(nodeId, currentNodes, currentEdges);

    const childCount = getChildCompletedCountForNode(targetNode);

    const nextIdx = childCount + 1;

    const nodeLabel = targetNode.data.label || targetNode.data.name || nodeId;



    appendGlobalLog(`[Workflow Timer ⏱️] Wake Up: โหนด '${nodeLabel}' ว่างงาน ปลุกให้ดึงข้อมูลแถวที่ ${nextIdx}/${parentMax || 'all'} จากโหนด ${parentName || 'Parent'} มาประมวลผล...`, 'INFO');



    // Set node status to running on canvas and update nodesRef synchronously

    nodesRef.current = nodesRef.current.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n);

    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n));

    if (selectedNode && selectedNode.id === nodeId) {

      setSelectedNode((prev: any) => prev ? { ...prev, data: { ...prev.data, status: 'running' } } : null);

    }



    try {

      const incomingIds = currentEdges.filter(e => e.target === nodeId).map(e => e.source);

      const wakeVariables: Record<string, any> = {

        workflow_id: selectedWorkflowId,

        _workflow_nodes: currentNodes.map(n => ({ id: n.id, type: n.type, data: n.data })),

        _workflow_edges: currentEdges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),

        _incoming_node_ids: incomingIds,

        ai_models: aiModels

      };



      incomingIds.forEach(srcId => {

        const srcNode = currentNodes.find(n => n.id === srcId);

        if (srcNode?.data?.parameters) {

          wakeVariables[srcId + "_output"] = srcNode.data.parameters;

          Object.keys(srcNode.data.parameters).forEach(k => {

            wakeVariables[k] = srcNode.data.parameters[k];

          });

        }

      });



      const executePayloadStr = JSON.stringify({

        node_id: nodeId,

        node_type: targetNode.data?.nodeType || getNodeClass(targetNode) || targetNode.type || 'WorkflowNode',

        node_data: targetNode.data,

        incoming_node_ids: incomingIds,

        variables: wakeVariables,

        workflow_nodes: currentNodes.map(n => ({ id: n.id, type: n.type, data: n.data })),

        workflow_edges: currentEdges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),

        current_run_id: `wakeup-${Date.now()}`,

        workflow_id: selectedWorkflowId

      });



      const res = await fetch(`${BACKEND_URL}/api/nodes/execute`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: executePayloadStr

      });



      if (!res.ok) {

        throw new Error(`Execute request failed with status ${res.status}`);

      }



      const result = await res.json();

      if (result.logs && Array.isArray(result.logs)) {

        result.logs.forEach((l: any) => appendGlobalLog(l.message, l.level as any));

      }



      if (result.status === 'success' && result.outputs) {

        nodesRef.current = nodesRef.current.map(n => {

          if (n.id === nodeId) {

            return {

              ...n,

              data: {

                ...n.data,

                status: 'idle',

                parameters: { ...n.data.parameters, ...result.outputs }

              }

            };

          }

          return n;

        });

        setNodes(nds => nds.map(n => {

          if (n.id === nodeId) {

            return {

              ...n,

              data: {

                ...n.data,

                status: 'idle',

                parameters: { ...n.data.parameters, ...result.outputs }

              }

            };

          }

          return n;

        }));



        if (selectedNode && selectedNode.id === nodeId) {

          setSelectedNode((prev: any) => prev ? {

            ...prev,

            data: {

              ...prev.data,

              status: 'idle',

              parameters: { ...prev.data.parameters, ...result.outputs }

            }

          } : null);

        }



        appendGlobalLog(`[Workflow Timer ⏱️] โหนด '${nodeLabel}' ประมวลผลแถวที่ ${nextIdx} เรียบร้อยแล้ว (สถานะกลับเป็น idle พร้อมรับรอบถัดไป)`, 'INFO');

      } else {

        nodesRef.current = nodesRef.current.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'idle' } } : n);

        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'idle' } } : n));

        if (selectedNode && selectedNode.id === nodeId) {

          setSelectedNode((prev: any) => prev ? { ...prev, data: { ...prev.data, status: 'idle' } } : null);

        }

      }

    } catch (err: any) {

      const isFetchErr = err.message === 'Failed to fetch';

      const errMsg = isFetchErr

        ? `Failed to fetch (ไม่สามารถเชื่อมต่อ Backend Server ที่ ${BACKEND_URL} ได้ กรุณาตรวจสอบว่า Backend Server เปิดอยู่หรือไม่)`

        : err.message;

      appendGlobalLog(`[Workflow Timer ⏱️] เกิดข้อผิดพลาดในการรัน Wake Up '${nodeLabel}': ${errMsg}`, 'ERROR');

      nodesRef.current = nodesRef.current.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'idle' } } : n);

      setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'idle' } } : n));

      if (selectedNode && selectedNode.id === nodeId) {

        setSelectedNode((prev: any) => prev ? { ...prev, data: { ...prev.data, status: 'idle' } } : null);

      }

    } finally {

      inFlightWakeUpNodesRef.current.delete(nodeId);

    }

  };



  // Frontend-side Scheduler Loop (Pure Client-side Countdown)

  useEffect(() => {

    const checkScheduler = async () => {

      const currentNodes = nodesRef.current;

      const currentEdges = edgesRef.current || [];



      // 1. Workflow Timer (Orchestrator Heartbeat: wakes up idle AI Agents)

      const wfTimerNode = currentNodes.find(n => 

        isWorkflowTimerNode(n) && n.data?.parameters?.schedulerActive === true

      );



      if (wfTimerNode) {

        const wfParams = wfTimerNode.data.parameters || {};

        let remaining = wfParams.remainingSeconds;

        const intervalVal = wfParams.intervalValue !== undefined ? Math.max(1, Number(wfParams.intervalValue)) : 2;



        if (remaining === undefined || remaining === null || remaining < 0) {

          remaining = intervalVal;

        }



        const nextRemaining = remaining - 1;

        if (nextRemaining > 0) {

          setNodes(nds => nds.map(n => n.id === wfTimerNode.id ? {

            ...n,

            data: { ...n.data, parameters: { ...n.data.parameters, remainingSeconds: nextRemaining } }

          } : n));

        } else {

          // Reached 0! Reset countdown to intervalVal

          setNodes(nds => nds.map(n => n.id === wfTimerNode.id ? {

            ...n,

            data: { ...n.data, parameters: { ...n.data.parameters, remainingSeconds: intervalVal } }

          } : n));



          // Determine scope: Subflow vs Full

          const runMode = wfParams.runMode || 'full';

          let targetScopeIds: string[] | null = null;

          if (runMode === 'subflow') {

            let initialScope: string[] = [];

            if (Array.isArray(wfParams.subflowNodeIds) && wfParams.subflowNodeIds.length > 0) {

              initialScope = wfParams.subflowNodeIds;

            } else if (selectedProcessNodeIds && selectedProcessNodeIds.length > 0) {

              initialScope = selectedProcessNodeIds;

            }



            if (initialScope.length > 0) {

              // STRICT SCOPE: Only execute nodes explicitly selected in Process Inspector / Subflow

              // Do NOT auto-expand to unselected downstream child nodes!

              targetScopeIds = [...initialScope];

            }

          }



          // Candidate nodes within scope

          const candidateNodes = targetScopeIds

            ? currentNodes.filter(n => targetScopeIds!.includes(n.id))

            : currentNodes;



          // Target 3 AI Agent nodes: PDFs Image, PDFs, DB

          const targetAgents = candidateNodes.filter(n => isTargetAgentNode(n));



          for (const ag of targetAgents) {

            // Check condition: If running/busy, DO NOT Wake Up!

            if (ag.data?.status === 'running') {

              console.log(`[Workflow Timer ⏱️] โหนด '${ag.data?.label || ag.data?.name}' กำลังประมวลผลข้อมูลอยู่ (running) -> ข้ามการ Wake Up`);

              continue;

            }



            // If idle, check pending backlog from parent nodes

            const { parentMax } = getParentMaxListForNode(ag.id, currentNodes, currentEdges);

            const childCount = getChildCompletedCountForNode(ag);



            if (parentMax > 0 && childCount < parentMax) {

              // Node is idle and parent has pending items -> WAKE UP!

              await executeSingleNodeWakeUp(ag.id);

            }

          }

        }

      }



      // 2. Regular Timer nodes (Countdown and trigger downstream child nodes along DAG edges)

      const regTimerNodes = currentNodes.filter(n => 

        isRegularTimerNode(n) && n.data?.parameters?.schedulerActive === true &&

        (n.data?.parameters?.runMode !== 'subflow' || n.data?.parameters?.activeSubflow === true)

      );



      for (const regTimer of regTimerNodes) {

        const params = regTimer.data.parameters || {};

        let rem = params.remainingSeconds;

        if (rem === undefined || rem === null || rem < 0) {

          rem = calculateNextTimerSeconds(params);

        }

        const nextRem = rem - 1;

        if (nextRem > 0) {

          setNodes(nds => nds.map(n => n.id === regTimer.id ? {

            ...n,

            data: { ...n.data, parameters: { ...n.data.parameters, remainingSeconds: nextRem } }

          } : n));

        } else {

          const resetSecs = calculateNextTimerSeconds(params);

          setNodes(nds => nds.map(n => n.id === regTimer.id ? {

            ...n,

            data: { ...n.data, parameters: { ...n.data.parameters, remainingSeconds: resetSecs } }

          } : n));



          const childEdges = currentEdges.filter(e => e.source === regTimer.id);

          if (childEdges.length > 0) {

            const childIds = childEdges.map(e => e.target);

            appendGlobalLog(`[Timer ⏱️] Countdown ถึง 0: Trigger ส่งสัญญาณไปที่โหนดลูก ${childIds.join(', ')} ตามลำดับ DAG`, 'INFO');

            await handleRunRef.current(childIds, currentNodes, true);

          }

        }

      }

    };



    const interval = setInterval(checkScheduler, 1000);

    return () => clearInterval(interval);

  }, [selectedWorkflowId]);



  return {
    handleRun,
    executeSingleNodeWakeUp,
  };
}
