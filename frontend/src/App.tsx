import FloatingDialogManager from './components/dialogs/FloatingDialogManager';
import JsonPreviewModal from './components/dialogs/JsonPreviewModal';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import ReactFlow, {

  ReactFlowProvider,

  Background,

  useNodesState,

  useEdgesState,

  useStoreApi,

  addEdge,

  Controls,

  SelectionMode,

  type Edge,

  type Node

} from 'reactflow';

import 'reactflow/dist/style.css';




import {

  

  

  

  Database, 

  Cpu, 

  Bot, 

  Zap, 

  Terminal, 

 

  


  ChevronUp,



  Mail,

  MessageSquare,

  Globe,

  FileText,

  FileSearch,

  Layers,



  User,


  ShieldCheck,

  Lock,

  Unlock,

  Clock,



  Code,


  LayoutPanelTop,

  

  BarChart3,

  Grid3X3,

  Table,

  GitFork,

  HardDrive,

  FolderKanban,







  FileSpreadsheet,

  Sparkles

} from 'lucide-react';



import CustomNode from './components/CustomNode';

import ContainerNode from './components/ContainerNode';

import RubricNode from './nodes/RubricNode';

import SampleNode from './nodes/SampleNode';

import MCANode from './nodes/MCANode';

import TableNode from './nodes/TableNode';


import { type SampleData } from './components/SampleBuilder';

import { type TableData } from './components/TableBuilder';

import { type DialogState } from './FloatingDialog';

import PdfExtractorNode from './nodes/PdfExtractorNode';

import LoginScreen from './components/LoginScreen';

