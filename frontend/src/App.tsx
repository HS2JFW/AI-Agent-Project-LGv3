import FloatingDialogManager from './components/dialogs/FloatingDialogManager';
import JsonPreviewModal from './components/dialogs/JsonPreviewModal';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Node
} from 'reactflow';

import 'reactflow/dist/style.css';




import { getSidebarIcon } from './components/sidebars/sidebarIcons';



import CustomNode from './components/CustomNode';

import ContainerNode from './components/ContainerNode';

import RubricNode from './nodes/RubricNode';

import SampleNode from './nodes/SampleNode';

import MCANode from './nodes/MCANode';

import TableNode from './nodes/TableNode';


import { type SampleData } from './components/SampleBuilder';

import { type TableData } from './components/TableBuilder';


import PdfExtractorNode from './nodes/PdfExtractorNode';

import LoginScreen from './components/LoginScreen';

import UnifiedSettingsModal from './components/UnifiedSettingsModal';
import UserManagementModal from './components/UserManagementModal';
import CanvasFlowArea from './components/canvas/CanvasFlowArea';
import PropertiesInspector from './components/inspector/PropertiesInspector';
import TimePickerModals from './components/modals/TimePickerModals';
import GlobalConfirmationModals from './components/modals/GlobalConfirmationModals';
import { useWorkflowStorage } from './hooks/useWorkflowStorage';
import { useWorkflowRunner } from './hooks/useWorkflowRunner';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { useCanvasShortcuts } from './hooks/useCanvasShortcuts';
import { useWorkflowGroups } from './hooks/useWorkflowGroups';
import { useWorkflowProcesses } from './hooks/useWorkflowProcesses';
import { useCanvasInteractions } from './hooks/useCanvasInteractions';
import { useBigDataDrillDown } from './hooks/useBigDataDrillDown';
import { useWorkflowTimers } from './hooks/useWorkflowTimers';
import { useCanvasMarqueeEdges } from './hooks/useCanvasMarqueeEdges';
import { useFloatingDialogs } from './hooks/useFloatingDialogs';
import { useTimePickers } from './hooks/useTimePickers';
import { useSystemAlert } from './hooks/useSystemAlert';
import { useWorkflowAuditLogs } from './hooks/useWorkflowAuditLogs';
import {
  getNodeClass,
  isWorkflowTimerNode,
  isProtectedTimerNode,

  sanitizeLoadedNodes,
  buildAgentNodesFromLogicNodes,
  buildAgentEdgesFromLogicEdges,
} from './utils/nodeGraphUtils';
import BottomLogViewerTray from './components/canvas/BottomLogViewerTray';
import DashboardNavRail from './components/sidebars/DashboardNavRail';
import SubMenuFlyout from './components/sidebars/SubMenuFlyout';
import CanvasNavRail from './components/sidebars/CanvasNavRail';
import ProjectsDashboard from './components/dashboard/ProjectsDashboard';
import WorkflowManagementModals from './components/modals/WorkflowManagementModals';

import { useWorkflowState, useWorkflowExecution, useQueueManager } from './hooks';
void useWorkflowState; void useWorkflowExecution; void useQueueManager;



const nodeTypes = {

  customNode: CustomNode,

  containerNode: ContainerNode,

  rubric: RubricNode,

  mca: MCANode,

  sample: SampleNode,

  table: TableNode,

  pdfExtractor: PdfExtractorNode,

};



// Sidebar menus & themes
import {
  DRAGGABLE_TEMPLATES,
  GROUP_MENUS,
} from './constants/sidebarMenus';

// Default initial workflow templates
import {
} from './constants/defaultWorkflow';


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';



