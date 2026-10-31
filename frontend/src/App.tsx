import { canCreateWorkflow } from './utils/rbacPermissions';
import { useState, useEffect, useCallback, useRef } from 'react';

import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Node
} from 'reactflow';

import 'reactflow/dist/style.css';




import { getSidebarIcon } from './components/sidebars/sidebarIcons';
import nodeTypes from './nodes/nodeTypes';

import LoginScreen from './components/LoginScreen';

import CanvasFlowArea from './components/canvas/CanvasFlowArea';
import SettingsPage from './components/SettingsPage';
import PropertiesInspector from './components/inspector/PropertiesInspector';
import AppModalsContainer from './components/modals/AppModalsContainer';
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
import { useNavFlyout } from './hooks/useNavFlyout';
import { useInspectorLayout } from './hooks/useInspectorLayout';
import { useLogsTrayLayout } from './hooks/useLogsTrayLayout';
import { useAiModels } from './hooks/useAiModels';
import { useWorkflowLifecycle } from './hooks/useWorkflowLifecycle';
import { useServerQueueAndProgress } from './hooks/useServerQueueAndProgress';
import { useAppAuth } from './hooks/useAppAuth';
import {
  getNodeClass,
  isWorkflowTimerNode,
  isProtectedTimerNode,

} from './utils/nodeGraphUtils';
import BottomLogViewerTray from './components/canvas/BottomLogViewerTray';
import DashboardNavRail from './components/sidebars/DashboardNavRail';
import SubMenuFlyout from './components/sidebars/SubMenuFlyout';
import CanvasNavRail from './components/sidebars/CanvasNavRail';
import ProjectsDashboard from './components/dashboard/ProjectsDashboard';

import { useWorkflowState, useWorkflowExecution, useQueueManager } from './hooks';
void useWorkflowState; void useWorkflowExecution; void useQueueManager;



// Sidebar menus & themes
import {
  DRAGGABLE_TEMPLATES,
  GROUP_MENUS,
} from './constants/sidebarMenus';


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';