import UnifiedSettingsModal from './components/UnifiedSettingsModal';
import UserManagementModal from './components/UserManagementModal';
import CanvasHeader from './components/canvas/CanvasHeader';
import PropertiesInspector from './components/inspector/PropertiesInspector';
import TimePickerModals from './components/modals/TimePickerModals';
import GlobalConfirmationModals from './components/modals/GlobalConfirmationModals';
import { createNewNodeInstances } from './utils/nodeFactory';
import { generateFinalPrompt, generateFinalPayload } from './utils/promptPayloadGenerators';
import { useWorkflowStorage } from './hooks/useWorkflowStorage';
import { useWorkflowRunner } from './hooks/useWorkflowRunner';
import {
  getNodeClass,
  isWorkflowTimerNode,
  isRegularTimerNode,
  isProtectedTimerNode,

  sanitizeLoadedNodes,
  buildAgentNodesFromLogicNodes,
  buildAgentEdgesFromLogicEdges,
  getAgentEdgeStyle,
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



// Helper to get sidebar icons matching node designs

const getSidebarIcon = (category: string, name: string) => {

  const c = category.toLowerCase();

  const n = name.toLowerCase();



  if (c === 'ocr') {

    return <FileSearch className="w-4 h-4 text-orange-400" />;

  }



  if (c === 'sources' || c.includes('source') || c === 'notification') {

    if (n.includes('gmail')) return <Mail className="w-4 h-4 text-[#EA4335]" />;

    if (n.includes('line')) return <MessageSquare className="w-4 h-4 text-[#06C755]" />;

    if (n.includes('mobile') || n.includes('sms')) return <MessageSquare className="w-4 h-4 text-cyan-400" />;

    if (n.includes('supabase')) return <Database className="w-4 h-4 text-[#3ECF8E]" />;

    if (n.includes('storage')) return <HardDrive className="w-4 h-4 text-cyan-400" />;

    if (n.includes('graph')) return <GitFork className="w-4 h-4 text-indigo-400" />;

    if (n.includes('db') && !n.includes('vector')) return <Database className="w-4 h-4 text-blue-400" />;

    if (n.includes('vector')) return <Layers className="w-4 h-4 text-purple-400" />;

    return <Globe className="w-4 h-4 text-cyan-400" />;

  }



  if (c === 'datasets') {

    if (n.includes('polars') || n.includes('parquet')) return <Zap className="w-4 h-4 text-amber-400" />;

    if (n.includes('duckdb')) return <Database className="w-4 h-4 text-amber-400" />;

    return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;

  }



  if (c.includes('big data') || c.includes('analytics')) {

    if (n.includes('container') || n.includes('pipeline')) return <FolderKanban className="w-4 h-4 text-sky-400" />;

    return <BarChart3 className="w-4 h-4 text-sky-400" />;

  }



  if (c === 'dataset' || c.includes('dataset')) {

    if (n.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;

    if (n.includes('txt')) return <FileText className="w-4 h-4 text-yellow-400" />;

    if (n.includes('zip')) return <Layers className="w-4 h-4 text-emerald-400" />;

    return <Layers className="w-4 h-4 text-cyan-400" />;

  }

  

  if (c === 'actions' || c.includes('action')) {

    if (n.includes('timer')) return <Clock className="w-4 h-4 text-cyber-neon" />;

    if (n.includes('ocr')) return <FileSearch className="w-4 h-4 text-orange-400" />;

    if (n.includes('page')) return <FileText className="w-4 h-4 text-yellow-400" />;

    if (n.includes('db') || n.includes('database')) return <Database className="w-4 h-4 text-blue-400" />;

    if (n.includes('json')) return <Code className="w-4 h-4 text-pink-400" />;

    return <Zap className="w-4 h-4 text-orange-400" />;

  }



  if (c === 'models' || c.includes('model') || n.includes('model') || n.includes('llm')) {

    return <Cpu className="w-4 h-4 text-emerald-400" />;

  }



  if (c === 'agent' || c === 'agents' || c.includes('agent') || n.includes('agent') || n.includes('decision')) {

    if (n.includes('manager') || n.includes('pm')) return <User className="w-4 h-4 text-sky-400" />;

    if (n.includes('audit') || n.includes('qa')) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;

    if (n.includes('db') || n.includes('database')) return <Database className="w-4 h-4 text-blue-400" />;

    if (n.includes('planner')) return <Bot className="w-4 h-4 text-indigo-400" />;

    if (n.includes('sql') || n.includes('critic')) return <Code className="w-4 h-4 text-amber-400" />;

    if (n.includes('domain') || n.includes('specialist')) return <User className="w-4 h-4 text-fuchsia-400" />;

    if (n.includes('synthesizer')) return <Sparkles className="w-4 h-4 text-cyan-400" />;

    return <Bot className="w-4 h-4 text-purple-400" />;

  }



  if (c === 'criteria') {

    if (n.includes('rubric')) return <LayoutPanelTop className="w-4 h-4 text-cyber-neon" />;

    if (n.includes('mca') || n.includes('multi')) return <BarChart3 className="w-4 h-4 text-purple-400" />;

    if (n.includes('sample')) return <Grid3X3 className="w-4 h-4 text-[#38bdf8]" />;

      if (n.includes('table')) return <Table className="w-4 h-4 text-emerald-400" />;

  }



  return <Zap className="w-4 h-4 text-gray-400" />;

};



// Sidebar menus & themes
import {
  DRAGGABLE_TEMPLATES,
  GROUP_MENUS,
} from './constants/sidebarMenus';

// Default initial workflow templates
import {
  type LogMessage
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

  // Floating Dialogs State

  const [dialogs, setDialogs] = useState<DialogState[]>([]);

  const [dialogZIndexCounter, setDialogZIndexCounter] = useState(100);



  const openDialog = (type: 'agent_result' | 'pdf_queue' | 'json' | 'zip_queue' | 'txt_queue', filename: string, rawContent?: string) => {

    const title = filename.split('/').pop()?.split('?')[0] || filename;

    const wfParam = encodeURIComponent(selectedWorkflowId || 'wf_default');

          let url = '';

      if (type === 'agent_result') {

        url = `${BACKEND_URL}/api/agent-result/${encodeURIComponent(title)}?workflow_id=${wfParam}`;

      } else if (type === 'pdf_queue') {

        url = `${BACKEND_URL}/api/queue-pdf/${encodeURIComponent(title)}?workflow_id=${wfParam}`;

      } else if (type === 'txt_queue') {

        url = `${BACKEND_URL}/api/queue-txt/${encodeURIComponent(title)}?workflow_id=${wfParam}`;

      } else if (type === 'zip_queue') {

        url = `${BACKEND_URL}/api/queue-zip/${encodeURIComponent(title)}?workflow_id=${wfParam}`;

      } else if (filename.startsWith('http://') || filename.startsWith('https://')) {

        url = filename;

        if ((url.includes('/api/queue-pdf') || url.includes('/api/agent-result')) && !url.includes('workflow_id=')) {

          url += (url.includes('?') ? '&' : '?') + `workflow_id=${wfParam}`;

        }

      }



    const newZIndex = dialogZIndexCounter + 1;

    setDialogZIndexCounter(newZIndex);



    const newDialog: DialogState = {

      id: Date.now().toString() + Math.random().toString(),

      type,

      filename: title,

      title,

      url: type === 'json' ? undefined : url,

      content: type === 'json' ? rawContent : undefined,

      position: { x: window.innerWidth / 2 - 250 + (dialogs.length * 20), y: window.innerHeight / 2 - 200 + (dialogs.length * 20) },

      size: { w: (type === 'pdf_queue' || type === 'txt_queue') ? 600 : 500, h: (type === 'pdf_queue' || type === 'txt_queue') ? 800 : 400 },

      zIndex: newZIndex,

      fontSize: 14,

      textColor: '#00ffff',

      currentPage: 1,

      scale: 1.0,

    };



    setDialogs(prev => [...prev, newDialog]);

  };



  const closeDialog = (id: string) => {

    setDialogs(prev => prev.filter(d => d.id !== id));

  };



  const updateDialog = (id: string, partial: Partial<DialogState>) => {

    setDialogs(prev => prev.map(d => d.id === id ? { ...d, ...partial } : d));

  };



  const bringToFront = (id: string) => {

    const newZIndex = dialogZIndexCounter + 1;

    setDialogZIndexCounter(newZIndex);

    updateDialog(id, { zIndex: newZIndex });

  };



  const [timersState, setTimersState] = useState<Record<string, any>>({});



  const fetchTimersState = useCallback(async () => {

    try {

      const res = await fetch(`${BACKEND_URL}/api/workflows/timers/state`);

      if (res.ok) {

        const data = await res.json();

        setTimersState(data || {});

      }

    } catch (e) {

      console.error("Failed to fetch timers state:", e);

    }

  }, []);



  useEffect(() => {

    fetchTimersState();

    const interval = setInterval(fetchTimersState, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);

  }, [fetchTimersState]);



  const [workflowName, setWorkflowName] = useState('My AI Agent Workflow');

  const [workflowDesc, setWorkflowDesc] = useState('Automated TOR audit and risk evaluation flow');



  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);



  const store = useStoreApi();

  const previousSelectionActive = useRef(false);



  useEffect(() => {

    const unsubscribe = store.subscribe((state: any) => {

      const active = state.userSelectionActive;

      if (!active && previousSelectionActive.current) {

        const rect = state.userSelectionRect;

        if (rect) {

          const nodesState = state.getNodes();

          setEdges((eds) => {

            let hasChanges = false;

            const newEds = eds.map(e => {

              const sourceNode = nodesState.find((n: any) => n.id === e.source);

              const targetNode = nodesState.find((n: any) => n.id === e.target);

              if (sourceNode && targetNode) {

                const padding = 50;

                const minX = Math.min(sourceNode.position.x, targetNode.position.x) - padding;

                const maxX = Math.max(

                  sourceNode.position.x + (sourceNode.width || 0),

                  targetNode.position.x + (targetNode.width || 0)

                ) + padding;

                const minY = Math.min(sourceNode.position.y, targetNode.position.y) - padding;

                const maxY = Math.max(

                  sourceNode.position.y + (sourceNode.height || 0),

                  targetNode.position.y + (targetNode.height || 0)

                ) + padding;



                const intersects = !(

                  rect.x > maxX ||

                  rect.x + rect.width < minX ||

                  rect.y > maxY ||

                  rect.y + rect.height < minY

                );



                if (intersects && !e.selected) {

                  hasChanges = true;

                  return { ...e, selected: true };

                }

              }

              return e;

            });

            return hasChanges ? newEds : eds;

          });

        }

      }

      previousSelectionActive.current = active;

    });

    return unsubscribe;

  }, [store, setEdges]);





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



  useEffect(() => {

    if (!selectedWorkflowId) return;

    setNodes((nds) => nds.map((n) => {

      const isTimer = n.data.name?.toLowerCase().includes('timer') || n.data.label?.toLowerCase().includes('timer');

      if (isTimer) {

        const lastRunKey = `${selectedWorkflowId}_${n.id}_last_interval_run`;

        const lastRun = timersState[lastRunKey];

        if (lastRun && n.data.parameters?.lastRun !== lastRun) {

          return {

            ...n,

            data: {

              ...n.data,

              parameters: {

                ...n.data.parameters,

                lastRun

              }

            }

          };

        }

      }

      return n;

    }));

  }, [timersState, selectedWorkflowId, setNodes]);



  const selectedCls = selectedNode ? getNodeClass(selectedNode).replace(/_/g, ' ') : '';

  const isSelectedDbNode = selectedNode ? (

    ((selectedCls.toLowerCase().includes('db') || selectedCls.toLowerCase().includes('database')) && 

     !selectedCls.toLowerCase().includes('agent') && 

     !selectedCls.toLowerCase().includes('duckdb')) ||

    selectedCls.toLowerCase().includes('supabase')

  ) : false;

  const isSelectedGraphRagNode = selectedCls === 'Graph RAG' || selectedCls.toLowerCase().includes('graph rag');

  const isSelectedApiConnectorNode = selectedCls === 'API Connector';

  const isSelectedApiIncrementalNode = selectedCls === 'API Incremental';

  const isSelectedJsonConnectorNode = selectedCls === 'JSON Connector';

  const isSelectedJsonConnectorListNode = selectedCls === 'JSON Connector List';

  const isSelectedPageNode = selectedCls === 'Page';

  const isSelectedStorageNode = selectedCls === 'Storage';

  const isSelectedWorkflowTimerNode = selectedNode ? isWorkflowTimerNode(selectedNode) : false;

  const isSelectedRegularTimerNode = selectedNode ? isRegularTimerNode(selectedNode) : false;

  const isSelectedTimerNode = isSelectedWorkflowTimerNode || isSelectedRegularTimerNode;

  const isSelectedPdfsLoaderNode = selectedCls === 'Pdfs Loader';

  const isSelectedPdfQueueNode = selectedCls === 'PDF Queue';

  const isSelectedTxtQueueNode = selectedCls === 'TXT Queue';

  const isSelectedZipQueueNode = selectedCls === 'Zip Queue';

  const isSelectedPdfExtractorNode = selectedCls === 'PDF Extractor';

  const isSelectedExtractNode = selectedCls === 'Extract';

  const isSelectedDeDuplicateNode = selectedCls === 'De-duplicate Text';

  const isSelectedStructuredParseNode = selectedCls === 'Structured Parse JSON';

  const isSelectedStateNode = selectedCls === 'State';

  const isSelectedOcrPdfsNode = selectedCls === 'OCR PDFs';

  const isSelectedMarkItDownNode = selectedCls === 'Mark It Down' || selectedCls.toLowerCase().includes('markitdown');



  // Big Data & Analytics Inspector Selectors

  const isSelectedPolarsConverterNode = selectedNode ? (

    selectedCls === 'Polars Parquet Converter' ||

    selectedCls === 'Polars_Parquet_Converter' ||

    selectedCls.toLowerCase().includes('polars') ||

    selectedCls.toLowerCase().includes('parquet converter')

  ) : false;

  const isSelectedDuckDbNode = selectedNode ? (

    selectedCls === 'DuckDB Virtual Lake' ||

    selectedCls === 'DuckDB_Virtual_Lake' ||

    selectedCls.toLowerCase().includes('duckdb')

  ) : false;

  const isSelectedBigDataAnalystNode = selectedNode ? (

    selectedCls === 'Autonomous Big Data Analyst' ||

    selectedCls === 'Autonomous_Big_Data_Analyst' ||

    selectedCls.toLowerCase().includes('big data analyst') ||

    selectedCls.toLowerCase().includes('big_data_analyst')

  ) : false;

  const isSelectedBigDataContainerNode = selectedNode ? (

    selectedCls === 'Multi-Agent Pipeline Container' ||

    selectedCls === 'Multi-Agent_Pipeline_Container' ||

    selectedCls.toLowerCase().includes('pipeline container')

  ) : false;





  // Custom calendar picker states

  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);

  const [selectedCalTime, setSelectedCalTime] = useState("09:00");




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



  const handleDrillDownContainer = useCallback((containerNode: Node) => {

    const nodeParams = containerNode.data?.parameters || {};

    const team = Array.isArray(nodeParams.team) ? nodeParams.team : [

      { id: 'agent_1', name: 'Planner Agent', role: 'Decomposes objective into analytical steps', model: 'gemini-2.5-flash', persona: 'Chief Data Strategist' },

      { id: 'agent_2', name: 'SQL Engineer & Critic', role: 'Generates & validates DuckDB queries', model: 'gemini-2.5-flash', persona: 'DuckDB Senior Engineer & Critic' },

      { id: 'agent_3', name: 'Domain Specialist', role: 'Analyzes anomalies and trends', model: 'gemini-2.5-flash', persona: 'Senior Business Intelligence Specialist' },

      { id: 'agent_4', name: 'Executive Synthesizer', role: 'Synthesizes executive summary & recommendations', model: 'gemini-2.5-flash', persona: 'Executive Insights Director' }

    ];



    const baseX = containerNode.position.x;

    const baseY = containerNode.position.y;

    const childPrefix = `${containerNode.id}_sub_`;

    const existingChildren = nodes.filter(n => n.id.startsWith(childPrefix));



    if (existingChildren.length > 0) {

      setSelectedProcessNodeIds(existingChildren.map(n => n.id));

      setIsSubflowModeActive(true);

      return;

    }



    const converterId = `${childPrefix}polars`;

    const polarsNode: Node = {

      id: converterId,

      type: 'customNode',

      position: { x: baseX, y: baseY + 180 },

      data: {

        label: 'Polars Parquet Converter',

        category: 'Datasets',

        name: 'Polars Parquet Converter',

        nodeClass: 'Polars_Parquet_Converter',

        originalName: 'Polars Parquet Converter',

        nodeType: 'Polars Parquet Converter',

        parameters: {

          sourceType: 'upload',

          filePattern: '*.xlsx, *.csv',

          sheetName: 'Sheet1',

          compression: 'snappy',

          autoTypeInference: true,

          outputParquetPath: './workflow_inputs/parquet_cache'

        }

      }

    };



    const duckdbId = `${childPrefix}duckdb`;

    const duckdbNode: Node = {

      id: duckdbId,

      type: 'customNode',

      position: { x: baseX + 320, y: baseY + 180 },

      data: {

        label: 'DuckDB Virtual Lake',

        category: 'Datasets',

        name: 'DuckDB Virtual Lake',

        nodeClass: 'DuckDB_Virtual_Lake',

        originalName: 'DuckDB Virtual Lake',

        nodeType: 'DuckDB Virtual Lake',

        parameters: {

          executionMode: 'agent_driven',

          sqlQuery: "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10",

          statementTimeout: '10s'

        }

      }

    };



    const agentNodesList: Node[] = [];

    const agentEdgesList: Edge[] = [];



    team.forEach((agent: any, index: number) => {

      const aId = `${childPrefix}agent_${index + 1}`;

      agentNodesList.push({

        id: aId,

        type: 'customNode',

        position: { x: baseX + 640 + (index * 280), y: baseY + 180 },

        data: {

          label: agent.name || `Specialist ${index + 1}`,

          category: 'Agents',

          name: agent.name || `Specialist ${index + 1}`,

          nodeClass: 'Agent',

          originalName: 'Agent',

          nodeType: 'Agent',

          role: agent.persona || agent.role || 'Data Specialist',

          prompt: agent.role || 'Analyze data from DuckDB',

          parameters: {

            modelName: agent.model || 'gemini-2.5-flash',

            temperature: 0.0

          }

        }

      });



      if (index === 0) {

        agentEdgesList.push({

          id: `edge_${duckdbId}_${aId}`,

          source: duckdbId,

          target: aId,

          animated: true,

          style: { stroke: '#38bdf8', strokeWidth: 2 }

        });

      } else {

        const prevId = `${childPrefix}agent_${index}`;

        agentEdgesList.push({

          id: `edge_${prevId}_${aId}`,

          source: prevId,

          target: aId,

          animated: true,

          style: { stroke: '#a855f7', strokeWidth: 2 }

        });

      }

    });



    const edgeConverterToDuck: Edge = {

      id: `edge_${converterId}_${duckdbId}`,

      source: converterId,

      target: duckdbId,

      animated: true,

      style: { stroke: '#10b981', strokeWidth: 2 }

    };



    const allNewNodes = [polarsNode, duckdbNode, ...agentNodesList];

    const allNewEdges = [edgeConverterToDuck, ...agentEdgesList];



    setNodes(prev => [...prev, ...allNewNodes]);

    setEdges(prev => [...prev, ...allNewEdges]);

    setSelectedProcessNodeIds(allNewNodes.map(n => n.id));

    setIsSubflowModeActive(true);

  }, [nodes]);



  // Clock Picker Modal State

  const [isClockOpen, setIsClockOpen] = useState(false);

  const [clockTimeValue, setClockTimeValue] = useState("09:00");

  const [clockOnSaveCallback, setClockOnSaveCallback] = useState<((time: string) => void) | null>(null);


  const [clockPosition, setClockPosition] = useState<{ top: number, left: number } | null>(null);



  const openClockPicker = (event: React.MouseEvent, initTime: string, onSave: (time: string) => void) => {

    const rect = event.currentTarget.getBoundingClientRect();

    let top = rect.bottom + 8;

    let left = rect.left - 160 + rect.width / 2; // Center horizontally

    

    // Boundary checks

    if (left < 10) left = 10;

    if (left + 320 > window.innerWidth) left = window.innerWidth - 330;

    if (top + 400 > window.innerHeight) {

      top = rect.top - 410; // Position above if overflowing bottom

    }

    if (top < 10) top = 10;



    setClockPosition({ top, left });

    setClockTimeValue(initTime || "09:00");

    setClockOnSaveCallback(() => onSave);


    setIsClockOpen(true);

  };



  // Day of Month Popover State

  const [isDayPopoverOpen, setIsDayPopoverOpen] = useState(false);

  const [dayPopoverValue, setDayPopoverValue] = useState(1);

  const [dayPopoverOnSaveCallback, setDayPopoverOnSaveCallback] = useState<((day: number) => void) | null>(null);

  const [dayPopoverPosition, setDayPopoverPosition] = useState<{ top: number; left: number } | null>(null);



  const openDayPopover = (event: React.MouseEvent, initDay: number, onSave: (day: number) => void) => {

    const rect = event.currentTarget.getBoundingClientRect();

    let top = rect.bottom + 8;

    let left = rect.left - 100 + rect.width / 2; // Center horizontally

    

    // Boundary checks

    if (left < 10) left = 10;

    if (left + 220 > window.innerWidth) left = window.innerWidth - 230;

    if (top + 280 > window.innerHeight) {

      top = rect.top - 290; // Position above if overflowing bottom

    }

    if (top < 10) top = 10;



    setDayPopoverPosition({ top, left });

    setDayPopoverValue(initDay || 1);

    setDayPopoverOnSaveCallback(() => onSave);

    setIsDayPopoverOpen(true);

  };



  const [activeTab, setActiveTab] = useState<'logic' | 'process'>('process');

  const [showCreateWorkflowDialog, setShowCreateWorkflowDialog] = useState<boolean>(false);

  const [processToDelete, setProcessToDelete] = useState<any | null>(null);



  // Workflow Groups & Hierarchy States

  const [groups, setGroups] = useState<Array<{

    id: string;

    name: string;

    description?: string;

    parentId: string | null;

    color?: string;

    createdAt: string;

  }>>(() => {

    try {

      const saved = localStorage.getItem('app_workflow_groups');

      return saved ? JSON.parse(saved) : [];

    } catch (e) {

      return [];

    }

  });



  const [workflowGroupMap, setWorkflowGroupMap] = useState<Record<string, string>>(() => {

    try {

      const saved = localStorage.getItem('app_workflow_group_map');

      return saved ? JSON.parse(saved) : {};

    } catch (e) {

      return {};

    }

  });



  const [workflowColorMap, setWorkflowColorMap] = useState<Record<string, string>>(() => {

    try {

      const saved = localStorage.getItem('app_workflow_color_map');

      return saved ? JSON.parse(saved) : {};

    } catch (e) {

      return {};

    }

  });



  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);

  const [newGroupName, setNewGroupName] = useState<string>('');

  const [newGroupDesc, setNewGroupDesc] = useState<string>('');

  const [newGroupColor, setNewGroupColor] = useState<string>('blue');

  const [moveMenuState, setMoveMenuState] = useState<{

    workflowIds: string[];

    groupIds: string[];

    anchorRect: { top: number; bottom: number; left: number; right: number };

  } | null>(null);

  const [groupToDelete, setGroupToDelete] = useState<any | null>(null);

  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<string[]>([]);

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  const [dragOverCrumbId, setDragOverCrumbId] = useState<string | null | 'root'>(null);

  const [marqueeBox, setMarqueeBox] = useState<{

    startX: number;

    startY: number;

    currentX: number;

    currentY: number;

    isSelecting: boolean;

  } | null>(null);



  const lastSelectedWfIndexRef = useRef<number | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  const initialSelectedWfsRef = useRef<string[]>([]);

  const initialSelectedGrpsRef = useRef<string[]>([]);



  // Check if targetId is a descendant of parentId in groups tree

  const isGroupDescendant = (parentId: string, targetId: string, allGroups: Array<{ id: string; parentId: string | null }>): boolean => {

    let cur = allGroups.find(g => g.id === targetId);

    while (cur) {

      if (cur.parentId === parentId) return true;

      cur = allGroups.find(g => g.id === cur?.parentId);

    }

    return false;

  };



  // Build preceding hierarchy layers starting from closest layer to current folder down to farthest (Root)

  const getPathHierarchyLayers = (currentId: string | null, allGroups: Array<{ id: string; name: string; parentId: string | null }>) => {

    if (!currentId) return [];



    const layers: Array<{ id: string | null; name: string; isRoot: boolean }> = [];

    let curr = allGroups.find(g => g.id === currentId);

    while (curr && curr.parentId) {

      const parent = allGroups.find(g => g.id === curr?.parentId);

      if (parent) {

        layers.push({ id: parent.id, name: parent.name, isRoot: false });

        curr = parent;

      } else {

        break;

      }

    }

    // Farthest layer (Root) at the bottom

    layers.push({ id: null, name: 'Projects', isRoot: true });



    return layers;

  };



  // Window mouse listener for marquee rubberband selection

  useEffect(() => {

    if (!marqueeBox?.isSelecting) return;



    const handleMouseMove = (e: MouseEvent) => {

      setMarqueeBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);



      const boxLeft = Math.min(marqueeBox.startX, e.clientX);

      const boxTop = Math.min(marqueeBox.startY, e.clientY);

      const boxRight = Math.max(marqueeBox.startX, e.clientX);

      const boxBottom = Math.max(marqueeBox.startY, e.clientY);



      if (boxRight - boxLeft > 5 || boxBottom - boxTop > 5) {

        const hitWfs: string[] = [];

        const hitGrps: string[] = [];



        const cards = gridContainerRef.current?.querySelectorAll('[data-card-item="true"]');

        cards?.forEach(card => {

          const rect = card.getBoundingClientRect();

          const isIntersecting = !(

            rect.left > boxRight ||

            rect.right < boxLeft ||

            rect.top > boxBottom ||

            rect.bottom < boxTop

          );



          if (isIntersecting) {

            const wfId = card.getAttribute('data-wf-id');

            const grpId = card.getAttribute('data-grp-id');

            if (wfId) hitWfs.push(wfId);

            if (grpId) hitGrps.push(grpId);

          }

        });



        const mergedWfs = Array.from(new Set([...initialSelectedWfsRef.current, ...hitWfs]));

        const mergedGrps = Array.from(new Set([...initialSelectedGrpsRef.current, ...hitGrps]));

        setSelectedWorkflowIds(mergedWfs);

        setSelectedGroupIds(mergedGrps);

      }

    };



    const handleMouseUp = () => {

      setMarqueeBox(null);

    };



    window.addEventListener('mousemove', handleMouseMove);

    window.addEventListener('mouseup', handleMouseUp);

    return () => {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseup', handleMouseUp);

    };

  }, [marqueeBox?.isSelecting]);



  const handleContainerMouseDown = (e: React.MouseEvent) => {

    if (e.button !== 0) return;

    const target = e.target as HTMLElement;

    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('select')) {

      return;

    }

    if (target.closest('[data-card-item="true"]')) {

      return;

    }



    if (e.ctrlKey || e.metaKey) {

      initialSelectedWfsRef.current = selectedWorkflowIds;

      initialSelectedGrpsRef.current = selectedGroupIds;

    } else {

      initialSelectedWfsRef.current = [];

      initialSelectedGrpsRef.current = [];

      setSelectedWorkflowIds([]);

      setSelectedGroupIds([]);

    }



    setMarqueeBox({

      startX: e.clientX,

      startY: e.clientY,

      currentX: e.clientX,

      currentY: e.clientY,

      isSelecting: true,

    });

  };



  const handleGroupSelectToggle = (_e: React.MouseEvent, grpId: string) => {

    setSelectedGroupIds(prev => {

      if (prev.includes(grpId)) return prev.filter(id => id !== grpId);

      return [...prev, grpId];

    });

  };



  const handleWorkflowCardClick = (e: React.MouseEvent, wfId: string, index: number, allWfs: any[]) => {

    if (e.ctrlKey || e.metaKey) {

      setSelectedWorkflowIds(prev => {

        if (prev.includes(wfId)) {

          return prev.filter(id => id !== wfId);

        } else {

          return [...prev, wfId];

        }

      });

      lastSelectedWfIndexRef.current = index;

    } else if (e.shiftKey) {

      const lastIndex = lastSelectedWfIndexRef.current ?? 0;

      const start = Math.min(lastIndex, index);

      const end = Math.max(lastIndex, index);

      const rangeIds = allWfs.slice(start, end + 1).map(p => p.workflowId || p.id);

      setSelectedWorkflowIds(prev => {

        const merged = new Set([...prev, ...rangeIds]);

        return Array.from(merged);

      });

    } else {

      setSelectedWorkflowIds(prev => (prev.length === 1 && prev[0] === wfId ? [] : [wfId]));

      lastSelectedWfIndexRef.current = index;

    }

  };



  const handleWorkflowDragStart = (e: React.DragEvent, wfId: string) => {

    let idsToMove = selectedWorkflowIds;

    if (!selectedWorkflowIds.includes(wfId)) {

      idsToMove = [wfId];

      setSelectedWorkflowIds([wfId]);

    }

    const payload = {

      workflowIds: idsToMove,

      groupIds: selectedGroupIds,

    };

    e.dataTransfer.setData('application/json', JSON.stringify(payload));

    e.dataTransfer.setData('text/plain', JSON.stringify(payload));

    e.dataTransfer.effectAllowed = 'move';

  };



  const handleGroupDragStart = (e: React.DragEvent, grpId: string) => {

    let grpsToMove = selectedGroupIds;

    if (!selectedGroupIds.includes(grpId)) {

      grpsToMove = [grpId];

      setSelectedGroupIds([grpId]);

    }

    const payload = {

      workflowIds: selectedWorkflowIds,

      groupIds: grpsToMove,

    };

    e.dataTransfer.setData('application/json', JSON.stringify(payload));

    e.dataTransfer.setData('text/plain', JSON.stringify(payload));

    e.dataTransfer.effectAllowed = 'move';

  };



  const handleDropWorkflowsOnFolder = (targetGroupId: string | null, e: React.DragEvent) => {

    e.preventDefault();

    setDragOverGroupId(null);

    setDragOverCrumbId(null);



    let payload: { workflowIds?: string[]; groupIds?: string[] } = {};

    try {

      const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');

      if (raw) {

        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {

          payload = { workflowIds: parsed, groupIds: [] };

        } else {

          payload = parsed;

        }

      }

    } catch (err) {}



    const wfsToMove = payload.workflowIds?.length ? payload.workflowIds : selectedWorkflowIds;

    const grpsToMove = payload.groupIds?.length ? payload.groupIds : selectedGroupIds;



    // 1. Move Workflows

    if (wfsToMove.length > 0) {

      setWorkflowGroupMap(prev => {

        const next = { ...prev };

        wfsToMove.forEach(rawId => {

          const proc = processes.find(p => p.id === rawId || p.workflowId === rawId);

          const wfKey = proc ? (proc.workflowId || proc.id) : rawId;

          if (targetGroupId === null) {

            delete next[wfKey];

            if (proc?.id) delete next[proc.id];

            if (proc?.workflowId) delete next[proc.workflowId];

          } else {

            next[wfKey] = targetGroupId;

            if (proc?.id) next[proc.id] = targetGroupId;

            if (proc?.workflowId) next[proc.workflowId] = targetGroupId;

          }

        });

        try {

          localStorage.setItem('app_workflow_group_map', JSON.stringify(next));

        } catch (err) {}

        return next;

      });

    }



    // 2. Move Groups / Folders

    if (grpsToMove.length > 0) {

      setGroups(prev => {

        const updated = prev.map(g => {

          if (grpsToMove.includes(g.id)) {

            if (targetGroupId === g.id) return g;

            if (targetGroupId && isGroupDescendant(g.id, targetGroupId, prev)) return g;

            return { ...g, parentId: targetGroupId };

          }

          return g;

        });

        try {

          localStorage.setItem('app_workflow_groups', JSON.stringify(updated));

        } catch (err) {}

        return updated;

      });

    }



    setSelectedWorkflowIds([]);

    setSelectedGroupIds([]);

  };



  const executeMoveItems = (targetGroupId: string | null, customWfIds?: string[], customGrpIds?: string[]) => {

    const workflowIds: string[] = customWfIds || (moveMenuState ? moveMenuState.workflowIds : []);

    const groupIds: string[] = customGrpIds || (moveMenuState ? moveMenuState.groupIds : []);



    if (workflowIds && workflowIds.length > 0) {

      setWorkflowGroupMap(prev => {

        const next = { ...prev };

        workflowIds.forEach((rawId: string) => {

          const proc = processes.find(p => p.id === rawId || p.workflowId === rawId);

          const wfKey = proc ? (proc.workflowId || proc.id) : rawId;

          if (targetGroupId === null) {

            delete next[wfKey];

            if (proc?.id) delete next[proc.id];

            if (proc?.workflowId) delete next[proc.workflowId];

          } else {

            next[wfKey] = targetGroupId;

            if (proc?.id) next[proc.id] = targetGroupId;

            if (proc?.workflowId) next[proc.workflowId] = targetGroupId;

          }

        });

        try {

          localStorage.setItem('app_workflow_group_map', JSON.stringify(next));

        } catch (err) {}

        return next;

      });

    }



    if (groupIds && groupIds.length > 0) {

      setGroups(prev => {

        const updated = prev.map(g => {

          if (groupIds.includes(g.id)) {

            if (targetGroupId === g.id) return g;

            if (targetGroupId && isGroupDescendant(g.id, targetGroupId, prev)) return g;

            return { ...g, parentId: targetGroupId };

          }

          return g;

        });

        try {

          localStorage.setItem('app_workflow_groups', JSON.stringify(updated));

        } catch (err) {}

        return updated;

      });

    }



    setMoveMenuState(null);

    setSelectedWorkflowIds([]);

    setSelectedGroupIds([]);

  };



  // Move item(s) out to the immediate previous layer (parent folder or Root)

  // If multiple items are selected, move ALL selected items together at once

  const handleMoveToPreviousLayer = (itemId: string, itemType: 'workflow' | 'folder') => {

    if (currentGroupId === null) return;

    const currentGroup = groups.find(g => g.id === currentGroupId);

    const targetGroupId = currentGroup?.parentId || null;



    let wfIds: string[] = [];

    let grpIds: string[] = [];



    const hasMultiSelect = selectedWorkflowIds.length > 0 || selectedGroupIds.length > 0;

    if (hasMultiSelect) {

      wfIds = itemType === 'workflow'

        ? Array.from(new Set([...selectedWorkflowIds, itemId]))

        : [...selectedWorkflowIds];

      grpIds = itemType === 'folder'

        ? Array.from(new Set([...selectedGroupIds, itemId]))

        : [...selectedGroupIds];

    } else {

      if (itemType === 'workflow') {

        wfIds = [itemId];

      } else {

        grpIds = [itemId];

      }

    }



    executeMoveItems(targetGroupId, wfIds, grpIds);

  };



  const handleCreateGroup = () => {

    if (!newGroupName.trim()) return;

    const newGroup = {

      id: 'grp_' + Date.now(),

      name: newGroupName.trim(),

      description: newGroupDesc.trim(),

      parentId: currentGroupId,

      color: newGroupColor,

      createdAt: new Date().toISOString()

    };

    const updated = [...groups, newGroup];

    setGroups(updated);

    try {

      localStorage.setItem('app_workflow_groups', JSON.stringify(updated));

    } catch (e) {}

    setNewGroupName('');

    setNewGroupDesc('');

    setShowCreateGroupModal(false);

  };



  const handleBackGroup = () => {

    if (!currentGroupId) return;

    const current = groups.find(g => g.id === currentGroupId);

    if (current) {

      setCurrentGroupId(current.parentId || null);

    } else {

      setCurrentGroupId(null);

    }

  };



  const handleDeleteGroup = async (groupId: string, deleteWorkflows: boolean = false) => {

    const childGroupIds = new Set<string>();

    const findChildren = (pid: string) => {

      groups.forEach(g => {

        if (g.parentId === pid) {

          childGroupIds.add(g.id);

          findChildren(g.id);

        }

      });

    };

    findChildren(groupId);

    childGroupIds.add(groupId);



    if (deleteWorkflows) {

      const contained = processes.filter(p => childGroupIds.has(workflowGroupMap[p.workflowId || p.id]));

      contained.forEach(proc => {

        if (isRunning && currentRunId === proc.id) {

          handleStopProcess(proc.id);

        }

      });



      for (const proc of contained) {

        const targetWfId = proc.workflowId || proc.id;

        if (targetWfId && targetWfId !== 'default' && targetWfId !== 'wf_default') {

          try {

            await fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(targetWfId)}`, { method: 'DELETE' });

          } catch (e) {}

        }

        if (proc.id && proc.id !== targetWfId) {

          try {

            await fetch(`${BACKEND_URL}/api/workflows/runs/${encodeURIComponent(proc.id)}`, { method: 'DELETE' });

          } catch (e) {}

        }

      }



      const containedIdSet = new Set(contained.map(p => p.id));

      const containedWfIdSet = new Set(contained.map(p => p.workflowId || p.id));

      setProcesses(prev => prev.filter(p => !containedIdSet.has(p.id) && !containedWfIdSet.has(p.workflowId || p.id)));



      if (contained.some(p => p.id === selectedWorkflowId || p.workflowId === selectedWorkflowId)) {

        setNodes([]);

        setEdges([]);

        setAgentNodes([]);

        setAgentEdges([]);

        setSelectedWorkflowId(null);

        setWorkflowName('');

        setWorkflowDesc('');

      }



      setWorkflowColorMap(prev => {

        const next = { ...prev };

        containedWfIdSet.forEach(id => delete next[id]);

        try {

          localStorage.setItem('app_workflow_color_map', JSON.stringify(next));

        } catch (e) {}

        return next;

      });



      setSelectedWorkflowIds(prev => prev.filter(id => !containedIdSet.has(id) && !containedWfIdSet.has(id)));

    }



    const updatedGroups = groups.filter(g => !childGroupIds.has(g.id));

    setGroups(updatedGroups);

    try {

      localStorage.setItem('app_workflow_groups', JSON.stringify(updatedGroups));

    } catch (e) {}



    setWorkflowGroupMap(prev => {

      const next = { ...prev };

      Object.keys(next).forEach(wfId => {

        if (childGroupIds.has(next[wfId])) {

          delete next[wfId];

        }

      });

      try {

        localStorage.setItem('app_workflow_group_map', JSON.stringify(next));

      } catch (e) {}

      return next;

    });



    if (currentGroupId && childGroupIds.has(currentGroupId)) {

      handleBackGroup();

    }

    setGroupToDelete(null);

  };



  const [queueToClear, setQueueToClear] = useState<'pdf' | 'zip' | 'txt' | 'agent' | null>(null);


  const [newDialogWfName, setNewDialogWfName] = useState<string>('My AI Agent Workflow');

  const [newDialogWfDesc, setNewDialogWfDesc] = useState<string>('Automated AI pipeline and task execution flow');

  const [newDialogWfColor, setNewDialogWfColor] = useState<string>('blue');

  const [logs, setLogs] = useState<LogMessage[]>([]);

  const [, setWorkflowLogsMap] = useState<Record<string, LogMessage[]>>({});



  const saveLogToBackend = (wfId?: string | null, logEntry?: LogMessage | null) => {

    if (!wfId || !logEntry) return;

    try {

      fetch(`${BACKEND_URL}/api/workflows/${wfId}/logs`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ log: logEntry })

      }).catch(() => {});

    } catch (e) {}

  };



  const appendGlobalLog = (msg: string, lvl: 'INFO' | 'ERROR' | 'SUCCESS' = 'INFO') => {

    const entry: LogMessage = {

      message: msg,

      level: lvl,

      timestamp: new Date().toISOString()

    };

    setLogs((prev) => [...prev, entry]);

    if (selectedWorkflowId) {

      setWorkflowLogsMap((prev) => ({ ...prev, [selectedWorkflowId]: [...(prev[selectedWorkflowId] || []), entry] }));

      saveLogToBackend(selectedWorkflowId, entry);

    }

  };



  const fetchWorkflowLogs = async (wfId: string) => {

    if (!wfId) return;

    try {

      const res = await fetch(`${BACKEND_URL}/api/workflows/${wfId}/logs`);

      if (res.ok) {

        const data = await res.json();

        if (Array.isArray(data.logs)) {

          const parsed: LogMessage[] = data.logs.map((l: any) => ({

            timestamp: l.timestamp || new Date().toISOString(),

            level: (l.level === 'ERROR' || l.level === 'SUCCESS' ? l.level : 'INFO') as 'INFO' | 'ERROR' | 'SUCCESS',

            message: l.message || '',

            source_file: 'WF/' + wfId + '/log/' + wfId + '.log',

            log_type: 'general' as any

          }));

          setWorkflowLogsMap(prev => ({ ...prev, [wfId]: parsed }));

          if (selectedWorkflowId === wfId) {

            setLogs(parsed);

          }

        }

      }

    } catch (e) {

      console.error(`[fetchWorkflowLogs] Failed for ${wfId}:`, e);

    }

  };



  const clearWorkflowLogs = async (wfId?: string) => {

    if (wfId) {

      setWorkflowLogsMap(prev => ({ ...prev, [wfId]: [] }));

      if (selectedWorkflowId === wfId || currentRunId === wfId) {

        setLogs([]);

      }

      try {

        await fetch(`${BACKEND_URL}/api/workflows/${wfId}/logs`, { method: 'DELETE' });

      } catch (e) {

        console.error(`[clearWorkflowLogs] Failed to delete logs from disk for ${wfId}:`, e);

      }

    } else {

      setLogs([]);

      if (selectedWorkflowId) {

        setWorkflowLogsMap(prev => ({ ...prev, [selectedWorkflowId]: [] }));

        try {

          await fetch(`${BACKEND_URL}/api/workflows/${selectedWorkflowId}/logs`, { method: 'DELETE' });

        } catch (e) {}

      }

    }

  };



  const logUserAction = (

    action: string, 

    details?: any, 

    meta?: { file?: string; class?: string; func?: string; logType?: 'general' | 'process_action' | 'status_change' }

  ) => {

    const file = meta?.file || 'App.tsx';

    const cls = meta?.class || (activeTab === 'process' ? 'ProcessMonitor' : 'LogicWorkspace');

    let func = meta?.func || 'anonymous';

    if (func === 'anonymous') {

      try {

        const stack = new Error().stack?.split('\n') || [];

        for (let i = 2; i < stack.length; i++) {

          const line = stack[i].trim();

          if (line && !line.includes('logUserAction') && !line.includes('react-dom') && !line.includes('react_devtools')) {

            const match = line.match(/at\s+([^\s(]+)/);

            if (match && match[1] !== 'Object.<anonymous>') {

              const name = match[1].split('.').pop() || match[1];

              if (name !== 'onClick' && name !== 'anonymous') { func = name; break; }

            }

          }

        }

      } catch (e) {}

    }

    const logType = meta?.logType || (

      action.toLowerCase().includes('stop') || action.toLowerCase().includes('start') || action.toLowerCase().includes('play') || action.toLowerCase().includes('delete') || action.toLowerCase().includes('import') || action.toLowerCase().includes('export') || action.toLowerCase().includes('clear')

        ? 'process_action'

        : action.toLowerCase().includes('status')

        ? 'status_change'

        : 'general'

    );



    const sourceTag = `[File: ${file} | Class: ${cls} | Function: ${func}]`;

    const actionMessage = `${sourceTag} ${action} ${details?.workflowName ? `[Workflow: ${details.workflowName}]` : ''}`;



    setLogs(prev => [

      ...prev,

      {

        message: actionMessage,

        level: logType === 'status_change' ? 'SUCCESS' : 'INFO',

        timestamp: new Date().toISOString(),

        source_file: file,

        source_class: cls,

        source_function: func,

        log_type: logType

      }

    ]);



    fetch(`${BACKEND_URL}/api/audit-log`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ action, details, tab: activeTab, source: { file, class: cls, function: func } })

    }).catch(err => console.error("Failed to log user action:", err));

  };

  const [selectedProcessNodeIds, setSelectedProcessNodeIds] = useState<string[]>([]);

  const [isSubflowModeActive, setIsSubflowModeActive] = useState<boolean>(false);

  const [customAlert, setCustomAlert] = useState<{

    show: boolean;

    title: string;

    message: string;

    type: 'success' | 'error' | 'info';

  }>({

    show: false,

    title: '',

    message: '',

    type: 'info'

  });



  const showAlert = (message: string, title: string = 'System Alert', type: 'success' | 'error' | 'info' = 'info') => {

    setCustomAlert({ show: true, title, message, type });

    try {

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

      if (AudioContext) {

        const ctx = new AudioContext();

        const osc = ctx.createOscillator();

        const gain = ctx.createGain();

        osc.connect(gain);

        gain.connect(ctx.destination);

        osc.type = type === 'error' ? 'sawtooth' : 'sine';

        osc.frequency.setValueAtTime(type === 'error' ? 300 : type === 'success' ? 600 : 440, ctx.currentTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);

        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.start(ctx.currentTime);

        osc.stop(ctx.currentTime + 0.3);

      }

    } catch (e) {

      console.error("Audio play failed", e);

    }

  };

  const [agentNodes, setAgentNodes] = useNodesState([]);

  const [agentEdges, setAgentEdges] = useEdgesState([]);



  // (Removed dangerous useEffect that forcibly synchronized canvas selection on every node update)

  



  // Execution states

  const [isRunning, setIsRunning] = useState(false);

  const [finalPromptPreview, setFinalPromptPreview] = useState<string | null>(null);

  const [isFinalPromptModalOpen, setIsFinalPromptModalOpen] = useState(false);

  const [finalSendPayloadPreview, setFinalSendPayloadPreview] = useState<string | null>(null);

  const [isFinalSendModalOpen, setIsFinalSendModalOpen] = useState(false);



    const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  const [showLogsTray, setShowLogsTray] = useState(true);

  const [activeLogTab, setActiveLogTab] = useState<'process' | 'system' | 'ai'>('process');

  const [systemLogs, setSystemLogs] = useState<string>('');

  const [aiLogs, setAiLogs] = useState<string>('');

  const [isMiniSidebar, setIsMiniSidebar] = useState<boolean>(false);

  const [isUnifiedSettingsOpen, setIsUnifiedSettingsOpen] = useState<boolean>(false);

  const [unifiedSettingsTab, setUnifiedSettingsTab] = useState<'profile' | 'ai' | 'canvas'>('profile');



  useEffect(() => {

    let intervalId: any;

    if (showLogsTray && (activeLogTab === 'system' || activeLogTab === 'ai')) {

      const fetchLogs = async () => {

        try {

          if (activeLogTab === 'system') {

            const res = await fetch(`${BACKEND_URL}/api/system-logs`);

            if (res.ok) {

              const data = await res.json();

              setSystemLogs(data.logs);

            }

          } else if (activeLogTab === 'ai') {

            const res = await fetch(`${BACKEND_URL}/api/ai-logs`);

            if (res.ok) {

              const data = await res.json();

              setAiLogs(data.logs);

            }

          }

        } catch (e) {

          console.error("Error fetching logs", e);

        }

      };

      fetchLogs();

      intervalId = setInterval(fetchLogs, 3000);

    }

    return () => {

      if (intervalId) clearInterval(intervalId);

    };

  }, [showLogsTray, activeLogTab]);



  const isRunningRef = useRef(isRunning);

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

    const [processes, setProcesses] = useState<any[]>([]);

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



  const handleStopProcess = async (processId: string) => {

    logUserAction(`Stop Process/Workflow (ID: ${processId})`, { processId }, { file: 'App.tsx', class: 'App', func: 'handleStopProcess', logType: 'process_action' });

    logUserAction(`Workflow Status Changed: Running -> Stopped`, { processId }, { file: 'App.tsx', class: 'App', func: 'handleStopProcess', logType: 'status_change' });

    const proc = processes.find(p => p.id === processId || p.workflowId === processId);

    const wfId = proc ? (proc.workflowId || proc.id) : processId;



    if (isRunning || currentRunId === processId || currentRunId === wfId || currentRunIdRef.current === processId || (processId === 'dummy_id' && isSubflowModeActive)) {

      if (eventSourceRef.current) {

        eventSourceRef.current.close();

        eventSourceRef.current = null;

      }

      setIsRunning(false);

      isRunningRef.current = false;

      setIsSubflowModeActive(false);

      setSelectedProcessNodeIds([]);

      setNodes((nds) => nds.map((n) => {

        const isQueue = (n.data?.nodeType || '').toLowerCase().includes('queue') || (n.type || '').toLowerCase().includes('queue') || (n.data?.name || '').toLowerCase().includes('queue');

        const isTimer = (n.data?.nodeType || '').toLowerCase().includes('timer') || (n.data?.name || '').toLowerCase().includes('timer') || (n.data?.label || '').toLowerCase().includes('timer');

        return {

          ...n,

          selected: false,

          data: {

            ...n.data,

            status: 'idle',

            parameters: {

              ...n.data?.parameters,

              activeSubflow: false,

              schedulerActive: false,

              ...(isQueue ? { currentIndex: 0, hasNext: false } : {}),

              ...(isTimer ? { runCount: 1 } : {})

            }

          }

        };

      }));

      setEdges((eds) => eds.map((edge) => ({ ...edge, className: '' })));

    }



    try {

      await fetch(`${BACKEND_URL}/api/workflows/runs/${processId}/stop`, {

        method: 'POST'

      });

    } catch (e) {

      console.error("Error stopping backend process:", e);

    }



    setProcesses((prev) =>

      prev.map((p) => {

        if (p.id === processId || p.workflowId === processId || p.id === wfId || p.status === 'running' || p.status === 'paused') {

          if (activeStreamsRef.current[p.id]) {

            activeStreamsRef.current[p.id].close();

            delete activeStreamsRef.current[p.id];

          }

          return { ...p, status: 'stopped' };

        }

        return p;

      })

    );



    if (activeStreamsRef.current[processId]) {

      activeStreamsRef.current[processId].close();

      delete activeStreamsRef.current[processId];

    }

    if (wfId && activeStreamsRef.current[wfId]) {

      activeStreamsRef.current[wfId].close();

      delete activeStreamsRef.current[wfId];

    }

  };



  const handleDeleteProcess = async (processId: string) => {

    logUserAction(`Delete Process Record (ID: ${processId})`, { processId }, { file: 'App.tsx', class: 'App', func: 'handleDeleteProcess', logType: 'process_action' });

    logUserAction(`Workflow Status Changed: Process removed from monitor`, { processId }, { file: 'App.tsx', class: 'App', func: 'handleDeleteProcess', logType: 'status_change' });

    if (isRunning && currentRunId === processId) {

      handleStopProcess(processId);

    }



    const targetProc = processes.find((proc) => proc.id === processId);

    const targetWfId = targetProc?.workflowId || processId;



    try {

      if (targetWfId && targetWfId !== 'default' && targetWfId !== 'wf_default') {

        const delRes = await fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(targetWfId)}`, { method: 'DELETE' });

        if (!delRes.ok) {

          console.warn(`[handleDeleteProcess] Failed to delete workflow ${targetWfId}`);

        }

      }

      if (processId && processId !== targetWfId) {

        await fetch(`${BACKEND_URL}/api/workflows/runs/${encodeURIComponent(processId)}`, { method: 'DELETE' }).catch(() => {});

      }

    } catch (e) {

      console.error("Error deleting backend process or workflow:", e);

    }



    // Refresh workflows list and sync process table from backend

    fetchWorkflows();



    setProcesses((prev) => {

      const remaining = prev.filter((proc) => proc.id !== processId && proc.workflowId !== targetWfId);

      if (remaining.length === 0 || (targetProc && (targetProc.workflowId === selectedWorkflowId || targetProc.name === workflowName || processId === selectedWorkflowId))) {

        setNodes([]);

        setEdges([]);

        setAgentNodes([]);

        setAgentEdges([]);

        setSelectedWorkflowId(null);

        setWorkflowName('');

        setWorkflowDesc('');

        setCurrentFileName(null);

      }

      return remaining;

    });



    if (activeStreamsRef.current[processId]) {

      activeStreamsRef.current[processId].close();

      delete activeStreamsRef.current[processId];

    }

    if (targetWfId && activeStreamsRef.current[targetWfId]) {

      activeStreamsRef.current[targetWfId].close();

      delete activeStreamsRef.current[targetWfId];

    }



    showAlert(`Workflow ${targetProc?.name || targetWfId} and all associated folders deleted successfully.`, "Workflow Deleted", "success");

  };



  const handleInspectProcess = (processId: string, tab: 'logic') => {

    const proc = processes.find((p) => p.id === processId || p.workflowId === processId);

    if (!proc) return;



    const wfId = proc.workflowId || proc.id;

    setSelectedWorkflowId(wfId);

    setWorkflowName(proc.name);

    setWorkflowDesc(proc.description || '');

    setNodes(proc.nodes || []);

    setEdges(proc.edges || []);

    setAgentNodes(proc.agentNodes || []);

    setAgentEdges(proc.agentEdges || []);



    if (proc.lastActiveNode) {

      const activeNode = (proc.nodes || []).find((n: any) => n.id === proc.lastActiveNode) ||

                         (proc.agentNodes || []).find((n: any) => n.id === proc.lastActiveNode);

      if (activeNode) {

        setSelectedNode(activeNode);

      }

    } else {

      setSelectedNode(null);

    }



    if (proc.runMode === 'subflow') {

      setIsSubflowModeActive(true);

      if (proc.selectedProcessNodeIds && proc.selectedProcessNodeIds.length > 0) {

        setSelectedProcessNodeIds(proc.selectedProcessNodeIds);

      }

    } else {

      setIsSubflowModeActive(false);

    }



    if (proc.status === 'running') {

      setIsRunning(true);

      isRunningRef.current = true;

      setCurrentRunId(wfId);

    }



    setIsShowingSettings(false);

    fetchWorkflowLogs(wfId);

    setActiveTab(tab);

  };



  const handlePlayProcess = async (processId: string) => {

    logUserAction(`Play/Resume Process (ID: ${processId})`, { processId }, { file: 'App.tsx', class: 'App', func: 'handlePlayProcess', logType: 'process_action' });

    logUserAction(`Workflow Status Changed: Idle/Stopped -> Running`, { processId }, { file: 'App.tsx', class: 'App', func: 'handlePlayProcess', logType: 'status_change' });

    const proc = processes.find(p => p.id === processId || p.workflowId === processId);

    if (!proc) return;



    const wfId = proc.workflowId || proc.id;



    // Immediately mark as running so UI badge changes from IDLE to PROCESS and Play button turns active and pulses!

    setProcesses(prev =>

      prev.map(p =>

        (p.id === processId || p.workflowId === processId || p.id === wfId || p.workflowId === wfId)

          ? { ...p, status: 'running' }

          : p

      )

    );



    if (selectedWorkflowId !== wfId && wfId !== 'default') {

      setSelectedWorkflowId(wfId);

      setWorkflowName(proc.name || 'Saved Workflow');

      setWorkflowDesc(proc.description || '');

      setNodes(proc.nodes || []);

      setEdges(proc.edges || []);

      setAgentNodes(proc.agentNodes || []);

      setAgentEdges(proc.agentEdges || []);

    }



    const mode = proc.runMode || 'full';

    const subflowIds = proc.selectedProcessNodeIds || [];



    if (mode === 'subflow' && subflowIds.length > 0) {

      setSelectedProcessNodeIds(subflowIds);

      setIsSubflowModeActive(true);

      if (handleRunRef.current) {

        await handleRunRef.current(subflowIds, proc.nodes || nodes, false, wfId);

      }

    } else {

      setIsSubflowModeActive(false);

      if (handleRunRef.current) {

        await handleRunRef.current(undefined, proc.nodes || nodes, false, wfId);

      }

    }

  };



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

  const [past, setPast] = useState<{ nodes: Node[]; edges: Edge[]; agentNodes: Node[]; agentEdges: Edge[] }[]>([]);

  const [future, setFuture] = useState<{ nodes: Node[]; edges: Edge[]; agentNodes: Node[]; agentEdges: Edge[] }[]>([]);

  const [historyLimit, setHistoryLimit] = useState<number>(50);

  const [isShowingSettings, setIsShowingSettings] = useState<boolean>(false); void isShowingSettings;

  const [isShowingModels, setIsShowingModels] = useState<boolean>(false); void isShowingModels;

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

  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

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

  const dragStartStateRef = useRef<{ nodes: Node[]; edges: Edge[]; agentNodes: Node[]; agentEdges: Edge[] } | null>(null);

  const propertyEditStartStateRef = useRef<{ nodes: Node[]; edges: Edge[]; agentNodes: Node[]; agentEdges: Edge[] } | null>(null);

  const activeStreamsRef = useRef<Record<string, EventSource>>({});



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



  // Save current state as history snapshot

  const takeSnapshot = useCallback(() => {

    const currentStateCloned = JSON.parse(JSON.stringify({ nodes, edges, agentNodes, agentEdges }));

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

    const currentStateCloned = JSON.parse(JSON.stringify({ nodes, edges, agentNodes, agentEdges }));

    setFuture((prevFuture) => [...prevFuture, currentStateCloned]);



    // Restore previous state (deep cloned to prevent subsequent mutations from affecting history)

    const restoredState = JSON.parse(JSON.stringify(previousState));

    setNodes(restoredState.nodes);

    setEdges(restoredState.edges);

    setAgentNodes(restoredState.agentNodes);

    setAgentEdges(restoredState.agentEdges);



    if (selectedNode) {

      const syncedNode = restoredState.nodes.find((n: any) => n.id === selectedNode.id) ||

                         restoredState.agentNodes.find((n: any) => n.id === selectedNode.id);

      setSelectedNode(syncedNode || null);

    }



    // Remove the last state from past

    setPast((prevPast) => prevPast.slice(0, -1));

  }, [past, nodes, edges, agentNodes, agentEdges, selectedNode, setNodes, setEdges, setAgentNodes, setAgentEdges]);



  const redo = useCallback(() => {

    if (future.length === 0) return;



    const nextState = future[future.length - 1];

    if (!nextState) return;



    // Deep clone current state to save in past

    const currentStateCloned = JSON.parse(JSON.stringify({ nodes, edges, agentNodes, agentEdges }));

    setPast((prevPast) => {

      const nextPast = [...prevPast, currentStateCloned];

      if (nextPast.length > historyLimit) {

        nextPast.shift();

      }

      return nextPast;

    });



    // Restore next state

    const restoredState = JSON.parse(JSON.stringify(nextState));

    setNodes(restoredState.nodes);

    setEdges(restoredState.edges);

    setAgentNodes(restoredState.agentNodes);

    setAgentEdges(restoredState.agentEdges);



    if (selectedNode) {

      const syncedNode = restoredState.nodes.find((n: any) => n.id === selectedNode.id) ||

                         restoredState.agentNodes.find((n: any) => n.id === selectedNode.id);

      setSelectedNode(syncedNode || null);

    }



    // Remove the last state from future

    setFuture((prevFuture) => prevFuture.slice(0, -1));

  }, [future, nodes, edges, agentNodes, agentEdges, historyLimit, selectedNode, setNodes, setEdges, setAgentNodes, setAgentEdges]);



  // Drag hooks to record start and end positions

  const onNodeDragStart = useCallback(() => {

    dragStartStateRef.current = JSON.parse(JSON.stringify({ nodes, edges, agentNodes, agentEdges }));

  }, [nodes, edges, agentNodes, agentEdges]);



  const onNodeDragStop = useCallback(() => {

    logUserAction(`Node Drag Stopped on Workspace`, { selectedCount: selectedProcessNodeIds.length }, { file: 'App.tsx', class: 'App', func: 'onNodeDragStop', logType: 'general' });

    if (dragStartStateRef.current) {

      // Check if actual coordinates changed

      const hasNodesChanged = JSON.stringify(dragStartStateRef.current.nodes) !== JSON.stringify(nodes);

      const hasAgentNodesChanged = JSON.stringify(dragStartStateRef.current.agentNodes) !== JSON.stringify(agentNodes);

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

  }, [nodes, agentNodes, historyLimit]);



  // Bubbled handlers for properties panel inputs

  const handleInspectorFocus = () => {

    if (!propertyEditStartStateRef.current) {

      propertyEditStartStateRef.current = JSON.parse(JSON.stringify({ nodes, edges, agentNodes, agentEdges }));

    }

  };



  const handleInspectorBlur = (e: React.FocusEvent) => {

    if (!e.currentTarget.contains(e.relatedTarget as any)) {

      if (propertyEditStartStateRef.current) {

        const hasNodesChanged = JSON.stringify(propertyEditStartStateRef.current.nodes) !== JSON.stringify(nodes) ||

                               JSON.stringify(propertyEditStartStateRef.current.edges) !== JSON.stringify(edges);

        const hasAgentNodesChanged = JSON.stringify(propertyEditStartStateRef.current.agentNodes) !== JSON.stringify(agentNodes) ||

                                    JSON.stringify(propertyEditStartStateRef.current.agentEdges) !== JSON.stringify(agentEdges);

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

  };



  // SSE event source connection ref

  const eventSourceRef = useRef<EventSource | null>(null);



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



  const fetchProcesses = useCallback(async (workflowId?: string) => {

    const wfId = workflowId || selectedWorkflowId;

    if (!wfId) return;

    try {

      const res = await fetch(`${BACKEND_URL}/api/workflows/${wfId}/runs`);

      if (res.ok) {

        const data = await res.json();

        if (Array.isArray(data)) {

          const mapped = data.map((run: any) => {

          const step = getWorkflowStep(run.current_node_id, undefined);

          return {

            id: run.id,

            workflowId: run.workflow_id,

            name: run.name || 'Workflow Run',

            description: run.description || '',

            startTime: run.created_at,

            status: run.status,

            currentStep: step,

            lastActiveNode: run.current_node_id || '',

            nodes: run.nodes && run.nodes.length > 0 ? run.nodes : [],

            edges: run.edges && run.edges.length > 0 ? run.edges : [],

            agentNodes: run.agentNodes && run.agentNodes.length > 0 ? run.agentNodes : [],

            agentEdges: run.agentEdges && run.agentEdges.length > 0 ? run.agentEdges : []

          };

        });

        setProcesses((prev) => {

          const processMap = new Map();

          prev.forEach((p) => processMap.set(p.workflowId || p.id, p));

          mapped.forEach((m: any) => {

            const key = m.workflowId || m.id;

            if (processMap.has(key)) {

              const existing = processMap.get(key);

              processMap.set(key, { ...existing, status: m.status || existing.status, currentStep: m.currentStep || existing.currentStep, lastActiveNode: m.lastActiveNode || existing.lastActiveNode });

            }

          });

          return Array.from(processMap.values());

        });

        }

      }

    } catch (e) {

      console.error("Error fetching workflow runs", e);

    }

  }, [selectedWorkflowId]);



  useEffect(() => {

    if (selectedWorkflowId) {

      fetchProcesses(selectedWorkflowId);

    }

  }, [selectedWorkflowId, fetchProcesses]);



  useEffect(() => {

    const runningProcs = processes.filter(p => p.status === 'running');

    

    runningProcs.forEach((proc) => {

      if (activeStreamsRef.current[proc.id]) return; // Already listening

      

      const targetRunId = proc.activeRunId || proc.id;

      const eventSource = new EventSource(`${BACKEND_URL}/api/workflows/runs/${targetRunId}/stream`);

      activeStreamsRef.current[proc.id] = eventSource;

      

      eventSource.addEventListener('log', (e: any) => {

        try {

          const data = JSON.parse(e.data);

          const wfId = proc.workflowId || proc.id;

          

          setLogs(prev => [

            ...prev,

            {

              timestamp: data.timestamp || new Date().toISOString(),

              level: (data.level === 'ERROR' || data.level === 'SUCCESS' ? data.level : 'INFO') as 'INFO' | 'ERROR' | 'SUCCESS',

              message: data.message || '',

              source_file: 'WF/' + wfId + '/log/' + proc.id + '.log',

              log_type: 'general' as any

            }

          ]);

        } catch (err) {

          console.error("Failed to parse log event", err);

        }

      });

      

      eventSource.addEventListener('node_active', (e: any) => {

        const data = JSON.parse(e.data);

        const activeId = data.node_id;

        

        setProcesses((prev) =>

          prev.map((p) => {

            if (p.id === proc.id) {

              const matchedNode = p.nodes.find((n: any) => n.id === activeId) ||

                                  p.agentNodes.find((n: any) => n.id === activeId);

              const category = matchedNode?.data?.category;

              const step = getWorkflowStep(activeId, category);

              

              return {

                ...p,

                lastActiveNode: activeId,

                currentStep: step

              };

            }

            return p;

          })

        );

      });

      

      eventSource.addEventListener('node_complete', (e: any) => {

        const data = JSON.parse(e.data);

        const { node_id, outputs } = data;

        

        setProcesses((prev) =>

          prev.map((p) => {

            if (p.id === proc.id) {

              const updatedNodes = p.nodes.map((n: any) => {

                if (n.id === node_id) {

                  return {

                    ...n,

                    data: {

                      ...n.data,

                      parameters: { ...n.data.parameters, ...outputs }

                    }

                  };

                }

                return n;

              });

              return { ...p, nodes: updatedNodes };

            }

            return p;

          })

        );



        setNodes((nds) =>

          nds.map((n) => {

            if (n.id === node_id) {

              return {

                ...n,

                data: {

                  ...n.data,

                  parameters: { ...n.data.parameters, ...outputs }

                }

              };

            }

            return n;

          })

        );

        

        setSelectedNode((prev) => {

          if (prev && prev.id === node_id) {

            return {

              ...prev,

              data: {

                ...prev.data,

                parameters: { ...prev.data.parameters, ...outputs }

              }

            };

          }

          return prev;

        });

      });

      

      eventSource.addEventListener('complete', (e: any) => {

        const data = JSON.parse(e.data);

        setProcesses((prev) =>

          prev.map((p) => {

            if (p.id === proc.id) {

              return {

                ...p,

                status: data.status === 'success' ? 'success' : 'failed',

                currentStep: 6

              };

            }

            return p;

          })

        );

        eventSource.close();

        delete activeStreamsRef.current[proc.id];

      });

      

      eventSource.onerror = () => {

        setProcesses((prev) =>

          prev.map((p) => {

            if (p.id === proc.id) {

              return { ...p, status: 'failed' };

            }

            return p;

          })

        );

        eventSource.close();

        delete activeStreamsRef.current[proc.id];

      };

    });

    

    // Clean up streams for completed/non-running processes

    Object.keys(activeStreamsRef.current).forEach((id) => {

      const isStillRunning = processes.some(p => p.id === id && p.status === 'running');

      if (!isStillRunning) {

        try {

          activeStreamsRef.current[id].close();

        } catch {}

        delete activeStreamsRef.current[id];

      }

    });

  }, [processes]);



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







  // 2. Handle Connection creation in React Flow

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

      setAgentEdges((aeds) => addEdge(newEdgeAgent, aeds));

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



  // 6. Handle selected node changes in properties panel

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

            <div className="flex-1 w-full h-full relative">

              <CanvasHeader
                isAutoSaving={isAutoSaving}
                workflowName={workflowName}
                onWorkflowNameChange={(val) => {
                  setWorkflowName(val);
                  if (val.trim()) {
                    const cleanFname = val.trim().replace(/\s+/g, '_') + '.wf';
                    setCurrentFileName(cleanFname);
                    setProcesses(prev => prev.map(p => (p.workflowId === selectedWorkflowId || p.name === workflowName) ? { ...p, name: val } : p));
                  }
                }}
                currentFileName={currentFileName}
                isRunning={isRunning}
                selectedWorkflowId={selectedWorkflowId}
                isPropertiesInspectorOpen={isPropertiesInspectorOpen}
                currentUser={currentUser}
                onOpenProfile={() => {
                  setUnifiedSettingsTab('profile');
                  setIsUnifiedSettingsOpen(true);
                }}
                onOpenUserManagement={() => setIsUserManagementOpen(true)}
                currentTime={currentTime}
                selectedNodesCount={nodes.filter(n => n.selected).length}
                isSubRunning={isSubflowModeActive || nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "subflow")}
                onStartSubWorkFlowClick={handleStartSubWorkFlowClick}
                isFullRunning={nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full")}
                onStartWorkFlowClick={handleStartWorkFlowClick}
              />



              <ReactFlow

                key="logic-flow"



                onNodesChange={onNodesChange}

                onEdgesChange={onEdgesChange}

                onConnect={onConnect}

                onInit={setReactFlowInstance}

                onDrop={onDrop}

                onDragOver={onDragOver}

                onNodeClick={onNodeClick}

                onNodeDoubleClick={(_e, node) => handleDrillDownContainer(node)}

                onPaneClick={onPaneClick}

                onSelectionChange={onSelectionChange}

                nodeTypes={nodeTypes}

                fitView

                className="bg-[#F0F4F9]"

                proOptions={{ hideAttribution: true }}

                deleteKeyCode={null}

                onNodeDragStart={onNodeDragStart}

                onNodeDragStop={onNodeDragStop}

                nodesDraggable={!isLocked}

                minZoom={0.25}

                selectionOnDrag={true}

                panOnDrag={[1, 2]}

                selectionMode={SelectionMode.Partial}

              >

                <Background color="#CBD5E1" gap={22} size={1.5} />



                {/* Floating Navigation & Lock Controls bottom-left */}

                <Controls showInteractive={false} position="bottom-left">

                  <button

                    onClick={() => setIsLocked(!isLocked)}

                    className={`react-flow__controls-button flex items-center justify-center ${isLocked ? 'locked-btn' : ''}`}

                    title={isLocked ? "Unlock Nodes" : "Lock Nodes"}

                    type="button"

                  >

                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}

                  </button>

                </Controls>





              </ReactFlow>



              {/* Floating Show Log File Button when tray is hidden */}

              {!showLogsTray && (

                <button

                  onClick={() => setShowLogsTray(true)}

                  className="absolute bottom-5 right-6 z-20 flex items-center space-x-2 px-4 py-2 bg-white/95 border border-slate-200/90 rounded-full shadow-[0_8px_24px_rgba(30,60,110,0.12)] hover:border-blue-500 hover:text-blue-600 text-slate-700 text-xs font-bold transition-all backdrop-blur-md cursor-pointer group select-none"

                  title="Show Log File (แสดง Log File)"

                >

                  <Terminal className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />

                  <span className="font-semibold tracking-wide">Show Log File</span>

                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />

                </button>

              )}

            </div>

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
          isSelectedDbNode={isSelectedDbNode}
          isSelectedGraphRagNode={isSelectedGraphRagNode}
          isSelectedApiConnectorNode={isSelectedApiConnectorNode}
          isSelectedApiIncrementalNode={isSelectedApiIncrementalNode}
          isSelectedJsonConnectorNode={isSelectedJsonConnectorNode}
          isSelectedJsonConnectorListNode={isSelectedJsonConnectorListNode}
          isSelectedPageNode={isSelectedPageNode}
          isSelectedStorageNode={isSelectedStorageNode}
          isSelectedPdfsLoaderNode={isSelectedPdfsLoaderNode}
          isSelectedOcrPdfsNode={isSelectedOcrPdfsNode}
          isSelectedExtractNode={isSelectedExtractNode}
          isSelectedDeDuplicateNode={isSelectedDeDuplicateNode}
          isSelectedStructuredParseNode={isSelectedStructuredParseNode}
          isSelectedStateNode={isSelectedStateNode}
          isSelectedPdfQueueNode={isSelectedPdfQueueNode}
          isSelectedTxtQueueNode={isSelectedTxtQueueNode}
          isSelectedZipQueueNode={isSelectedZipQueueNode}
          isSelectedRegularTimerNode={isSelectedRegularTimerNode}
          isSelectedWorkflowTimerNode={isSelectedWorkflowTimerNode}
          isSelectedPolarsConverterNode={isSelectedPolarsConverterNode}
          isSelectedDuckDbNode={isSelectedDuckDbNode}
          isSelectedBigDataAnalystNode={isSelectedBigDataAnalystNode}
          isSelectedBigDataContainerNode={isSelectedBigDataContainerNode}
          isSelectedPdfExtractorNode={isSelectedPdfExtractorNode}
          deleteSelectedElements={deleteSelectedElements}
          updateSelectedNodeDataFields={updateSelectedNodeDataFields}
          setTableBuilderNodeId={setTableBuilderNodeId}
          setSampleBuilderNodeId={setSampleBuilderNodeId}
          setRubricBuilderNodeId={setRubricBuilderNodeId}
          isSelectedTimerNode={isSelectedTimerNode}
          isSelectedMarkItDownNode={isSelectedMarkItDownNode}
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

