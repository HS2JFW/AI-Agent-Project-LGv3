import React, { useState, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import {
  sanitizeLoadedNodes,
  buildAgentNodesFromLogicNodes,
  buildAgentEdgesFromLogicEdges,
} from '../utils/nodeGraphUtils';

export interface UseWorkflowStorageProps {
  selectedWorkflowId: string | null;
  setSelectedWorkflowId: React.Dispatch<React.SetStateAction<string | null>>;
  workflowName: string;
  setWorkflowName: React.Dispatch<React.SetStateAction<string>>;
  workflowDesc: string;
  setWorkflowDesc: React.Dispatch<React.SetStateAction<string>>;
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  agentNodes: Node[];
  setAgentNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  agentEdges: Edge[];
  setAgentEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setProcesses: React.Dispatch<React.SetStateAction<any[]>>;
  currentFileHandle: any;
  setCurrentFileHandle: React.Dispatch<React.SetStateAction<any>>;
  currentFileName: string | null;
  setCurrentFileName: React.Dispatch<React.SetStateAction<string | null>>;
  lastSavedState: string;
  setLastSavedState: React.Dispatch<React.SetStateAction<string>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  historyLimit: number;
  setHistoryLimit: React.Dispatch<React.SetStateAction<number>>;
  aiModels: any[];
  setAiModels: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedNode: (node: any) => void;
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  setPast: React.Dispatch<React.SetStateAction<any[]>>;
  setFuture: React.Dispatch<React.SetStateAction<any[]>>;
  showAlert: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
  logUserAction: (action: string, meta?: any, ctx?: any) => void;
  serializeCurrentState: () => string;
  activeTab: 'logic' | 'process' | 'settings';
  fetchWorkflows?: (activeWfId?: string) => Promise<any> | void;
  backendUrl?: string;
}

export function useWorkflowStorage({
  selectedWorkflowId,
  setSelectedWorkflowId,
  workflowName,
  setWorkflowName,
  workflowDesc,
  setWorkflowDesc,
  nodes,
  setNodes,
  edges,
  setEdges,
  agentNodes,
  setAgentNodes,
  agentEdges,
  setAgentEdges,
  setProcesses,
  currentFileHandle,
  setCurrentFileHandle,
  currentFileName,
  setCurrentFileName,
  lastSavedState,
  setLastSavedState,
  fileInputRef,
  historyLimit,
  setHistoryLimit,
  aiModels,
  setAiModels,
  setSelectedNode,
  setLogs,
  setPast,
  setFuture,
  showAlert,
  logUserAction,
  serializeCurrentState,
  activeTab,
  fetchWorkflows,
  backendUrl,
}: UseWorkflowStorageProps) {
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
  void lastSavedState;
  void historyLimit;


  const executeServerSave = async (showNotification: boolean = false) => {

    if (!selectedWorkflowId && nodes.length === 0) return;

    try {

      const saveId = selectedWorkflowId || 'wf-' + Date.now();

      const payload = {

        id: saveId,

        name: workflowName || 'Unnamed Work Flow',

        description: workflowDesc || '',

        nodes: sanitizeLoadedNodes(nodes),

        edges: edges,

        agentNodes: agentNodes.length > 0 ? sanitizeLoadedNodes(agentNodes) : sanitizeLoadedNodes(buildAgentNodesFromLogicNodes(nodes)),

        agentEdges: agentEdges.length > 0 ? agentEdges : buildAgentEdgesFromLogicEdges(edges),

        aiModels: aiModels

      };



      const res = await fetch(`${BACKEND_URL}/api/workflows${selectedWorkflowId ? '/' + selectedWorkflowId : ''}`, {

        method: selectedWorkflowId ? 'PUT' : 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload),

      });



      if (res.ok) {

        const data = await res.json();

        if (!selectedWorkflowId && data.id) {

          setSelectedWorkflowId(data.id);

        }



        setProcesses(prev => {

           const exists = prev.find(p => p.id === saveId || p.workflowId === saveId);

           const updatedProcData = {

             name: workflowName || 'Unnamed Work Flow',

             description: workflowDesc || '',

             nodes: nodes,

             edges: edges,

             agentNodes: agentNodes.length > 0 ? agentNodes : buildAgentNodesFromLogicNodes(nodes),

             agentEdges: agentEdges.length > 0 ? agentEdges : buildAgentEdgesFromLogicEdges(edges),

           };

           

           if (exists) {

               return prev.map(p => p.id === saveId || p.workflowId === saveId ? { ...p, ...updatedProcData } : p);

           } else {

               return [...prev, {

                  id: saveId,

                  workflowId: saveId,

                  startTime: new Date().toISOString(),

                  status: 'idle',

                  ...updatedProcData

               }];

           }

        });



        if (showNotification) {

          showAlert("Workflow saved to system Database & JSON files.", "Save Status", "success");

        }

      }

    } catch (e) {

      console.error("Server save synchronization error:", e);

      if (showNotification) {

        showAlert("Failed to save workflow to backend server.", "Save Error", "error");

      }

    }

  };



  const handleManualSystemSave = async () => {

    logUserAction(`Manual System Save (${workflowName || selectedWorkflowId})`, { workflowId: selectedWorkflowId }, { file: 'App.tsx', class: 'App', func: 'handleManualSystemSave', logType: 'process_action' });

    setIsAutoSaving(true);

    await executeServerSave(true);

    setIsAutoSaving(false);

  };



  useEffect(() => {

    // Only auto-save if we are on the Logic tab and have active canvas data or selected workflow

    if (activeTab !== 'logic' || !selectedWorkflowId) return;



    setIsAutoSaving(true);

    const timer = setTimeout(async () => {

      await executeServerSave(false);

      setIsAutoSaving(false);

    }, 1500); // 1.5 second smart debounce interval



    return () => clearTimeout(timer);

  }, [nodes, edges, workflowName, workflowDesc, aiModels]);



  // 4. Local File Workflow Management

  const handleSaveWorkflow = async (forcePrompt: boolean = false): Promise<boolean> => {

    logUserAction(`Export/Save Workflow (${workflowName || 'Unnamed'})`, { workflowName: workflowName }, { file: 'App.tsx', class: 'App', func: 'handleSaveWorkflow', logType: 'process_action' });

    const payloadStr = serializeCurrentState();



    try {

      const saveId = selectedWorkflowId || 'wf-' + Date.now();

      await fetch(`${BACKEND_URL}/api/workflows${selectedWorkflowId ? '/' + selectedWorkflowId : ''}`, {

        method: selectedWorkflowId ? 'PUT' : 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          id: saveId,

          name: workflowName || 'Unnamed Work Flow',

          description: workflowDesc || '',

          nodes: sanitizeLoadedNodes(nodes),

          edges,

          agentNodes: sanitizeLoadedNodes(agentNodes),

          agentEdges,

          aiModels

        })

      });

      if (!selectedWorkflowId) setSelectedWorkflowId(saveId);

    } catch (e) {

      console.error("Backend DB/JSON save sync error:", e);

    } 

    

    // 1. If we have a file handle, save directly (overwrite)

      if (currentFileHandle && !forcePrompt) {

      try {

        const writable = await currentFileHandle.createWritable();

        await writable.write(payloadStr);

        await writable.close();

        setLastSavedState(payloadStr);

        return true;

      } catch (err) {

        console.error('Failed to save directly to file handle, prompting picker', err);

      }

    }

    

    // 2. Otherwise prompt for name and location

    if ((window as any).showSaveFilePicker) {

      try {

        const handle = await (window as any).showSaveFilePicker({

          suggestedName: currentFileName || `${workflowName || 'workflow'}.wf`,

          types: [

            {

              description: 'Workflow Files (*.wf)',

              accept: {

                'application/json': ['.wf']

              }

            }

          ]

        });

        const writable = await handle.createWritable();

        await writable.write(payloadStr);

        await writable.close();

        

        if (!forcePrompt) {

            setCurrentFileHandle(handle);

            setCurrentFileName(handle.name);

          }

          setLastSavedState(payloadStr);

        return true;

      } catch (err: any) {

        if (err.name !== 'AbortError') {

          console.error(err);

          showAlert('Error saving workflow file: ' + err.message, 'Save Error', 'error');

        }

        return false;

      }

    } else {

      // Browser Fallback (download blob file)

      try {

        const blob = new Blob([payloadStr], { type: 'application/json' });

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;

        a.download = currentFileName || `${workflowName || 'workflow'}.wf`;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        

        if (!currentFileName) {

          setCurrentFileName(`${workflowName || 'workflow'}.wf`);

        }

        setLastSavedState(payloadStr);

        return true;

      } catch (err: any) {

        console.error(err);

        showAlert('Error downloading workflow: ' + err.message, 'Download Error', 'error');

        return false;

      }

    }

  };



  const handleOpenWorkflow = async () => {

    logUserAction(`Import/Open Workflow from File`, {}, { file: 'App.tsx', class: 'App', func: 'handleOpenWorkflow', logType: 'process_action' });

    if ((window as any).showOpenFilePicker) {

      try {

        const [handle] = await (window as any).showOpenFilePicker({

          types: [

            {

              description: 'Workflow Files (*.wf)',

              accept: {

                'application/json': ['.wf']

              }

            }

          ],

          excludeAcceptAllOption: true,

          multiple: false

        });

        

        const file = await handle.getFile();

        const text = await file.text();

        loadWorkflowFromJson(text, handle);

      } catch (err: any) {

        if (err.name !== 'AbortError') {

          console.error(err);

          showAlert('Error opening workflow file: ' + err.message, 'Open Error', 'error');

        }

      }

    } else {

      // Fallback file input trigger

      if (fileInputRef.current) {

        fileInputRef.current.click();

      }

    }

  };



  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const files = e.target.files;

    if (!files || files.length === 0) return;

    const file = files[0];

    try {

      const text = await file.text();

      loadWorkflowFromJson(text, null, file.name);

    } catch (err: any) {

      console.error(err);

      showAlert('Error reading workflow file: ' + err.message, 'Read Error', 'error');

    }

    e.target.value = ''; // reset target

  };



  const loadWorkflowFromJson = (jsonText: string, fileHandle: any, fallbackFileName?: string) => {

    try {

      const parsed = JSON.parse(jsonText);

      if (!parsed.nodes && !parsed.edges) {

        throw new Error('Invalid workflow file layout.');

      }

      

      const targetName = (selectedWorkflowId && workflowName) ? workflowName : (parsed.name || 'Untitled');

      const targetDesc = (selectedWorkflowId && workflowDesc !== undefined) ? workflowDesc : (parsed.description || '');

      const targetWfId = selectedWorkflowId || parsed.id || ('wf-' + Date.now());



      if (!selectedWorkflowId) {

        setWorkflowName(targetName);

        setWorkflowDesc(targetDesc);

      }

      

      if (typeof parsed.historyLimit === 'number') {

        setHistoryLimit(parsed.historyLimit);

      }

      

      const sanitizedNodes = sanitizeLoadedNodes(parsed.nodes || []);

      

      setNodes(sanitizedNodes);

      setEdges(parsed.edges || []);

      

      // Load or reconstruct agent nodes and edges

      let sanitizedAgentNodes: any[] = [];

      if (parsed.agentNodes && parsed.agentNodes.length > 0) {

        sanitizedAgentNodes = sanitizeLoadedNodes(parsed.agentNodes || []);

        setAgentNodes(sanitizedAgentNodes);

        setAgentEdges(parsed.agentEdges || []);

      } else {

        sanitizedAgentNodes = buildAgentNodesFromLogicNodes(sanitizedNodes);

        setAgentNodes(sanitizedAgentNodes);

        setAgentEdges(buildAgentEdgesFromLogicEdges(parsed.edges || []));

      }



      if (parsed.aiModels && Array.isArray(parsed.aiModels) && parsed.aiModels.length > 0) {

        setAiModels(prev => {

          const newModels = [...prev];

          parsed.aiModels.forEach((m: any) => {

            if (!newModels.find(nm => nm.id === m.id || nm.modelName === m.modelName)) {

              newModels.push(m);

            }

          });

          return newModels;

        });

      }



      setSelectedNode(null);

      setLogs([]);

      

      // Prepare payload to PUT/POST to backend for in-place import replacement without spawning duplicate process entries!

      const isExisting = Boolean(selectedWorkflowId);

      const url = isExisting ? `${BACKEND_URL}/api/workflows/${selectedWorkflowId}` : `${BACKEND_URL}/api/workflows`;

      const method = isExisting ? 'PUT' : 'POST';



      const payload = {

        id: targetWfId,

        name: targetName,

        description: targetDesc,

        nodes: sanitizedNodes,

        edges: parsed.edges || [],

        agentNodes: sanitizedAgentNodes,

        agentEdges: parsed.agentEdges && parsed.agentEdges.length > 0 ? parsed.agentEdges : buildAgentEdgesFromLogicEdges(parsed.edges || []),

        aiModels: parsed.aiModels || aiModels

      };



      fetch(url, {

        method: method,

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload),

      })

      .then(res => {

        if (!res.ok) throw new Error('Failed to import workflow file to backend');

        return res.json();

      })

      .then(data => {

        const finalId = data.id || targetWfId;

        setSelectedWorkflowId(finalId);

        fetchWorkflows?.(finalId);

        console.log('Workflow graph successfully imported and updated in-place:', finalId);

      })

      .catch(e => {

        console.error('Failed to import workflow:', e);

      });

      

      setPast([]);

      setFuture([]);

      

      setCurrentFileHandle(fileHandle);

      setCurrentFileName(fileHandle ? fileHandle.name : (fallbackFileName || 'loaded.wf'));

      

      // Update saved reference string

      setLastSavedState(JSON.stringify({

        name: targetName,

        description: targetDesc,

        historyLimit: typeof parsed.historyLimit === 'number' ? parsed.historyLimit : 50,

        nodes: sanitizedNodes.map((n: any) => ({

          id: n.id,

          type: n.type,

          position: n.position,

          data: n.data

        })),

        edges: (parsed.edges || []).map((e: any) => ({

          id: e.id,

          source: e.source,

          target: e.target,

          animated: e.animated

        })),

        agentNodes: (parsed.agentNodes || []).map((n: any) => ({

          id: n.id,

          type: n.type,

          parentNode: n.parentNode,

          extent: n.extent,

          position: n.position,

          style: n.style,

          data: n.data,

          draggable: n.draggable

        })),

        agentEdges: (parsed.agentEdges || []).map((e: any) => ({

          id: e.id,

          source: e.source,

          target: e.target,

          style: e.style,

          animated: e.animated

        }))

      }));

    } catch (err: any) {

      showAlert('Failed to load workflow file: ' + err.message, 'Load Error', 'error');

    }

  };




  return {
    isAutoSaving,
    setIsAutoSaving,
    executeServerSave,
    handleManualSystemSave,
    handleSaveWorkflow,
    handleOpenWorkflow,
    handleFileInputChange,
    loadWorkflowFromJson,
  };
}