function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(() => {

    return Boolean(localStorage.getItem('app_auth_token'));

  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('app_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isUserManagementOpen, setIsUserManagementOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('modal') === 'users' || window.location.hash === '#users' || window.location.hash === '#/users';
    } catch (e) {
      return false;
    }
  });
  const handleLogout = useCallback(() => {
    localStorage.removeItem('app_auth_token');
    localStorage.removeItem('app_user');
    setCurrentUser(null);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('modal') === 'users' || window.location.hash === '#users' || window.location.hash === '#/users') {
          setIsUserManagementOpen(true);
        }
      } catch (e) {}
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const [isShowingSettings, setIsShowingSettings] = useState<boolean>(false); void isShowingSettings;

  const [isShowingModels, setIsShowingModels] = useState<boolean>(false); void isShowingModels;

  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);

  const [editingProcessName, setEditingProcessName] = useState<string>('');

  void editingProcessId; void setEditingProcessName;

  

  const handleSaveProcessName = async (proc: any) => {

    void handleSaveProcessName;

    if (!editingProcessName.trim() || editingProcessName === proc.name) {

      setEditingProcessId(null);

      return;

    }

    const newName = editingProcessName.trim();

    

    setProcesses(prev => prev.map(p => p.id === proc.id ? { ...p, name: newName } : p));

    if (proc.workflowId === selectedWorkflowId) {

      setWorkflowName(newName);

    }

    

    if (proc.workflowId && proc.workflowId !== 'default') {

      try {

        const res = await fetch(`${BACKEND_URL}/api/workflows/${proc.workflowId}`);

        if (res.ok) {

          const wfData = await res.json();

          wfData.name = newName;

          await fetch(`${BACKEND_URL}/api/workflows/${proc.workflowId}`, {

            method: 'PUT',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(wfData)

          });

        }

      } catch (err) {

        console.error("Failed to rename workflow on backend", err);

      }

    }

    setEditingProcessId(null);

  };





  const [rubricBuilderNodeId, setRubricBuilderNodeId] = useState<string | null>(null);

  const [sampleBuilderNodeId, setSampleBuilderNodeId] = useState<string | null>(null);

  const [tableBuilderNodeId, setTableBuilderNodeId] = useState<string | null>(null);

  const [workflows, setWorkflows] = useState<any[]>([]);

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(() => {

    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  });



  useEffect(() => {

    const clockTimer = setInterval(() => {

      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

    }, 1000);

    return () => clearInterval(clockTimer);

  }, []);

  // Floating Dialogs Hook
  const {
    dialogs,
    openDialog,
    closeDialog,
    updateDialog,
    bringToFront,
  } = useFloatingDialogs({
    selectedWorkflowId,
    backendUrl: BACKEND_URL,
  });







  const [workflowName, setWorkflowName] = useState('My AI Agent Workflow');

  const [workflowDesc, setWorkflowDesc] = useState('Automated TOR audit and risk evaluation flow');



  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedProcessNodeIds, setSelectedProcessNodeIds] = useState<string[]>([]);
  const [isSubflowModeActive, setIsSubflowModeActive] = useState<boolean>(false);

  const { timersState } = useWorkflowTimers({
    selectedWorkflowId,
    setNodes,
    backendUrl: BACKEND_URL,
  });
  void timersState;



  useCanvasMarqueeEdges({ setEdges });





  useEffect(() => {

    setSelectedNode(prevSelected => {

      if (!prevSelected) return null;

      const updatedMatch = nodes.find(n => n.id === prevSelected.id);

      if (updatedMatch) {

        if (JSON.stringify(updatedMatch.data) !== JSON.stringify(prevSelected.data) || updatedMatch.selected !== prevSelected.selected) {

          return updatedMatch;

        }

        return prevSelected;

      }

      return null;

    });

  }, [nodes]);






  const [pdfQueuePage, setPdfQueuePage] = useState(1);

  const [zipQueuePage, setZipQueuePage] = useState(1);

  const [agentOutputsPage, setAgentOutputsPage] = useState(1);

  const [serverPdfQueueFiles, setServerPdfQueueFiles] = useState<any[]>([]);

  const [serverTxtQueueFiles, setServerTxtQueueFiles] = useState<any[]>([]);

  const [txtQueuePage, setTxtQueuePage] = useState(1);

  const [serverZipQueueFiles, setServerZipQueueFiles] = useState<any[]>([]); void serverPdfQueueFiles;

  const [serverAgentOutputsFiles, setServerAgentOutputsFiles] = useState<string[]>([]);

  const [nodeLiveProgress, setNodeLiveProgress] = useState<Record<string, {

    currentIndex?: number;

    currentPage?: number;

    totalPages?: number;

    percent?: number;

    status?: string;

    stepMessage?: string;

    filename?: string;

    updatedAt?: number;

  }>>({});






  useEffect(() => {

    setPdfQueuePage(1);

    setAgentOutputsPage(1);

    if (!selectedNode) return;

    const fetchLists = async () => {

      const wfParam = selectedWorkflowId || 'wf_default';

      try {

        const resPdf = await fetch(`${BACKEND_URL}/api/list-pdf-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(selectedNode.id)}`);

        if (resPdf.ok) {

          const dataPdf = await resPdf.json();

          if (dataPdf.status === 'success' && Array.isArray(dataPdf.files)) {

            setServerPdfQueueFiles(dataPdf.files);

          }

        }

      try {

      try {

        const resTxt = await fetch(`${BACKEND_URL}/api/list-txt-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(selectedNode.id)}`);

        if (resTxt.ok) {

          const dataTxt = await resTxt.json();

          if (dataTxt.status === 'success' && Array.isArray(dataTxt.files)) {

            setServerTxtQueueFiles(dataTxt.files);

          }

        }

      } catch (e) {}

        const resZip = await fetch(`${BACKEND_URL}/api/list-zip-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(selectedNode.id)}`);

        if (resZip.ok) {

          const dataZip = await resZip.json();

          if (dataZip.status === 'success' && Array.isArray(dataZip.files)) {

            setServerZipQueueFiles(dataZip.files);

          }

        }

      } catch (e) {}

      } catch (e) {}

      try {

        const resAgent = await fetch(`${BACKEND_URL}/api/list-agent-results?workflow_id=${encodeURIComponent(wfParam)}`);

        if (resAgent.ok) {

          const dataAgent = await resAgent.json();

          if (dataAgent.status === 'success' && Array.isArray(dataAgent.files)) {

            setServerAgentOutputsFiles(dataAgent.files);

          }

        }

      } catch (e) {}

    };

    fetchLists();

    const interval = setInterval(fetchLists, 3000);

    return () => clearInterval(interval);

  }, [selectedNode?.id]);



  const { handleDrillDownContainer } = useBigDataDrillDown({
    nodes,
    setNodes,
    setEdges,
    setSelectedProcessNodeIds,
    setIsSubflowModeActive,
  });



  // Time Pickers Hook
  const {
    calMonth,
    setCalMonth,
    calYear,
    setCalYear,
    selectedCalDate,
    setSelectedCalDate,
    selectedCalTime,
    setSelectedCalTime,
    isClockOpen,
    setIsClockOpen,
    clockTimeValue,
    setClockTimeValue,
    clockOnSaveCallback,
    setClockOnSaveCallback,
    clockPosition,
    openClockPicker,
    isDayPopoverOpen,
    setIsDayPopoverOpen,
    dayPopoverValue,
    setDayPopoverValue,
    dayPopoverOnSaveCallback,
    setDayPopoverOnSaveCallback,
    dayPopoverPosition,
    openDayPopover,
  } = useTimePickers();
  void setClockOnSaveCallback;
  void setDayPopoverOnSaveCallback;

  const [activeTab, setActiveTab] = useState<'logic' | 'process'>('process');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [showLogsTray, setShowLogsTray] = useState(true);
  const [activeLogTab, setActiveLogTab] = useState<'process' | 'system' | 'ai'>('process');

  const [showCreateWorkflowDialog, setShowCreateWorkflowDialog] = useState<boolean>(false);




  const [queueToClear, setQueueToClear] = useState<'pdf' | 'zip' | 'txt' | 'agent' | null>(null);


  const [newDialogWfName, setNewDialogWfName] = useState<string>('My AI Agent Workflow');

  const [newDialogWfDesc, setNewDialogWfDesc] = useState<string>('Automated AI pipeline and task execution flow');

  const [newDialogWfColor, setNewDialogWfColor] = useState<string>('blue');

  const {
    logs,
    setLogs,
    workflowLogsMap,
    setWorkflowLogsMap,
    systemLogs,
    aiLogs,
    saveLogToBackend,
    appendGlobalLog,
    fetchWorkflowLogs,
    clearWorkflowLogs,
    logUserAction,
  } = useWorkflowAuditLogs({
    selectedWorkflowId,
    currentRunId,
    activeTab,
    showLogsTray,
    activeLogTab,
    backendUrl: BACKEND_URL,
  });

  const {
    customAlert,
    setCustomAlert,
    showAlert,
    closeAlert,
  } = useSystemAlert();
  void closeAlert;
  void workflowLogsMap;

  const [agentNodes, setAgentNodes] = useNodesState([]);

  const [agentEdges, setAgentEdges] = useEdgesState([]);



  // (Removed dangerous useEffect that forcibly synchronized canvas selection on every node update)

  



  // Execution states

  const [isRunning, setIsRunning] = useState(false);

  const [finalPromptPreview, setFinalPromptPreview] = useState<string | null>(null);

  const [isFinalPromptModalOpen, setIsFinalPromptModalOpen] = useState(false);

  const [finalSendPayloadPreview, setFinalSendPayloadPreview] = useState<string | null>(null);

  const [isFinalSendModalOpen, setIsFinalSendModalOpen] = useState(false);



  const [isMiniSidebar, setIsMiniSidebar] = useState<boolean>(false);
  const [isUnifiedSettingsOpen, setIsUnifiedSettingsOpen] = useState<boolean>(false);
  const [unifiedSettingsTab, setUnifiedSettingsTab] = useState<'profile' | 'ai' | 'canvas'>('profile');



  const isRunningRef = useRef(isRunning);

  const eventSourceRef = useRef<EventSource | null>(null);
  const fetchWorkflowsRef = useRef<any>(null);
  const currentRunIdRef = useRef(currentRunId);

  const nodesRef = useRef(nodes);

  const edgesRef = useRef(edges);

  const agentNodesRef = useRef(agentNodes);

  const inFlightWakeUpNodesRef = useRef<Set<string>>(new Set());



  useEffect(() => {

    isRunningRef.current = isRunning;

  }, [isRunning]);



  useEffect(() => {

    currentRunIdRef.current = currentRunId;

  }, [currentRunId]);



  useEffect(() => {

    nodesRef.current = nodes;

  }, [nodes]);



  useEffect(() => {

    edgesRef.current = edges;

  }, [edges]);



  useEffect(() => {

    agentNodesRef.current = agentNodes;

  }, [agentNodes]);



  // Real-time polling for workflow & nodes execution progress

  useEffect(() => {

    let isSubscribed = true;



    const fetchProgress = async () => {

      try {

        // 1. Fetch workflow-wide progress map if a workflow is selected

        if (selectedWorkflowId) {

          const resWf = await fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(selectedWorkflowId)}/progress`);

          if (resWf.ok) {

            const dataWf = await resWf.json();

            if (dataWf.status === 'success' && dataWf.progressMap && isSubscribed) {

              setNodeLiveProgress(prev => ({

                ...prev,

                ...dataWf.progressMap

              }));



              // Sync progress into nodes state so Canvas Nodes show live progress bar

              setNodes((nds) => nds.map((n) => {

                const live = dataWf.progressMap[n.id];

                if (live && live.status === 'Active' && typeof live.percent === 'number') {

                  if (n.data.parameters?.progress !== live.percent || n.data.status !== 'running') {

                    return {

                      ...n,

                      data: {

                        ...n.data,

                        status: 'running',

                        parameters: {

                          ...(n.data.parameters || {}),

                          progress: live.percent,

                          stepMessage: live.stepMessage

                        }

                      }

                    };

                  }

                }

                return n;

              }));

            }

          }

        }



        // 2. Also fetch directly for selectedNode

        if (selectedNode) {

          const res = await fetch(`${BACKEND_URL}/api/nodes/${encodeURIComponent(selectedNode.id)}/progress`);

          if (res.ok) {

            const data = await res.json();

            if (data.status === 'success' && data.progress && isSubscribed) {

              setNodeLiveProgress(prev => ({

                ...prev,

                [selectedNode.id]: data.progress

              }));

            }

          }

        }

      } catch (e) {}

    };



    fetchProgress();

    const intervalTime = isRunning ? 800 : 2500;

    const interval = setInterval(fetchProgress, intervalTime);

    return () => {

      isSubscribed = false;

      clearInterval(interval);

    };

  }, [selectedNode?.id, selectedWorkflowId, isRunning]);



  // Sync selectedNode in real-time when workflow execution updates node properties (such as appending items to Queue Table, changing status or progress)

  useEffect(() => {

    if (!selectedNode) return;

    const liveNode = nodes.find(n => n.id === selectedNode.id) || agentNodes.find(n => n.id === selectedNode.id);

    if (liveNode && liveNode !== selectedNode) {

      setSelectedNode(liveNode);

    }

  }, [nodes, agentNodes, selectedNode]);



  // Scheduler Popup Dialog states

  const [showSchedulerPopup, setShowSchedulerPopup] = useState<boolean>(false);

  const [schedulerPopupRound] = useState<number>(0);

  const [schedulerPopupWorkflowName] = useState<string>('');



  // Workflow executions/processes list - initialized empty without residual mockups

  

  const handleRunRef = useRef<any>(null);



  // Helper to determine workflow pipeline step from node properties

  const getWorkflowStep = (nodeId: string | undefined, category: string | undefined): number => {

    if (!nodeId) return 1;

    const nid = nodeId.toLowerCase();

    const cat = category ? category.toLowerCase() : '';

    

    if (nid.includes('source') || nid.includes('api') || cat.includes('source')) {

      return 1; // Input

    }

    if (nid.includes('ocr') || nid.includes('parse') || nid.includes('page') || nid.includes('ingest')) {

      return 2; // Parse

    }

    if (nid.includes('model') || nid.includes('pm') || nid.includes('website') || nid.includes('crm') || nid.includes('analytics') || cat.includes('model')) {

      return 3; // Analyze

    }

    if (nid.includes('retrieve') || nid.includes('vector') || nid.includes('search') || nid.includes('query')) {

      return 4; // Retrieve

    }

    if (nid.includes('audit') || nid.includes('eval') || nid.includes('qa') || nid.includes('check') || cat.includes('agent')) {

      return 5; // Evaluate

    }

    if (nid.includes('notify') || nid.includes('gmail') || nid.includes('line') || nid.includes('mobile') || nid.includes('output') || nid.includes('deliverable')) {

      return 6; // Output

    }

    return 1;

  };



  const {
    processes,
    setProcesses,
    processToDelete,
    setProcessToDelete,
    handleStopProcess,
    handleDeleteProcess,
    handleInspectProcess,
    handlePlayProcess,
    fetchProcesses,
  } = useWorkflowProcesses({
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
    logUserAction,
    handleRunRef,
    getWorkflowStep,
    showAlert,
    setCurrentFileName,
    setCurrentRunId,
    setIsShowingSettings,
    fetchWorkflowLogs,
    setLogs,
    fetchWorkflows: (id) => fetchWorkflowsRef.current?.(id),
    backendUrl: BACKEND_URL,
  });

  const {
    groups,
    setGroups,
    workflowGroupMap,
    setWorkflowGroupMap,
    workflowColorMap,
    setWorkflowColorMap,
    currentGroupId,
    setCurrentGroupId,
    showCreateGroupModal,
    setShowCreateGroupModal,
    newGroupName,
    setNewGroupName,
    newGroupDesc,
    setNewGroupDesc,
    newGroupColor,
    setNewGroupColor,
    moveMenuState,
    setMoveMenuState,
    groupToDelete,
    setGroupToDelete,
    selectedWorkflowIds,
    setSelectedWorkflowIds,
    selectedGroupIds,
    setSelectedGroupIds,
    dragOverGroupId,
    setDragOverGroupId,
    dragOverCrumbId,
    setDragOverCrumbId,
    marqueeBox,
    setMarqueeBox,
    gridContainerRef,
    isGroupDescendant,
    getPathHierarchyLayers,
    handleContainerMouseDown,
    handleGroupSelectToggle,
    handleWorkflowCardClick,
    handleWorkflowDragStart,
    handleGroupDragStart,
    handleDropWorkflowsOnFolder,
    executeMoveItems,
    handleMoveToPreviousLayer,
    handleCreateGroup,
    handleBackGroup,
    handleDeleteGroup,
  } = useWorkflowGroups({
    workflows,
    processes,
    setProcesses,
    selectedWorkflowId,
    setSelectedWorkflowId,
    isRunning,
    currentRunId,
    handleStopProcess,
    setNodes,
    setEdges,
    setAgentNodes,
    setAgentEdges,
    setWorkflowName,
    setWorkflowDesc,
    backendUrl: BACKEND_URL,
  });

  void setGroups;
  void isGroupDescendant;
  void getPathHierarchyLayers;
  void setMarqueeBox;


  // Group menu hover and flyout state

  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const flyoutCloseTimerRef = useRef<any>(null);



  const handleGroupMouseEnter = (groupId: string) => {

    if (flyoutCloseTimerRef.current) {

      clearTimeout(flyoutCloseTimerRef.current);

      flyoutCloseTimerRef.current = null;

    }

    setHoveredGroup(groupId);

  };



  const handleGroupMouseLeave = () => {

    if (flyoutCloseTimerRef.current) {

      clearTimeout(flyoutCloseTimerRef.current);

    }

    flyoutCloseTimerRef.current = setTimeout(() => {

      setHoveredGroup(null);

    }, 150);

  };



  const handleFlyoutMouseEnter = () => {

    if (flyoutCloseTimerRef.current) {

      clearTimeout(flyoutCloseTimerRef.current);

      flyoutCloseTimerRef.current = null;

    }

  };



  const handleFlyoutMouseLeave = () => {

    if (flyoutCloseTimerRef.current) {

      clearTimeout(flyoutCloseTimerRef.current);

    }

    flyoutCloseTimerRef.current = setTimeout(() => {

      setHoveredGroup(null);

    }, 150);

  };





  // React Flow instance ref for coordinate projection

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [isLocked, setIsLocked] = useState<boolean>(false);

  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });



  useEffect(() => {

    const handleGlobalMouseMove = (e: MouseEvent) => {

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    };

    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);

  }, []);



  // Properties Inspector resizing state

  const [inspectorWidth, setInspectorWidth] = useState<number>(320);

  const [isResizingInspector, setIsResizingInspector] = useState<boolean>(false);



  useEffect(() => {

    if (!isResizingInspector) return;



    const handleMouseMove = (e: MouseEvent) => {

      const newWidth = window.innerWidth - e.clientX;

      const clampedWidth = Math.max(240, Math.min(600, newWidth));

      setInspectorWidth(clampedWidth);

    };



    const handleMouseUp = () => {

      setIsResizingInspector(false);

      document.body.style.cursor = '';

      document.body.style.userSelect = '';

    };



    document.body.style.cursor = 'col-resize';

    document.body.style.userSelect = 'none';



    window.addEventListener('mousemove', handleMouseMove);

    window.addEventListener('mouseup', handleMouseUp);



    return () => {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseup', handleMouseUp);

      document.body.style.cursor = '';

    };

  }, [isResizingInspector]);



  // Properties Inspector background drag-to-scroll state

  const inspectorContentRef = useRef<HTMLDivElement>(null);

  const [isDraggingInspectorScroll, setIsDraggingInspectorScroll] = useState<boolean>(false);

  const dragScrollStartYRef = useRef<number>(0);

  const dragScrollTopRef = useRef<number>(0);



  const handleInspectorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {

    // Only primary mouse button (left click)

    if (e.button !== 0) return;



    const target = e.target as HTMLElement;

    // Do not initiate drag-scroll on interactive form elements or controls

    if (target.closest('input, textarea, select, button, a, [role="button"], [role="slider"], .monaco-editor, .drag-handle-no-scroll')) {

      return;

    }



    const container = inspectorContentRef.current;

    if (!container) return;



    setIsDraggingInspectorScroll(true);

    dragScrollStartYRef.current = e.clientY;

    dragScrollTopRef.current = container.scrollTop;

  };



  useEffect(() => {

    if (!isDraggingInspectorScroll) return;



    const handleMouseMove = (e: MouseEvent) => {

      const container = inspectorContentRef.current;

      if (!container) return;



      const deltaY = e.clientY - dragScrollStartYRef.current;

      container.scrollTop = dragScrollTopRef.current - deltaY;

    };



    const handleMouseUp = () => {

      setIsDraggingInspectorScroll(false);

      document.body.style.cursor = '';

      document.body.style.userSelect = '';

    };



    document.body.style.cursor = 'grabbing';

    document.body.style.userSelect = 'none';



    window.addEventListener('mousemove', handleMouseMove);

    window.addEventListener('mouseup', handleMouseUp);



    return () => {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseup', handleMouseUp);

      document.body.style.cursor = '';

      document.body.style.userSelect = '';

    };

  }, [isDraggingInspectorScroll]);



  // Log Viewer Tray height states

  const [logsTrayHeight, setLogsTrayHeight] = useState<number>(240);

  const [isResizingLogsTray, setIsResizingLogsTray] = useState<boolean>(false);

  const [isLogsTrayFullScreen, setIsLogsTrayFullScreen] = useState<boolean>(false);



  useEffect(() => {

    if (!isResizingLogsTray) return;



    const handleMouseMove = (e: MouseEvent) => {

      if (reactFlowWrapper.current) {

        const rect = reactFlowWrapper.current.getBoundingClientRect();

        const newHeight = rect.bottom - e.clientY;

        const clampedHeight = Math.max(100, Math.min(rect.height - 80, newHeight));

        setLogsTrayHeight(clampedHeight);

      }

    };



    const handleMouseUp = () => {

      setIsResizingLogsTray(false);

      document.body.style.cursor = '';

      document.body.style.userSelect = '';

    };



    document.body.style.cursor = 'row-resize';

    document.body.style.userSelect = 'none';



    window.addEventListener('mousemove', handleMouseMove);

    window.addEventListener('mouseup', handleMouseUp);



    return () => {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseup', handleMouseUp);

      document.body.style.cursor = '';

      document.body.style.userSelect = '';

    };

  }, [isResizingLogsTray]);



  // Undo/Redo & Settings states

  const {
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
  } = useCanvasHistory({
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
    initialHistoryLimit: 50,
    logUserAction,
    selectedProcessNodeIds,
  });

  const defaultAiModels = [

    { id: 'gemini-3.1-flash-lite', provider: 'Google', modelName: 'gemini-3.1-flash-lite', apiKey: '', label: 'Gemini 3.1 Flash Lite (Working)', intelligenceMode: 'Fast / Low Latency' },

    { id: 'gemini-3.1-flash-lite-preview', provider: 'Google', modelName: 'gemini-3.1-flash-lite-preview', apiKey: '', label: 'Gemini 3.1 Flash Lite Preview', intelligenceMode: 'Fast / Low Latency' },

    { id: 'gemini-3-flash-preview', provider: 'Google', modelName: 'gemini-3-flash-preview', apiKey: '', label: 'Gemini 3 Flash Preview', intelligenceMode: 'Standard / Balanced' },

    { id: 'gemini-flash-lite-latest', provider: 'Google', modelName: 'gemini-flash-lite-latest', apiKey: '', label: 'Gemini Flash Lite Latest', intelligenceMode: 'Fast / Low Latency' },

    { id: 'gemini-2.0-flash', provider: 'Google', modelName: 'gemini-2.0-flash', apiKey: '', label: 'Gemini 2.0 Flash (Free)', intelligenceMode: 'Fast / Standard' },

    { id: 'gemini-2.0-flash-lite', provider: 'Google', modelName: 'gemini-2.0-flash-lite-preview-02-05', apiKey: '', label: 'Gemini 2.0 Flash Lite (Free)', intelligenceMode: 'Fast / Low Latency' },

    { id: 'gemini-3.1-pro', provider: 'Google', modelName: 'gemini-3.1-pro-high', apiKey: '', label: 'Gemini 3.1 Pro (High)', intelligenceMode: 'High Intelligence / Advanced Reasoning' },

    { id: 'gemini-2.5-flash', provider: 'Google', modelName: 'gemini-2.5-flash', apiKey: '', label: 'Gemini 2.5 Flash (Stable)', intelligenceMode: 'Standard / Balanced (Default)' },

    { id: 'gemini-1.5-pro', provider: 'Google', modelName: 'gemini-1.5-pro', apiKey: '', label: 'Gemini 1.5 Pro', intelligenceMode: 'Standard / Balanced (Default)' },

    { id: 'gemini-1.5-flash', provider: 'Google', modelName: 'gemini-1.5-flash', apiKey: '', label: 'Gemini 1.5 Flash', intelligenceMode: 'Fast / Low Latency' }

  ];

  const [aiModels, setAiModels] = useState<{ id: string; provider: string; endpoint?: string; modelName: string; apiKey: string; label?: string; intelligenceMode?: string; temperature?: number; maxTokens?: number; contextWindow?: number }[]>(() => {

    try {

      const saved = localStorage.getItem('global_ai_models');

      if (saved) {

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {

          const merged = [...parsed];

          defaultAiModels.forEach(defModel => {

            if (!merged.find(m => m.id === defModel.id)) {

              merged.push(defModel);

            }

          });

          return merged;

        }

      }

    } catch (e) {

      console.error("Failed to load global_ai_models", e);

    }

    return defaultAiModels;

  });



  useEffect(() => {

    localStorage.setItem('global_ai_models', JSON.stringify(aiModels));

  }, [aiModels]);



  // File management states

  const [currentFileHandle, setCurrentFileHandle] = useState<any>(null);

  const [lastSavedState, setLastSavedState] = useState<string>('');

  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {

    if (workflows.length > 0) {

      console.log('Available workflows in database:', workflows.length);

    }

    if (lastSavedState) {

      console.debug('Saved state tracking reference updated.');

    }

  }, [workflows, lastSavedState]);



  // Dragging and Editing start state refs






  // Helper to serialize current state for comparison and saving

  const serializeCurrentState = useCallback(() => {

    return JSON.stringify({

      name: workflowName,

      description: workflowDesc,

      historyLimit,

      nodes: nodes.map(n => ({

        id: n.id,

        type: n.type,

        position: n.position,

        data: n.data

      })),

      edges: edges.map(e => ({

        id: e.id,

        source: e.source,

        target: e.target,

        sourceHandle: e.sourceHandle,

        targetHandle: e.targetHandle,

        animated: e.animated

      })),

      agentNodes: agentNodes.map(n => ({

        id: n.id,

        type: n.type,

        parentNode: n.parentNode,

        extent: n.extent,

        position: n.position,

        style: n.style,

        data: n.data,

        draggable: n.draggable

      })),

      agentEdges: agentEdges.map(e => ({

        id: e.id,

        source: e.source,

        target: e.target,

        sourceHandle: e.sourceHandle,

        targetHandle: e.targetHandle,

        style: e.style,

        animated: e.animated

      })),

      aiModels

    });

  }, [workflowName, workflowDesc, historyLimit, nodes, edges, agentNodes, agentEdges, aiModels]);



  // SSE event source connection ref




  // 1. Fetch available workflows from backend


  const init_process_workflow = async () => {

    try {

      const res = await fetch(`${BACKEND_URL}/api/init-process`);

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

      console.error("Error calling /api/init-process:", e);

    }

  };



  const fetchWorkflows = async (activeWfId?: string) => {
    fetchWorkflowsRef.current = fetchWorkflows;

    try {

      const res = await fetch(`${BACKEND_URL}/api/workflows`);

      if (res.ok) {

        const data = await res.json();

        setWorkflows(data);



        // Fetch active states from backend for hydration

        let activeStates: Record<string, any> = {};

        try {

          const stateRes = await fetch(`${BACKEND_URL}/api/processes/active-state`);

          if (stateRes.ok) {

            activeStates = await stateRes.json();

          }

        } catch (stateErr) {

          console.error("Failed to fetch active states", stateErr);

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

                  agentEdges: wf.agentEdges || []

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

                  createdAt: existing.createdAt || wf.created_at || wf.createdAt || existing.startTime || new Date().toISOString(),

                  nodes: wf.nodes && wf.nodes.length > 0 ? wf.nodes : existing.nodes,

                  edges: wf.edges && wf.edges.length > 0 ? wf.edges : existing.edges,

                  agentNodes: wf.agentNodes && wf.agentNodes.length > 0 ? wf.agentNodes : existing.agentNodes,

                  agentEdges: wf.agentEdges && wf.agentEdges.length > 0 ? wf.agentEdges : existing.agentEdges

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

      console.error("Error fetching workflows", e);

    }

  };



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

      agentEdges: []

    });

    setLastSavedState(initialState);

  }, []);



  const loadWorkflowData = (wf: any) => {

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

      setAiModels(prev => {

        const newModels = [...prev];

        wf.aiModels.forEach((m: any) => {

          if (!newModels.find(nm => nm.id === m.id || nm.modelName === m.modelName)) {

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

  };







  const {
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
  } = useCanvasInteractions({
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
    setHoveredGroup,
    setIsShowingSettings,
    setIsShowingModels,
    logUserAction,
    backendUrl: BACKEND_URL,
  });

  const {
    isAutoSaving,
    handleManualSystemSave,
    handleSaveWorkflow,
    handleOpenWorkflow,
    handleFileInputChange,
  } = useWorkflowStorage({
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
    backendUrl: BACKEND_URL,
  });



  const handleNewWorkflowClear = () => {

    logUserAction(`New Workflow Request (Clear Workspace & Show Create Dialog)`, {}, { file: 'App.tsx', class: 'App', func: 'handleNewWorkflowClear', logType: 'process_action' });

    logUserAction(`Workflow Status Changed: Workspace cleared to Idle`, {}, { file: 'App.tsx', class: 'App', func: 'handleNewWorkflowClear', logType: 'status_change' });

    setSelectedWorkflowId(null);

    setWorkflowName('');

    setWorkflowDesc('');

    setNodes([]);

    setEdges([]);

    setAgentNodes([]);

    setAgentEdges([]);

    setSelectedNode(null);

    setLogs([]);

    setCurrentFileHandle(null);

    setCurrentFileName(null);

    setPast([]);

    setFuture([]);

    setShowCreateWorkflowDialog(true);

    setActiveTab('logic');

    

    const initialState = JSON.stringify({

      name: '',

      description: '',

      historyLimit: historyLimit,

      nodes: [],

      edges: [],

      agentNodes: [],

      agentEdges: []

    });

    setLastSavedState(initialState);

  };



  const handleNewWorkflowClick = () => {

    handleNewWorkflowClear();

  };
  const handleCreateWorkflowSubmit = useCallback(() => {
    const name = newDialogWfName.trim() || 'New AI Agent Workflow';
    const fname = name.replace(/\s+/g, '_') + '.wf';
    const newId = 'wf-' + Date.now();
    const chosenColor = newDialogWfColor;

    setWorkflowName(name);
    setWorkflowDesc(newDialogWfDesc.trim());
    setCurrentFileName(fname);
    setSelectedWorkflowId(newId);

    const defaultTimerNode = {
      id: `node_workflow_timer_${Date.now()}`,
      type: 'customNode',
      deletable: true,
      position: { x: 80, y: 150 },
      data: {
        name: 'Workflow Timer',
        label: 'Workflow Timer',
        category: 'Actions',
        isProtected: false,
        status: 'idle',
        parameters: {
          timerMode: 'interval',
          intervalValue: 2,
          intervalUnit: 'hours',
          startDate: '',
          startTime: '08:00',
          stopDate: '',
          stopTime: '17:00',
          schedulerActive: false,
          runMode: 'full'
        }
      }
    };

    setNodes([defaultTimerNode]);
    setEdges([]);
    setAgentNodes([]);
    setAgentEdges([]);

    fetch(`${BACKEND_URL}/api/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newId,
        name: name,
        description: newDialogWfDesc.trim(),
        color: chosenColor,
        nodes: [defaultTimerNode],
        edges: [],
        agentNodes: [],
        agentEdges: [],
        aiModels: aiModels
      })
    }).catch(e => console.error('Error auto-saving newly created workflow to DB/JSON:', e));

    setProcesses(prev => [
      {
        id: newId,
        workflowId: newId,
        name: name,
        description: newDialogWfDesc.trim(),
        color: chosenColor,
        startTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'idle',
        currentStep: 1,
        lastActiveNode: '',
        nodes: [defaultTimerNode],
        edges: [],
        agentNodes: [],
        agentEdges: []
      },
      ...prev.filter(p => p.id !== newId)
    ]);

    if (currentGroupId) {
      setWorkflowGroupMap(prevMap => {
        const nextMap = { ...prevMap, [newId]: currentGroupId };
        try {
          localStorage.setItem('app_workflow_group_map', JSON.stringify(nextMap));
        } catch (e) {}
        return nextMap;
      });
    }

    setWorkflowColorMap(prevMap => {
      const nextMap = { ...prevMap, [newId]: chosenColor };
      try {
        localStorage.setItem('app_workflow_color_map', JSON.stringify(nextMap));
      } catch (e) {}
      return nextMap;
    });

    logUserAction(`Created New Workflow via Dialog: ${name}`, { workflowName: name }, { file: 'App.tsx', class: 'LogicWorkspace', func: 'CreateWorkflowDialog', logType: 'process_action' });
    logUserAction(`Workflow Status Changed: Created and initialized in Idle state`, { workflowName: name }, { file: 'App.tsx', class: 'LogicWorkspace', func: 'CreateWorkflowDialog', logType: 'status_change' });
    setShowCreateWorkflowDialog(false);
  }, [newDialogWfName, newDialogWfDesc, newDialogWfColor, aiModels, currentGroupId, logUserAction]);





  const handleNewWorkflowConfirmYes = async () => {

    setShowSaveConfirmModal(false);

    await handleSaveWorkflow();

    handleNewWorkflowClear();

  };



  const handleNewWorkflowConfirmNo = () => {

    setShowSaveConfirmModal(false);

    handleNewWorkflowClear();

  };



  const {
    handleStartWorkFlowClick,
    handleStartSubWorkFlowClick,
  } = useWorkflowRunner({
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
    workflowDesc,
    aiModels,
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
    appendGlobalLog,
    saveLogToBackend,
    getWorkflowStep,
    fetchWorkflows,
    showAlert,
    logUserAction,
    isSubflowModeActive,
    setIsSubflowModeActive,
    selectedProcessNodeIds,
    setSelectedProcessNodeIds,
    handleStopProcess,
    setShowLogsTray,
    backendUrl: BACKEND_URL,
  });



  const { deleteSelectedElements } = useCanvasShortcuts({
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
    logUserAction,
    reactFlowInstance,
    lastMousePosRef,
    handleManualSystemSave,
    handleOpenWorkflow,
  });

  // Find if there is an active Timer node round count

  /*

  const activeTimerNode = nodes.find(n => {

    const name = n.data.name?.toLowerCase() || '';

    const label = n.data.label?.toLowerCase() || '';

    const type = n.type?.toLowerCase() || '';

    return name.includes('timer') || label.includes('timer') || type.includes('timer');

  });

  const currentTimerRound = activeTimerNode?.data?.parameters?.runCount || 0;

  */



  if (!isLoggedIn) {

    return <LoginScreen onLogin={(token, user) => {

      if (token) localStorage.setItem('app_auth_token', token);
      if (user) {
        localStorage.setItem('app_user', JSON.stringify(user));
        setCurrentUser(user);
      }

      setIsLoggedIn(true);

    }} />;

  }



  const isPropertiesInspectorOpen = activeTab !== 'process' && (() => {

    const selectedCount = nodes.filter(n => n.selected).length;

    // When dragging over >1 node, do NOT show Properties Inspector

    if (selectedCount > 1) return false;

    return Boolean(selectedNode) || selectedCount === 1;

  })();



  return (

    <div className="flex flex-col h-screen w-screen overflow-hidden bg-cyber-dark text-cyber-text font-sans">

      {/* Main Workspace Layout */}

      <div className="flex flex-1 relative overflow-hidden">

        

        <DashboardNavRail
          activeTab={activeTab}
          onNavigateHome={() => {
            setActiveTab('process');
            setIsShowingSettings(false);
            setIsShowingModels(false);
            fetchWorkflows();
            fetchProcesses();
          }}
          currentUser={currentUser}
          isUserManagementOpen={isUserManagementOpen}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          isUnifiedSettingsOpen={isUnifiedSettingsOpen}
          onOpenUnifiedSettings={() => setIsUnifiedSettingsOpen(true)}
          onLogout={handleLogout}
        />



        {/* Tools Menu Set (Visible ONLY when activeTab === 'logic' / page workflow) */}

        <CanvasNavRail
          activeTab={activeTab}
          isSubflowModeActive={isSubflowModeActive}
          isMiniSidebar={isMiniSidebar}
          onToggleMiniSidebar={() => setIsMiniSidebar(!isMiniSidebar)}
          nodes={nodes}
          selectedProcessNodeIds={selectedProcessNodeIds}
          onSelectAllNodes={() => {
            const allIds = nodes.map(n => n.id);
            setSelectedProcessNodeIds(allIds);
            setNodes(nds => nds.map(nd => ({ ...nd, selected: true })));
            setAgentNodes(nds => nds.map(nd => ({ ...nd, selected: true })));
          }}
          onDeselectAllNodes={() => {
            setSelectedProcessNodeIds([]);
            setNodes(nds => nds.map(nd => ({ ...nd, selected: false })));
            setAgentNodes(nds => nds.map(nd => ({ ...nd, selected: false })));
          }}
          onToggleNodeSelect={(nodeId, isChecked) => {
            const newIsChecked = !isChecked;
            setSelectedProcessNodeIds(prev =>
              newIsChecked ? [...new Set([...prev, nodeId])] : prev.filter(id => id !== nodeId)
            );
            setNodes(nds => nds.map(nd => nd.id === nodeId ? { ...nd, selected: newIsChecked } : nd));
            setAgentNodes(nds => nds.map(nd => nd.id === nodeId ? { ...nd, selected: newIsChecked } : nd));
          }}
          onReturnToDashboard={() => {
            setActiveTab('process');
            setIsShowingSettings(false);
            setIsShowingModels(false);
            fetchWorkflows();
            fetchProcesses();
          }}
          groupMenus={GROUP_MENUS}
          hoveredGroup={hoveredGroup}
          onGroupMouseEnter={handleGroupMouseEnter}
          onGroupMouseLeave={handleGroupMouseLeave}
          currentUser={currentUser}
          isUserManagementOpen={isUserManagementOpen}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          isUnifiedSettingsOpen={isUnifiedSettingsOpen}
          onOpenUnifiedSettings={() => setIsUnifiedSettingsOpen(true)}
          onLogout={handleLogout}
        />



        <SubMenuFlyout
          hoveredGroup={hoveredGroup}
          activeTab={activeTab}
          isSubflowModeActive={isSubflowModeActive}
          groupMenus={GROUP_MENUS}
          draggableTemplates={DRAGGABLE_TEMPLATES}
          onFlyoutMouseEnter={handleFlyoutMouseEnter}
          onFlyoutMouseLeave={handleFlyoutMouseLeave}
          onClose={() => setHoveredGroup(null)}
          onCreateNewNode={(category, name) => createNewNode(category, name)}
          onDragStart={(e, nodeType, category, name) => onDragStart(e, nodeType, category, name)}
          renderSidebarIcon={getSidebarIcon}
        />



        {/* Center Canvas Area with React Flow */}

        <div 

          className="flex-1 relative h-full flex flex-col" 

          ref={reactFlowWrapper}

          onMouseEnter={() => {

            if (flyoutCloseTimerRef.current) {

              clearTimeout(flyoutCloseTimerRef.current);

            }

            setHoveredGroup(null);

          }}

        >

          {activeTab === 'process' ? (
            <ProjectsDashboard
              currentGroupId={currentGroupId}
              setCurrentGroupId={setCurrentGroupId}
              groups={groups}
              processes={processes}
              selectedWorkflowIds={selectedWorkflowIds}
              setSelectedWorkflowIds={setSelectedWorkflowIds}
              selectedGroupIds={selectedGroupIds}
              setSelectedGroupIds={setSelectedGroupIds}
              workflowGroupMap={workflowGroupMap}
              workflowColorMap={workflowColorMap}
              marqueeBox={marqueeBox}
              dragOverCrumbId={dragOverCrumbId}
              setDragOverCrumbId={setDragOverCrumbId}
              dragOverGroupId={dragOverGroupId}
              setDragOverGroupId={setDragOverGroupId}
              gridContainerRef={gridContainerRef}
              handleBackGroup={handleBackGroup}
              handleContainerMouseDown={handleContainerMouseDown}
              handleDropWorkflowsOnFolder={handleDropWorkflowsOnFolder}
              handleGroupDragStart={handleGroupDragStart}
              handleGroupSelectToggle={handleGroupSelectToggle}
              handleInspectProcess={handleInspectProcess}
              handleMoveToPreviousLayer={handleMoveToPreviousLayer}
              handleNewWorkflowClick={handleNewWorkflowClick}
              handlePlayProcess={handlePlayProcess}
              handleStopProcess={handleStopProcess}
              handleWorkflowCardClick={handleWorkflowCardClick}
              handleWorkflowDragStart={handleWorkflowDragStart}
              setGroupToDelete={setGroupToDelete}
              setMoveMenuState={setMoveMenuState}
              setNewGroupDesc={setNewGroupDesc}
              setNewGroupName={setNewGroupName}
              setProcessToDelete={setProcessToDelete}
              setShowCreateGroupModal={setShowCreateGroupModal}
            />
          ) : (

            <CanvasFlowArea
              reactFlowWrapper={reactFlowWrapper}
              isAutoSaving={isAutoSaving}
              workflowName={workflowName}
              setWorkflowName={setWorkflowName}
              selectedWorkflowId={selectedWorkflowId}
              currentFileName={currentFileName}
              setCurrentFileName={setCurrentFileName}
              setProcesses={setProcesses}
              isRunning={isRunning}
              isPropertiesInspectorOpen={isPropertiesInspectorOpen}
              currentUser={currentUser}
              onOpenProfile={() => {
                setUnifiedSettingsTab('profile');
                setIsUnifiedSettingsOpen(true);
              }}
              onOpenUserManagement={() => setIsUserManagementOpen(true)}
              currentTime={currentTime}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              setReactFlowInstance={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              handleDrillDownContainer={handleDrillDownContainer}
              onPaneClick={onPaneClick}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              isLocked={isLocked}
              setIsLocked={setIsLocked}
              isSubflowModeActive={isSubflowModeActive}
              handleStartSubWorkFlowClick={handleStartSubWorkFlowClick}
              handleStartWorkFlowClick={handleStartWorkFlowClick}
              showLogsTray={showLogsTray}
              setShowLogsTray={setShowLogsTray}
            />

          )}



        <BottomLogViewerTray
          showLogsTray={showLogsTray}
          activeTab={activeTab}
          isLogsTrayFullScreen={isLogsTrayFullScreen}
          setIsLogsTrayFullScreen={setIsLogsTrayFullScreen}
          logsTrayHeight={logsTrayHeight}
          isResizingLogsTray={isResizingLogsTray}
          setIsResizingLogsTray={setIsResizingLogsTray}
          activeLogTab={activeLogTab}
          setActiveLogTab={setActiveLogTab}
          logs={logs}
          systemLogs={systemLogs}
          aiLogs={aiLogs}
          clearWorkflowLogs={clearWorkflowLogs}
          selectedWorkflowId={selectedWorkflowId}
          currentRunId={currentRunId}
          setShowLogsTray={setShowLogsTray}
        />

        </div>



        {/* Right Properties Panel Drawer */}

        {isPropertiesInspectorOpen && (

        <PropertiesInspector
          inspectorWidth={inspectorWidth}
          handleInspectorFocus={handleInspectorFocus}
          handleInspectorBlur={handleInspectorBlur}
          setIsResizingInspector={setIsResizingInspector}
          isResizingInspector={isResizingInspector}
          inspectorContentRef={inspectorContentRef}
          handleInspectorMouseDown={handleInspectorMouseDown}
          isDraggingInspectorScroll={isDraggingInspectorScroll}
          handleStartWorkFlowClick={handleStartWorkFlowClick}
          isWorkflowTimerNode={isWorkflowTimerNode}
          isProtectedTimerNode={isProtectedTimerNode}
          getNodeClass={getNodeClass}
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          updateSelectedNodeData={updateSelectedNodeData}
          updateSelectedNodeParameter={updateSelectedNodeParameter}
          selectedWorkflowId={selectedWorkflowId}
          workflowName={workflowName}
          setWorkflowName={setWorkflowName}
          workflowDesc={workflowDesc}
          setWorkflowDesc={setWorkflowDesc}
          setProcesses={setProcesses}
          openDialog={openDialog}
          showAlert={showAlert}
          aiModels={aiModels}
          agentNodes={agentNodes}
          isRunning={isRunning}
          calMonth={calMonth}
          setCalMonth={setCalMonth}
          calYear={calYear}
          setCalYear={setCalYear}
          selectedCalDate={selectedCalDate}
          setSelectedCalDate={setSelectedCalDate}
          selectedCalTime={selectedCalTime}
          setSelectedCalTime={setSelectedCalTime}
          openClockPicker={openClockPicker}
          openDayPopover={openDayPopover}
          pdfQueuePage={pdfQueuePage}
          setPdfQueuePage={setPdfQueuePage}
          txtQueuePage={txtQueuePage}
          setTxtQueuePage={setTxtQueuePage}
          zipQueuePage={zipQueuePage}
          setZipQueuePage={setZipQueuePage}
          serverPdfQueueFiles={serverPdfQueueFiles}
          setServerPdfQueueFiles={setServerPdfQueueFiles}
          serverTxtQueueFiles={serverTxtQueueFiles}
          setServerTxtQueueFiles={setServerTxtQueueFiles}
          serverZipQueueFiles={serverZipQueueFiles}
          setServerZipQueueFiles={setServerZipQueueFiles}
          agentOutputsPage={agentOutputsPage}
          setAgentOutputsPage={setAgentOutputsPage}
          serverAgentOutputsFiles={serverAgentOutputsFiles}
          setServerAgentOutputsFiles={setServerAgentOutputsFiles}
          nodeLiveProgress={nodeLiveProgress}
          setNodeLiveProgress={setNodeLiveProgress}
          setIsFinalPromptModalOpen={setIsFinalPromptModalOpen}
          setFinalPromptPreview={setFinalPromptPreview}
          generateFinalPromptAsync={generateFinalPromptAsync}
          setIsFinalSendModalOpen={setIsFinalSendModalOpen}
          setFinalSendPayloadPreview={setFinalSendPayloadPreview}
          generateFinalPayloadAsync={generateFinalPayloadAsync}
          handleDrillDownContainer={handleDrillDownContainer}
          deleteSelectedElements={deleteSelectedElements}
          updateSelectedNodeDataFields={updateSelectedNodeDataFields}
          setTableBuilderNodeId={setTableBuilderNodeId}
          setSampleBuilderNodeId={setSampleBuilderNodeId}
          setRubricBuilderNodeId={setRubricBuilderNodeId}
          setCurrentFileName={setCurrentFileName}
        />

        )}



      </div>

      {/* Hidden File Input for non-supported browsers */}

      <input

        type="file"

        ref={fileInputRef}

        accept=".wf"

        onChange={handleFileInputChange}

        className="hidden"

      />



      <TimePickerModals
        isClockOpen={isClockOpen}
        setIsClockOpen={setIsClockOpen}
        clockTimeValue={clockTimeValue}
        setClockTimeValue={setClockTimeValue}
        clockPosition={clockPosition}
        clockOnSaveCallback={clockOnSaveCallback}
        isDayPopoverOpen={isDayPopoverOpen}
        setIsDayPopoverOpen={setIsDayPopoverOpen}
        dayPopoverValue={dayPopoverValue}
        setDayPopoverValue={setDayPopoverValue}
        dayPopoverPosition={dayPopoverPosition}
        dayPopoverOnSaveCallback={dayPopoverOnSaveCallback}
      />

      <GlobalConfirmationModals
        showSaveConfirmModal={showSaveConfirmModal}
        handleNewWorkflowConfirmNo={handleNewWorkflowConfirmNo}
        handleNewWorkflowConfirmYes={handleNewWorkflowConfirmYes}
        showSchedulerPopup={showSchedulerPopup}
        setShowSchedulerPopup={setShowSchedulerPopup}
        schedulerPopupWorkflowName={schedulerPopupWorkflowName}
        schedulerPopupRound={schedulerPopupRound}
        customAlert={customAlert}
        setCustomAlert={setCustomAlert}
        queueToClear={queueToClear}
        setQueueToClear={setQueueToClear}
        selectedWorkflowId={selectedWorkflowId}
        selectedNode={selectedNode}
        updateSelectedNodeData={updateSelectedNodeData}
        setServerPdfQueueFiles={setServerPdfQueueFiles}
        setServerZipQueueFiles={setServerZipQueueFiles}
        setServerTxtQueueFiles={setServerTxtQueueFiles}
        showAlert={showAlert}
      />

      {/* Central Luxury Confirm Delete Process Dialog Box - Layer Top Most (fixed z-[99999]) */}

      <WorkflowManagementModals
        processToDelete={processToDelete}
        setProcessToDelete={setProcessToDelete}
        handleDeleteProcess={handleDeleteProcess}
        showCreateGroupModal={showCreateGroupModal}
        setShowCreateGroupModal={setShowCreateGroupModal}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        newGroupDesc={newGroupDesc}
        setNewGroupDesc={setNewGroupDesc}
        newGroupColor={newGroupColor}
        setNewGroupColor={setNewGroupColor}
        currentGroupId={currentGroupId}
        handleCreateGroup={handleCreateGroup}
        moveMenuState={moveMenuState}
        setMoveMenuState={setMoveMenuState}
        groups={groups}
        workflowGroupMap={workflowGroupMap}
        executeMoveItems={executeMoveItems}
        getPathHierarchyLayers={getPathHierarchyLayers}
        groupToDelete={groupToDelete}
        setGroupToDelete={setGroupToDelete}
        processes={processes}
        handleDeleteGroup={handleDeleteGroup}
        showCreateWorkflowDialog={showCreateWorkflowDialog}
        setShowCreateWorkflowDialog={setShowCreateWorkflowDialog}
        newDialogWfName={newDialogWfName}
        setNewDialogWfName={setNewDialogWfName}
        newDialogWfDesc={newDialogWfDesc}
        setNewDialogWfDesc={setNewDialogWfDesc}
        newDialogWfColor={newDialogWfColor}
        setNewDialogWfColor={setNewDialogWfColor}
        onCreateWorkflowSubmit={handleCreateWorkflowSubmit}
      />



      <FloatingDialogManager
        dialogs={dialogs}
        nodes={nodes}
        closeDialog={closeDialog}
        updateDialog={updateDialog}
        bringToFront={bringToFront}
        tableBuilderNodeId={tableBuilderNodeId}
        setTableBuilderNodeId={setTableBuilderNodeId}
        handleSaveTableData={(tableData: TableData) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === tableBuilderNodeId ? { ...n, data: { ...n.data, tableData } } : n
            )
          );
          setTableBuilderNodeId(null);
        }}
        sampleBuilderNodeId={sampleBuilderNodeId}
        setSampleBuilderNodeId={setSampleBuilderNodeId}
        handleSaveSampleData={(sampleData: SampleData) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === sampleBuilderNodeId ? { ...n, data: { ...n.data, sampleData } } : n
            )
          );
          setSampleBuilderNodeId(null);
        }}
        rubricBuilderNodeId={rubricBuilderNodeId}
        setRubricBuilderNodeId={setRubricBuilderNodeId}
        handleSaveRubricData={(rubricData) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === rubricBuilderNodeId ? { ...n, data: { ...n.data, rubricData } } : n
            )
          );
        }}
      />

      <JsonPreviewModal
        isOpen={isFinalPromptModalOpen}
        title="Final Prompt Preview"
        content={finalPromptPreview}
        accentColor="neon"
        onClose={() => setIsFinalPromptModalOpen(false)}
      />

      <JsonPreviewModal
        isOpen={isFinalSendModalOpen}
        title="Final Send Payload Preview"
        content={finalSendPayloadPreview}
        accentColor="purple"
        onClose={() => setIsFinalSendModalOpen(false)}
      />



      {/* User Management RBAC Modal */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUsername={currentUser?.username || ''}
        currentUserRole={currentUser?.role || ''}
      />

      {/* Unified Settings Modal (Profile, AI Models, Canvas Settings) */}

      <UnifiedSettingsModal

        isOpen={isUnifiedSettingsOpen}

        onClose={() => setIsUnifiedSettingsOpen(false)}

        activeTab={unifiedSettingsTab}

        onTabChange={(tab) => setUnifiedSettingsTab(tab)}

        username="user01"

        aiModels={aiModels}

        setAiModels={setAiModels}

        showAlert={showAlert}

        historyLimit={historyLimit}

        setHistoryLimit={setHistoryLimit}

        pastCount={past.length}

        futureCount={future.length}

        undo={undo}

        redo={redo}

        onClearHistory={() => {

          setPast([]);

          setFuture([]);

        }}

      />

    </div>

  );

}



export default function AppWrapped() {

  return (

    <ReactFlowProvider>

      <App />

    </ReactFlowProvider>

  );

}