function App() {

  const {
    isLoggedIn,
    currentUser,
    isUserManagementOpen,
    setIsUserManagementOpen,
    handleLogout,
    handleLoginSuccess,
  } = useAppAuth();

  const [isShowingSettings, setIsShowingSettings] = useState<boolean>(false); void isShowingSettings;

  const [isShowingModels, setIsShowingModels] = useState<boolean>(false); void isShowingModels;

  const [currentFileName, setCurrentFileName] = useState<string | null>(null);





  const [rubricBuilderNodeId, setRubricBuilderNodeId] = useState<string | null>(null);

  const [sampleBuilderNodeId, setSampleBuilderNodeId] = useState<string | null>(null);

  const [tableBuilderNodeId, setTableBuilderNodeId] = useState<string | null>(null);

  const [workflows, setWorkflows] = useState<any[]>([]);

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

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






  const {
    pdfQueuePage,
    setPdfQueuePage,
    zipQueuePage,
    setZipQueuePage,
    agentOutputsPage,
    setAgentOutputsPage,
    serverPdfQueueFiles,
    setServerPdfQueueFiles,
    serverTxtQueueFiles,
    setServerTxtQueueFiles,
    txtQueuePage,
    setTxtQueuePage,
    serverZipQueueFiles,
    setServerZipQueueFiles,
    serverAgentOutputsFiles,
    setServerAgentOutputsFiles,
    nodeLiveProgress,
    setNodeLiveProgress,
  } = useServerQueueAndProgress({
    selectedNode,
    selectedWorkflowId,
    isRunning,
    setNodes,
    backendUrl: BACKEND_URL,
  });






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

  const [activeTab, setActiveTab] = useState<'logic' | 'process' | 'settings'>('process');
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

  const [finalPromptPreview, setFinalPromptPreview] = useState<string | null>(null);

  const [isFinalPromptModalOpen, setIsFinalPromptModalOpen] = useState(false);

  const [finalSendPayloadPreview, setFinalSendPayloadPreview] = useState<string | null>(null);

  const [isFinalSendModalOpen, setIsFinalSendModalOpen] = useState(false);



  const [isMiniSidebar, setIsMiniSidebar] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ai_builder_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleMiniSidebar = () => {
    setIsMiniSidebar(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ai_builder_sidebar_collapsed', String(next));
      } catch {
        // storage disabled
      }
      return next;
    });
  };
  const [isUnifiedSettingsOpen, setIsUnifiedSettingsOpen] = useState<boolean>(false);
  const [unifiedSettingsTab, setUnifiedSettingsTab] = useState<'profile' | 'ai' | 'canvas'>('profile');



  const eventSourceRef = useRef<EventSource | null>(null);
  const fetchWorkflowsRef = useRef<any>(null);
  const currentRunIdRef = useRef(currentRunId);

  const nodesRef = useRef(nodes);

  const edgesRef = useRef(edges);

  const agentNodesRef = useRef(agentNodes);

  const inFlightWakeUpNodesRef = useRef<Set<string>>(new Set());



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
  const {
    hoveredGroup,
    setHoveredGroup,
    flyoutCloseTimerRef,
    handleGroupMouseEnter,
    handleGroupMouseLeave,
    handleFlyoutMouseEnter,
    handleFlyoutMouseLeave,
  } = useNavFlyout();



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



  // Inspector & Logs Tray layout hooks
  const {
    inspectorWidth,
    setInspectorWidth,
    isResizingInspector,
    setIsResizingInspector,
    inspectorContentRef,
    isDraggingInspectorScroll,
    handleInspectorMouseDown,
  } = useInspectorLayout(320);
  void setInspectorWidth;

  const {
    logsTrayHeight,
    setLogsTrayHeight,
    isResizingLogsTray,
    setIsResizingLogsTray,
    isLogsTrayFullScreen,
    setIsLogsTrayFullScreen,
  } = useLogsTrayLayout({ reactFlowWrapper });
  void setLogsTrayHeight;



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

  const { aiModels, setAiModels } = useAiModels();



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






  const {
    serializeCurrentState,
    init_process_workflow,
    fetchWorkflows,
    loadWorkflowData,
  } = useWorkflowLifecycle({
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
    backendUrl: BACKEND_URL,
  });
  void init_process_workflow;
  void fetchWorkflows;
  void loadWorkflowData;



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
    if (!canCreateWorkflow(currentUser)) {
      showAlert(`Permission Denied: Your account role (${(currentUser?.role || 'viewer').toUpperCase()}) cannot create workflows.`, 'Access Denied', 'error');
      return;
    }
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
      }

      handleLoginSuccess(user);

    }} />;

  }



  const isPropertiesInspectorOpen = activeTab === 'logic' && (() => {

    const selectedCount = nodes.filter(n => n.selected).length;

    // When dragging over >1 node, do NOT show Properties Inspector

    if (selectedCount > 1) return false;

    return Boolean(selectedNode) || selectedCount === 1;

  })();



  return (

    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans">

      {/* Main Workspace Layout */}

      <div className="flex flex-1 relative overflow-hidden">

        

        <DashboardNavRail
          activeTab={activeTab}
          isMiniSidebar={isMiniSidebar}
          onToggleMiniSidebar={handleToggleMiniSidebar}
          onNavigateHome={() => {
            setActiveTab('process');
            setIsShowingSettings(false);
            setIsShowingModels(false);
            fetchWorkflows();
            fetchProcesses();
          }}
          onNavigateSettings={() => setActiveTab('settings')}
          currentUser={currentUser}
          isUserManagementOpen={isUserManagementOpen}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          isUnifiedSettingsOpen={activeTab === 'settings'}
          onOpenUnifiedSettings={() => setActiveTab('settings')}
          onLogout={handleLogout}
        />



        {/* Tools Menu Set (Visible ONLY when activeTab === 'logic' / page workflow) */}

        <CanvasNavRail
          activeTab={activeTab}
          isSubflowModeActive={isSubflowModeActive}
          isMiniSidebar={isMiniSidebar}
          onToggleMiniSidebar={handleToggleMiniSidebar}
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
          onNavigateSettings={() => setActiveTab('settings')}
          groupMenus={GROUP_MENUS}
          hoveredGroup={hoveredGroup}
          onGroupMouseEnter={handleGroupMouseEnter}
          onGroupMouseLeave={handleGroupMouseLeave}
          currentUser={currentUser}
          isUserManagementOpen={isUserManagementOpen}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          isUnifiedSettingsOpen={activeTab === 'settings'}
          onOpenUnifiedSettings={() => setActiveTab('settings')}
          onLogout={handleLogout}
        />



        <SubMenuFlyout
          hoveredGroup={hoveredGroup}
          activeTab={activeTab}
          isMiniSidebar={isMiniSidebar}
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
          ) : activeTab === 'settings' ? (
            <SettingsPage
              initialTab={unifiedSettingsTab}
              currentUser={currentUser}
              onNavigateHome={() => setActiveTab('process')}
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
                setActiveTab('settings');
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



      <AppModalsContainer
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
        dialogs={dialogs}
        nodes={nodes}
        setNodes={setNodes}
        closeDialog={closeDialog}
        updateDialog={updateDialog}
        bringToFront={bringToFront}
        tableBuilderNodeId={tableBuilderNodeId}
        setTableBuilderNodeId={setTableBuilderNodeId}
        sampleBuilderNodeId={sampleBuilderNodeId}
        setSampleBuilderNodeId={setSampleBuilderNodeId}
        rubricBuilderNodeId={rubricBuilderNodeId}
        setRubricBuilderNodeId={setRubricBuilderNodeId}
        isFinalPromptModalOpen={isFinalPromptModalOpen}
        setIsFinalPromptModalOpen={setIsFinalPromptModalOpen}
        finalPromptPreview={finalPromptPreview}
        isFinalSendModalOpen={isFinalSendModalOpen}
        setIsFinalSendModalOpen={setIsFinalSendModalOpen}
        finalSendPayloadPreview={finalSendPayloadPreview}
        isUserManagementOpen={isUserManagementOpen}
        setIsUserManagementOpen={setIsUserManagementOpen}
        currentUser={currentUser}
        isUnifiedSettingsOpen={isUnifiedSettingsOpen}
        setIsUnifiedSettingsOpen={setIsUnifiedSettingsOpen}
        unifiedSettingsTab={unifiedSettingsTab}
        setUnifiedSettingsTab={setUnifiedSettingsTab}
        aiModels={aiModels}
        setAiModels={setAiModels}
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