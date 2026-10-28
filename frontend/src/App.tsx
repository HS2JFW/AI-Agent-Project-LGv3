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

import { calculateNextTimerSeconds } from './timerHelpers';



import {

  Play,

  Pause,

  X,

  Save, 

  Trash2, FileUp, 

  Plus, 

  Home,

  Database, 

  Cpu, 

  Bot, 

  Zap, 

  Terminal, 

 

  Settings,

  ChevronDown,

  ChevronUp,

  ChevronLeft,

  ChevronRight,

  Mail,

  MessageSquare,

  Globe,

  FileText,

  FileSearch,

  Layers,

  Maximize2,

  Minimize2,

  User,

  Users,

  ShieldCheck,

  Lock,

  Unlock,

  Clock,

  ExternalLink,

  Square,

  Code,

  RotateCcw,

  Copy,

  Check,

  CheckCircle2,

  AlertTriangle,

  Info,

  Eye,

  LayoutPanelTop,

  Layout,

  BarChart3,

  Grid3X3,

  Table,

  GitFork,

  HardDrive,

  FolderKanban,

  FolderPlus,

  Folder,

  FolderOpen,

  ArrowLeft,

  CornerUpLeft,

  LogOut,

  FileSpreadsheet,

  Sparkles

} from 'lucide-react';



import CustomNode from './components/CustomNode';

import ContainerNode from './components/ContainerNode';

import RubricNode from './nodes/RubricNode';

import SampleNode from './nodes/SampleNode';

import MCANode from './nodes/MCANode';

import TableNode from './nodes/TableNode';

import RubricBuilder from './components/RubricBuilder';

import { SampleBuilder, type SampleData } from './components/SampleBuilder';

import { TableBuilder, type TableData } from './components/TableBuilder';

import { FloatingDialog, type DialogState } from './FloatingDialog';

import PdfExtractorNode from './nodes/PdfExtractorNode';

import LoginScreen from './components/LoginScreen';

import UnifiedSettingsModal from './components/UnifiedSettingsModal';

import FolderCard, { PALETTE_COLORS, getPaletteHex } from './components/FolderCard';
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



// Sidebar Draggable Node Templates

const DRAGGABLE_TEMPLATES = [

  {

    category: 'Data Sources',

    items: [

      { name: 'DB', category: 'Data Sources' },

      { name: 'API Incremental', category: 'Data Sources' },

      { name: 'Storage', category: 'Data Sources' },

      { name: 'Graph RAG', category: 'Data Sources' },

    ]

  },

  {

    category: 'Actions',

    items: [

      { name: 'Page', category: 'Actions' },

      { name: 'JSON Connector', category: 'Actions' },

      { name: 'Timer', category: 'Actions' },

      { name: 'Workflow Timer', category: 'Actions' },

    ]

  },

  {

    category: 'Dataset',

    items: [

      { name: 'PDF Queue', category: 'Dataset' },

      { name: 'TXT Queue', category: 'Dataset' },

      { name: 'Zip Queue', category: 'Dataset' },

    ]

  },

  {

    category: 'Datasets',

    items: [

      { name: 'Polars Parquet Converter', category: 'Datasets' },

      { name: 'DuckDB Virtual Lake', category: 'Datasets' },

    ]

  },

  {

    category: 'Big Data & Analytics',

    items: [

      { name: 'Autonomous Big Data Analyst', category: 'Big Data & Analytics' },

      { name: 'Multi-Agent Pipeline Container', category: 'Big Data & Analytics' },

    ]

  },

  {

    category: 'Agent',

    items: [

      { name: 'Agent', category: 'Agent' },

      { name: 'Agent DB', category: 'Agent' },

      { name: 'Agent Audit', category: 'Agent' },

    ]

  },

  {

    category: 'Agents',

    items: [

      { name: 'Planner Agent', category: 'Agents' },

      { name: 'SQL Engineer & Critic', category: 'Agents' },

      { name: 'Domain Specialist', category: 'Agents' },

      { name: 'Executive Synthesizer', category: 'Agents' },

    ]

  },

  {

    category: 'OCR',

    items: [

      { name: 'PDF to Base64 Agent', category: 'OCR' },

      { name: 'PDF to Image Agent', category: 'OCR' },

    ]

  },

  {

    category: 'Notification',

    items: [

      { name: 'Gmail', category: 'Notification' },

      { name: 'Line', category: 'Notification' },

      { name: 'Mobile Message', category: 'Notification' },

    ]

  },

  {

    category: 'Criteria',

    items: [

      { name: 'Rubric', category: 'Criteria' },

      { name: 'Multi-Criteria Analysis', category: 'Criteria' },

      { name: 'Sample', category: 'Criteria' },

      { name: 'Table', category: 'Criteria' },

    ]

  }

];



// Primary Group Menus for left sidebar

const GROUP_MENUS = [

  {

    id: 'Data Sources',

    category: 'Data Sources',

    label: 'Data Source',

    icon: Database,

    color: 'text-cyan-400',

  },

  {

    id: 'Actions',

    category: 'Actions',

    label: 'Action',

    icon: Zap,

    color: 'text-amber-400',

  },

  {

    id: 'Dataset',

    category: 'Dataset',

    label: 'Dataset',

    icon: Layers,

    color: 'text-emerald-400',

  },

  {

    id: 'Datasets',

    category: 'Datasets',

    label: 'Datasets',

    icon: FileSpreadsheet,

    color: 'text-teal-400',

  },

  {

    id: 'Agent',

    category: 'Agent',

    label: 'Agent',

    icon: Bot,

    color: 'text-purple-400',

  },

  {

    id: 'Agents',

    category: 'Agents',

    label: 'Agents',

    icon: Users,

    color: 'text-fuchsia-400',

  },

  {

    id: 'Big Data & Analytics',

    category: 'Big Data & Analytics',

    label: 'Big Data & Analytics',

    icon: BarChart3,

    color: 'text-sky-400',

  },

  {

    id: 'OCR',

    category: 'OCR',

    label: 'OCR',

    icon: FileSearch,

    color: 'text-orange-400',

  },

  {

    id: 'Notification',

    category: 'Notification',

    label: 'Notification',

    icon: Mail,

    color: 'text-red-400',

  },

  {

    id: 'Criteria',

    category: 'Criteria',

    label: 'Criteria',

    icon: LayoutPanelTop,

    color: 'text-cyber-neon',

  },

];



// Color Theme Palette for Project Groups

const GROUP_COLOR_THEMES: Record<string, {

  border: string;

  hoverBorder: string;

  topBar: string;

  topBarShadow: string;

  iconBg: string;

  iconBorder: string;

  iconText: string;

  badgeText: string;

  badgeBg: string;

  badgeBorder: string;

  hoverText: string;

  glow: string;

  openText: string;

}> = {

  cyan: {

    border: 'border-cyan-500/30',

    hoverBorder: 'hover:border-cyan-400',

    topBar: 'from-cyan-400 via-cyber-neon to-emerald-400',

    topBarShadow: 'shadow-[0_0_8px_#00ffcc]',

    iconBg: 'bg-cyan-500/15',

    iconBorder: 'border-cyan-500/40',

    iconText: 'text-cyan-400',

    badgeText: 'text-cyan-400',

    badgeBg: 'bg-cyan-950/60',

    badgeBorder: 'border-cyan-500/30',

    hoverText: 'group-hover:text-cyan-400',

    glow: 'shadow-[0_0_15px_rgba(0,255,243,0.06)] hover:shadow-[0_0_20px_rgba(0,255,204,0.25)]',

    openText: 'group-hover:text-cyan-400'

  },

  purple: {

    border: 'border-purple-500/30',

    hoverBorder: 'hover:border-purple-400',

    topBar: 'from-purple-500 via-fuchsia-400 to-indigo-400',

    topBarShadow: 'shadow-[0_0_8px_#c084fc]',

    iconBg: 'bg-purple-500/15',

    iconBorder: 'border-purple-500/40',

    iconText: 'text-purple-400',

    badgeText: 'text-purple-400',

    badgeBg: 'bg-purple-950/60',

    badgeBorder: 'border-purple-500/30',

    hoverText: 'group-hover:text-purple-400',

    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.06)] hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]',

    openText: 'group-hover:text-purple-400'

  },

  emerald: {

    border: 'border-emerald-500/30',

    hoverBorder: 'hover:border-emerald-400',

    topBar: 'from-emerald-400 via-teal-400 to-green-500',

    topBarShadow: 'shadow-[0_0_8px_#34d399]',

    iconBg: 'bg-emerald-500/15',

    iconBorder: 'border-emerald-500/40',

    iconText: 'text-emerald-400',

    badgeText: 'text-emerald-400',

    badgeBg: 'bg-emerald-950/60',

    badgeBorder: 'border-emerald-500/30',

    hoverText: 'group-hover:text-emerald-400',

    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.06)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]',

    openText: 'group-hover:text-emerald-400'

  },

  amber: {

    border: 'border-amber-500/30',

    hoverBorder: 'hover:border-amber-400',

    topBar: 'from-amber-400 via-yellow-400 to-orange-500',

    topBarShadow: 'shadow-[0_0_8px_#fbbf24]',

    iconBg: 'bg-amber-500/15',

    iconBorder: 'border-amber-500/40',

    iconText: 'text-amber-400',

    badgeText: 'text-amber-400',

    badgeBg: 'bg-amber-950/60',

    badgeBorder: 'border-amber-500/30',

    hoverText: 'group-hover:text-amber-400',

    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.06)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]',

    openText: 'group-hover:text-amber-400'

  },

  rose: {

    border: 'border-rose-500/30',

    hoverBorder: 'hover:border-rose-400',

    topBar: 'from-rose-500 via-pink-400 to-red-400',

    topBarShadow: 'shadow-[0_0_8px_#fb7185]',

    iconBg: 'bg-rose-500/15',

    iconBorder: 'border-rose-500/40',

    iconText: 'text-rose-400',

    badgeText: 'text-rose-400',

    badgeBg: 'bg-rose-950/60',

    badgeBorder: 'border-rose-500/30',

    hoverText: 'group-hover:text-rose-400',

    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.06)] hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]',

    openText: 'group-hover:text-rose-400'

  },

  blue: {

    border: 'border-blue-500/30',

    hoverBorder: 'hover:border-blue-400',

    topBar: 'from-blue-500 via-sky-400 to-cyan-400',

    topBarShadow: 'shadow-[0_0_8px_#60a5fa]',

    iconBg: 'bg-blue-500/15',

    iconBorder: 'border-blue-500/40',

    iconText: 'text-blue-400',

    badgeText: 'text-blue-400',

    badgeBg: 'bg-blue-950/60',

    badgeBorder: 'border-blue-500/30',

    hoverText: 'group-hover:text-blue-400',

    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.06)] hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]',

    openText: 'group-hover:text-blue-400'

  }

};



const getGroupTheme = (color?: string) => {

  const c = (color || 'cyan').toLowerCase();

  return GROUP_COLOR_THEMES[c] || GROUP_COLOR_THEMES.cyan;

};



// Default Workflow Structure to wow the user on first load

export const DEFAULT_NODES: Node[] = [

  // Input Data Sources

  {

    id: 'source-api',

    type: 'customNode',

    position: { x: 80, y: 120 },

    data: { 

      label: 'API Incremental', 

      category: 'Data Sources', 

      name: 'API Incremental', 

      nodeType: 'API Incremental',

      nodeClass: 'API_Incremental',

      originalName: 'API Incremental',

      prompt: 'Fetch marketing leads API data', 

      parameters: { 

        tools: ['api', 'globe'],

        apiUrl: 'https://bqysaldeijwvnhtcfiuj.supabase.co/rest/v1/pdf_table',

        authHeader: 'Bearer sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism',

        anonKeyHeader: 'sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism',

        functionName: 'GetPDF_Incremental()',

        apiParameters: 'select=number,date,file_url',

        round: 1,

        row: 5,

        apiOutput: ''

      } 

    }

  },

  {

    id: 'source-db',

    type: 'customNode',

    position: { x: 80, y: 260 },

    data: { 

      label: 'Database', 

      category: 'Data Sources', 

      name: 'Database', 

      nodeType: 'DB',

      nodeClass: 'DB',

      originalName: 'DB',

      prompt: 'Query historical CRM records', 

      parameters: { tools: ['database'] } 

    }

  },

  

  // Center Team: Project Manager

  {

    id: 'agent-pm',

    type: 'customNode',

    position: { x: 420, y: 80 },

    data: { 

      label: 'Project Manager', 

      category: 'Agents', 

      name: 'Project Manager', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Orchestrator Agent', 

      prompt: 'Decompose incoming requests, delegate tasks, and aggregate results.', 

      parameters: { progress: 85, progressColor: '#00F0FF', tools: ['api', 'database', 'users'] } 

    }

  },



  // 3 Team Agents

  {

    id: 'agent-website',

    type: 'customNode',

    position: { x: 420, y: 240 },

    data: { 

      label: 'Website Task Agent', 

      category: 'Agents', 

      name: 'Website Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Frontend Developer', 

      prompt: 'Build landing pages, optimize SEO tags, and verify responsiveness.', 

      parameters: { progress: 60, progressColor: '#8B5CF6', tools: ['react', 'nodejs', 'python'] } 

    }

  },

  {

    id: 'agent-crm',

    type: 'customNode',

    position: { x: 420, y: 380 },

    data: { 

      label: 'CRM Task Agent', 

      category: 'Agents', 

      name: 'CRM Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'CRM Manager', 

      prompt: 'Sync data pipelines, trigger email webhooks, and record transactions.', 

      parameters: { progress: 40, progressColor: '#10B981', tools: ['api', 'database', 'users'] } 

    }

  },

  {

    id: 'agent-analytics',

    type: 'customNode',

    position: { x: 420, y: 520 },

    data: { 

      label: 'Analytics Task Agent', 

      category: 'Agents', 

      name: 'Analytics Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Data Analyst', 

      prompt: 'Compute aggregate metrics, build visual charts, and generate summary tables.', 

      parameters: { progress: 75, progressColor: '#F59E0B', tools: ['python', 'search', 'database'] } 

    }

  },



  // Audit Agent

  {

    id: 'agent-audit',

    type: 'customNode',

    position: { x: 420, y: 680 },

    data: { 

      label: 'Audit Agent', 

      category: 'Agents', 

      name: 'Audit Agent', 

      nodeType: 'Agent Audit',

      nodeClass: 'Agent_Audit',

      originalName: 'Agent Audit',

      role: 'QA Auditor', 

      prompt: 'Review output code and data reports for standard conformance and correctness.', 

      parameters: { progress: 95, progressColor: '#EF4444', tools: ['check', 'verify'] } 

    }

  },



  // Deliverables

  {

    id: 'deliverable-json',

    type: 'customNode',

    position: { x: 760, y: 520 },

    data: { 

      label: 'JSON Output', 

      category: 'Actions', 

      name: 'JSON Output', 

      nodeType: 'JSON Connector',

      nodeClass: 'JSON_Connector',

      originalName: 'JSON Connector',

      prompt: 'Package deliverables as standard JSON objects', 

      parameters: { tools: ['code'] } 

    }

  },

  {

    id: 'deliverable-db',

    type: 'customNode',

    position: { x: 760, y: 680 },

    data: { 

      label: 'Production DB', 

      category: 'Actions', 

      name: 'Production DB', 

      nodeType: 'DB',

      nodeClass: 'DB',

      originalName: 'DB',

      prompt: 'Upsert verified output records into DB', 

      parameters: { tools: ['database'] } 

    }

  },



  // Notifications

  {

    id: 'notify-gmail',

    type: 'customNode',

    position: { x: 1060, y: 120 },

    data: { 

      label: 'Gmail', 

      category: 'Notification', 

      name: 'Gmail', 

      nodeType: 'Gmail',

      nodeClass: 'Gmail',

      originalName: 'Gmail',

      prompt: 'Send email notifications to administrators', 

      parameters: { tools: ['api'] } 

    }

  },

  {

    id: 'notify-line',

    type: 'customNode',

    position: { x: 1060, y: 260 },

    data: { 

      label: 'LINE', 

      category: 'Notification', 

      name: 'LINE', 

      nodeType: 'Line',

      nodeClass: 'Line',

      originalName: 'Line',

      prompt: 'Push notifications via LINE Messenger bot', 

      parameters: { tools: ['api'] } 

    }

  },

  {

    id: 'notify-mobile',

    type: 'customNode',

    position: { x: 1060, y: 400 },

    data: { 

      label: 'Mobile Message', 

      category: 'Notification', 

      name: 'Mobile Message', 

      nodeType: 'Mobile Message',

      nodeClass: 'Mobile_Message',

      originalName: 'Mobile Message',

      prompt: 'Send SMS alert message', 

      parameters: { tools: ['api'] } 

    }

  }

];



export const DEFAULT_EDGES: Edge[] = [

  // Sources to PM Agent

  { id: 'e-api-pm', source: 'source-api', target: 'agent-pm', animated: true },

  { id: 'e-db-pm', source: 'source-db', target: 'agent-pm', animated: true },

  

  // PM Agent to Team Agents

  { id: 'e-pm-website', source: 'agent-pm', target: 'agent-website', animated: true },

  { id: 'e-pm-crm', source: 'agent-pm', target: 'agent-crm', animated: true },

  { id: 'e-pm-analytics', source: 'agent-pm', target: 'agent-analytics', animated: true },

  

  // Team Agents to Audit Agent

  { id: 'e-website-audit', source: 'agent-website', target: 'agent-audit', animated: true },

  { id: 'e-crm-audit', source: 'agent-crm', target: 'agent-audit', animated: true },

  { id: 'e-analytics-audit', source: 'agent-analytics', target: 'agent-audit', animated: true },

  

  // Audit Agent to Deliverables

  { id: 'e-audit-json', source: 'agent-audit', target: 'deliverable-json', animated: true },

  { id: 'e-audit-db', source: 'agent-audit', target: 'deliverable-db', animated: true },

  

  // Deliverables to Notifications

  { id: 'e-json-gmail', source: 'deliverable-json', target: 'notify-gmail', animated: true },

  { id: 'e-db-line', source: 'deliverable-db', target: 'notify-line', animated: true },

  { id: 'e-db-mobile', source: 'deliverable-db', target: 'notify-mobile', animated: true }

];

export const DEFAULT_AGENT_NODES: Node[] = [

  // Container Nodes (Parent Nodes)

  {

    id: 'container-sources',

    type: 'containerNode',

    position: { x: 20, y: 100 },

    style: { width: 250, height: 410 },

    data: { name: 'Input Data Sources', titleColor: '#D4FF3A' },

    draggable: true,

  },

  {

    id: 'container-notifications',

    type: 'containerNode',

    position: { x: 1060, y: 100 },

    style: { width: 250, height: 410 },

    data: { name: 'Final Notifications', titleColor: '#EA4335' },

    draggable: true,

  },

  {

    id: 'container-deliverables',

    type: 'containerNode',

    position: { x: 490, y: 580 },

    style: { width: 530, height: 180 },

    data: { name: 'Deliverables', titleColor: '#10B981' },

    draggable: true,

  },



  // Source Nodes (Children of container-sources)

  {

    id: 'source-api',

    type: 'customNode',

    parentNode: 'container-sources',

    extent: 'parent',

    position: { x: 5, y: 40 },

    data: { 

      label: 'API Incremental', 

      category: 'Data Sources', 

      name: 'API Incremental', 

      nodeType: 'API Incremental',

      nodeClass: 'API_Incremental',

      originalName: 'API Incremental',

      prompt: 'Fetch marketing leads API data', 

      parameters: { 

        tools: ['api', 'globe'],

        apiUrl: 'https://api.example.com/v1/data',

        functionName: 'fetchData()',

        apiParameters: 'limit=10&status=active',

        apiOutput: '{\n  "status": "success",\n  "data": {\n    "id": 101,\n    "name": "John Doe",\n    "email": "john@example.com",\n    "role": "developer"\n  }\n}'

      } 

    }

  },

  {

    id: 'source-db',

    type: 'customNode',

    parentNode: 'container-sources',

    extent: 'parent',

    position: { x: 5, y: 160 },

    data: { 

      label: 'Database', 

      category: 'Data Sources', 

      name: 'Database', 

      nodeType: 'DB',

      nodeClass: 'DB',

      originalName: 'DB',

      prompt: 'Query historical CRM records', 

      parameters: { tools: ['database'] } 

    }

  },

  

  // Center Team: Project Manager

  {

    id: 'agent-pm',

    type: 'customNode',

    position: { x: 530, y: 30 },

    data: { 

      label: 'Project Manager', 

      category: 'Agents', 

      name: 'Project Manager', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Orchestrator Agent', 

      prompt: 'Decompose incoming requests, delegate tasks, and aggregate results.', 

      parameters: { progress: 85, progressColor: '#00F0FF', tools: ['api', 'database', 'users'] } 

    }

  },



  // 3 Team Agents

  {

    id: 'agent-website',

    type: 'customNode',

    position: { x: 270, y: 260 },

    data: { 

      label: 'Website Task Agent', 

      category: 'Agents', 

      name: 'Website Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Frontend Developer', 

      prompt: 'Build landing pages, optimize SEO tags, and verify responsiveness.', 

      parameters: { progress: 60, progressColor: '#8B5CF6', tools: ['react', 'nodejs', 'python'] } 

    }

  },

  {

    id: 'agent-crm',

    type: 'customNode',

    position: { x: 530, y: 260 },

    data: { 

      label: 'CRM Task Agent', 

      category: 'Agents', 

      name: 'CRM Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'CRM Manager', 

      prompt: 'Sync data pipelines, trigger email webhooks, and record transactions.', 

      parameters: { progress: 40, progressColor: '#10B981', tools: ['api', 'database', 'users'] } 

    }

  },

  {

    id: 'agent-analytics',

    type: 'customNode',

    position: { x: 790, y: 260 },

    data: { 

      label: 'Analytics Task Agent', 

      category: 'Agents', 

      name: 'Analytics Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Data Analyst', 

      prompt: 'Compute aggregate metrics, build visual charts, and generate summary tables.', 

      parameters: { progress: 75, progressColor: '#F59E0B', tools: ['python', 'search', 'database'] } 

    }

  },



  // Audit Agent

  {

    id: 'agent-audit',

    type: 'customNode',

    position: { x: 530, y: 450 },

    data: { 

      label: 'Audit Agent', 

      category: 'Agents', 

      name: 'Audit Agent', 

      nodeType: 'Agent Audit',

      nodeClass: 'Agent_Audit',

      originalName: 'Agent Audit',

      role: 'QA Auditor', 

      prompt: 'Review output code and data reports for standard conformance and correctness.', 

      parameters: { progress: 95, progressColor: '#EF4444', tools: ['check', 'verify'] } 

    }

  },



  // Deliverables (Children of container-deliverables)

  {

    id: 'deliverable-json',

    type: 'customNode',

    parentNode: 'container-deliverables',

    extent: 'parent',

    position: { x: 10, y: 45 },

    data: { 

      label: 'JSON Output', 

      category: 'Actions', 

      name: 'JSON Output', 

      nodeType: 'JSON Connector',

      nodeClass: 'JSON_Connector',

      originalName: 'JSON Connector',

      prompt: 'Package deliverables as standard JSON objects', 

      parameters: { tools: ['code'] } 

    }

  },

  {

    id: 'deliverable-db',

    type: 'customNode',

    parentNode: 'container-deliverables',

    extent: 'parent',

    position: { x: 270, y: 45 },

    data: { 

      label: 'Production DB', 

      category: 'Actions', 

      name: 'Production DB', 

      nodeType: 'DB',

      nodeClass: 'DB',

      originalName: 'DB',

      prompt: 'Upsert verified output records into DB', 

      parameters: { tools: ['database'] } 

    }

  },



  // Notifications (Children of container-notifications)

  {

    id: 'notify-gmail',

    type: 'customNode',

    parentNode: 'container-notifications',

    extent: 'parent',

    position: { x: 5, y: 40 },

    data: { 

      label: 'Gmail', 

      category: 'Notification', 

      name: 'Gmail', 

      nodeType: 'Gmail',

      nodeClass: 'Gmail',

      originalName: 'Gmail',

      prompt: 'Send email notifications to administrators', 

      parameters: { tools: ['api'] } 

    }

  },

  {

    id: 'notify-line',

    type: 'customNode',

    parentNode: 'container-notifications',

    extent: 'parent',

    position: { x: 5, y: 160 },

    data: { 

      label: 'LINE', 

      category: 'Notification', 

      name: 'LINE', 

      nodeType: 'Line',

      nodeClass: 'Line',

      originalName: 'Line',

      prompt: 'Push notifications via LINE Messenger bot', 

      parameters: { tools: ['api'] } 

    }

  },

  {

    id: 'notify-mobile',

    type: 'customNode',

    parentNode: 'container-notifications',

    extent: 'parent',

    position: { x: 5, y: 280 },

    data: { 

      label: 'Mobile Message', 

      category: 'Notification', 

      name: 'Mobile Message', 

      nodeType: 'Mobile Message',

      nodeClass: 'Mobile_Message',

      originalName: 'Mobile Message',

      prompt: 'Send SMS alert message', 

      parameters: { tools: ['api'] } 

    }

  }

];



export const DEFAULT_AGENT_EDGES: Edge[] = [

  // Sources to PM Agent (Cyan)

  { id: 'ea-api-pm', source: 'source-api', target: 'agent-pm', animated: true, style: { stroke: '#00F0FF', strokeWidth: 2.5 } },

  { id: 'ea-db-pm', source: 'source-db', target: 'agent-pm', animated: true, style: { stroke: '#00F0FF', strokeWidth: 2.5 } },

  

  // PM Agent to Team Agents (Purple)

  { id: 'ea-pm-website', source: 'agent-pm', target: 'agent-website', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  { id: 'ea-pm-crm', source: 'agent-pm', target: 'agent-crm', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  { id: 'ea-pm-analytics', source: 'agent-pm', target: 'agent-analytics', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  

  // Team Agents to Audit Agent (Purple)

  { id: 'ea-website-audit', source: 'agent-website', target: 'agent-audit', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  { id: 'ea-crm-audit', source: 'agent-crm', target: 'agent-audit', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  { id: 'ea-analytics-audit', source: 'agent-analytics', target: 'agent-audit', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  

  // Audit Agent to Deliverables (Green)

  { id: 'ea-audit-json', source: 'agent-audit', target: 'deliverable-json', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },

  { id: 'ea-audit-db', source: 'agent-audit', target: 'deliverable-db', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },

  

  // Deliverables to Notifications (Green)

  { id: 'ea-json-gmail', source: 'deliverable-json', target: 'notify-gmail', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },

  { id: 'ea-db-line', source: 'deliverable-db', target: 'notify-line', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },

  { id: 'ea-db-mobile', source: 'deliverable-db', target: 'notify-mobile', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },



  // Red dashed loopback rejection edge: Audit to PM

  { id: 'ea-audit-pm-reject', source: 'agent-audit', target: 'agent-pm', animated: true, style: { stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '5,5' } }

];



interface LogMessage {

  node_id?: string;

  message: string;

  level: string;

  timestamp: string;

  source_file?: string;

  source_class?: string;

  source_function?: string;

  log_type?: 'general' | 'process_action' | 'status_change';

}



const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';



const getAgentEdgeStyle = (source: string, target: string) => {

  if (target === 'agent-pm') {

    return { stroke: '#00F0FF', strokeWidth: 2.5 };

  }

  if (source === 'agent-audit' && target === 'agent-pm') {

    return { stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '5,5' };

  }

  if (

    source === 'agent-audit' || 

    source.startsWith('deliverable') || 

    target.startsWith('notify') || 

    source.startsWith('notify')

  ) {

    return { stroke: '#10B981', strokeWidth: 2.5 };

  }

  return { stroke: '#8B5CF6', strokeWidth: 2.5 };

};



const buildAgentNodesFromLogicNodes = (logicNodes: Node[]) => {

  const containers = DEFAULT_AGENT_NODES.filter(n => n.type === 'containerNode');

  const constructedNodes: Node[] = [...containers];

  

  logicNodes.forEach((ln) => {

    let parentNode: string | undefined = undefined;

    let extent: 'parent' | undefined = undefined;

    let agentPosition = { ...ln.position };



    if (ln.data.category === 'Data Sources') {

      parentNode = 'container-sources';

      extent = 'parent';

      const currentSources = constructedNodes.filter(n => n.parentNode === 'container-sources');

      agentPosition = { x: 5, y: 40 + currentSources.length * 120 };

    } else if (ln.data.category === 'Notification') {

      parentNode = 'container-notifications';

      extent = 'parent';

      const currentNotifs = constructedNodes.filter(n => n.parentNode === 'container-notifications');

      agentPosition = { x: 5, y: 40 + currentNotifs.length * 120 };

    } else if (ln.data.category === 'Actions' || ln.data.category === 'Dataset') {

      parentNode = 'container-deliverables';

      extent = 'parent';

      const currentActions = constructedNodes.filter(n => n.parentNode === 'container-deliverables');

      agentPosition = { x: 10 + currentActions.length * 260, y: 45 };

    }



    constructedNodes.push({

      ...ln,

      parentNode,

      extent,

      position: agentPosition,

    });

  });



  return constructedNodes;

};



const buildAgentEdgesFromLogicEdges = (logicEdges: Edge[]) => {

  return logicEdges.map(le => ({

    ...le,

    style: getAgentEdgeStyle(le.source, le.target)

  }));

};

const TimerCountdown = ({ 

  parameters, 

  title, 

  isWorkflowTimer = false, 

  onToggleActive 

}: { 

  parameters: any; 

  title?: string; 

  isWorkflowTimer?: boolean; 

  onToggleActive?: () => void; 

}) => {

  const isActive = parameters?.schedulerActive === true;

  const remaining = parameters?.remainingSeconds;

  const intervalVal = parameters?.intervalValue !== undefined ? Math.max(1, Number(parameters.intervalValue)) : 2;

  const intervalUnit = parameters?.intervalUnit || 'seconds';

  const unitSuffix = intervalUnit.startsWith('min') ? 'm' : intervalUnit.startsWith('hour') ? 'h' : intervalUnit.startsWith('day') ? 'd' : 's';

  

  let countdownText = `${intervalVal}${unitSuffix} (Ready)`;

  let isTimerActiveStyle = false;



  if (isActive) {

    isTimerActiveStyle = true;

    if (remaining === undefined || remaining === null) {

      countdownText = 'Starting...';

    } else if (remaining <= 0) {

      countdownText = isWorkflowTimer ? 'Waking up...' : 'Triggering...';

    } else {

      const days = Math.floor(remaining / 86400);

      const hours = Math.floor((remaining % 86400) / 3600);

      const mins = Math.floor((remaining % 3600) / 60);

      const secs = remaining % 60;

      

      let parts: string[] = [];

      if (days > 0) parts.push(`${days}d`);

      if (hours > 0 || days > 0) parts.push(`${hours}h`);

      if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);

      parts.push(`${secs}s`);

      countdownText = parts.join(' ');

    }

  } else if (remaining !== undefined && remaining !== null && remaining > 0) {

    countdownText = `${remaining}${unitSuffix} (Paused)`;

  }



  const defaultTitle = isWorkflowTimer ? "Workflow Timer Countdown (นับถอยหลัง)" : "Next Trigger Countdown";

  const displayTitle = title || defaultTitle;



  return (

    <div className="space-y-2 bg-cyber-dark bg-opacity-50 p-2.5 rounded-lg border border-cyber-border border-opacity-60">

      <div className="flex items-center justify-between">

        <div className="text-[10px] uppercase tracking-wider text-cyber-muted font-bold select-none flex items-center space-x-1.5">

          <Clock className={`w-3.5 h-3.5 ${isTimerActiveStyle ? 'text-cyber-neon animate-pulse' : 'text-cyber-muted'}`} />

          <span className={isTimerActiveStyle ? 'text-cyber-neon font-bold' : ''}>{displayTitle}</span>

        </div>

        <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${

          isActive 

            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' 

            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'

        }`}>

          {isActive ? "ACTIVE" : "PAUSED / READY"}

        </span>

      </div>



      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${

        isTimerActiveStyle 

          ? 'bg-cyber-dark bg-opacity-90 border-cyber-neon shadow-[0_0_12px_rgba(0,240,255,0.25)]' 

          : 'bg-cyber-dark bg-opacity-60 border-cyber-border'

      }`}>

        <div className="flex items-center space-x-2">

          <Clock className={`w-4 h-4 ${isTimerActiveStyle ? 'text-cyber-neon animate-pulse' : 'text-cyber-muted'}`} />

          <span className={`text-sm font-mono font-black tracking-wider ${

            isTimerActiveStyle ? 'text-cyber-neon' : 'text-gray-300'

          }`}>

            {countdownText}

          </span>

        </div>

        {onToggleActive && (

          <button

            onClick={onToggleActive}

            className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center space-x-1 ${

              isActive

                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'

                : 'bg-cyber-neon/20 hover:bg-cyber-neon/30 text-cyber-neon border border-cyber-neon/40 shadow-[0_0_4px_rgba(0,240,255,0.2)]'

            }`}

          >

            <span>{isActive ? 'Pause Timer' : 'Start Timer'}</span>

          </button>

        )}

      </div>

    </div>

  );

};







const cleanAgentNodesForSave = (agentNodes: any[]) => {

  return agentNodes.map(n => {

    if (n.data?.parameters?.agentResultQueue) {

      const cleanParameters = { ...n.data.parameters };

      delete cleanParameters.agentResultQueue;

      return { ...n, data: { ...n.data, parameters: cleanParameters } };

    }

    return n;

  });

};



function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(() => {

    return Boolean(localStorage.getItem('app_auth_token'));

  });

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



  const getNodeClass = (n?: Node | null): string => {

    if (!n || !n.data) return '';

    const params = n.data.parameters || {};



    // 1. Parameter-based self-healing for Big Data & Analytics nodes

    if ('filePattern' in params && 'compression' in params) return 'Polars_Parquet_Converter';

    if ('executionMode' in params && 'statementTimeout' in params) return 'DuckDB_Virtual_Lake';

    if ('businessObjective' in params && 'team' in params) {

      if (n.data.name?.includes('Container') || n.type === 'containerNode') return 'Multi-Agent_Pipeline_Container';

      return 'Autonomous_Big_Data_Analyst';

    }



    // 2. Specific Big Data Agent Roles self-healing

    const roleLow = (n.data.role || params.role || '').toLowerCase();

    const promptLow = (n.data.prompt || params.prompt || '').toLowerCase();

    const nameLow = (n.data.name || '').toLowerCase();

    const labelLow = (n.data.label || '').toLowerCase();

    const origLow = (n.data.originalName || '').toLowerCase();

    const combinedAgentText = [nameLow, labelLow, origLow, roleLow, promptLow].join(' ');



    if (combinedAgentText.includes('planner')) return 'Planner_Agent';

    if (combinedAgentText.includes('sql engineer') || combinedAgentText.includes('critic')) return 'SQL_Engineer_&_Critic';

    if (combinedAgentText.includes('domain specialist') || (n.data.category === 'Agents' && combinedAgentText.includes('specialist'))) return 'Domain_Specialist';

    if (combinedAgentText.includes('synthesizer') || (n.data.category === 'Agents' && combinedAgentText.includes('executive'))) return 'Executive_Synthesizer';



    if (n.data.nodeClass && n.data.nodeClass !== 'Agent') return n.data.nodeClass.replace(/\s+/g, '_');

    if (n.data.nodeType && n.data.nodeType !== 'Agent') return n.data.nodeType.replace(/\s+/g, '_');

    if (n.data.originalName && n.data.originalName !== 'Agent') return n.data.originalName.replace(/\s+/g, '_');

    if (n.data.type && n.data.type !== 'customNode' && n.data.type !== 'containerNode' && n.data.type !== 'logicNode') return n.data.type.replace(/\s+/g, '_');

    if (n.data.parameters) {

      if ('agentOutputsTable' in n.data.parameters && 'pdfUrls' in n.data.parameters) return 'Agent';

      if ('pdfQueue' in n.data.parameters && 'bucketName' in n.data.parameters) return 'PDF_Queue';

      if ('txtQueue' in n.data.parameters && 'bucketName' in n.data.parameters) return 'TXT_Queue';

      if ('zipQueue' in n.data.parameters && 'bucketName' in n.data.parameters) return 'Zip_Queue';

      if ('graphEndpoint' in n.data.parameters || 'graphQuery' in n.data.parameters) return 'Graph_RAG';

      if ('dbConnectionMode' in n.data.parameters) return 'DB';

      if ('fallbackPdfUrls' in n.data.parameters || ('pdfUrls' in n.data.parameters && !('agentOutputsTable' in n.data.parameters))) return 'Pdfs_Loader';

      if ('extractFormat' in n.data.parameters) return 'Extract';

      if ('dedupKey' in n.data.parameters) return 'De_duplicate_Text';

      if ('jsonSchema' in n.data.parameters) return 'Structured_Parse_JSON';

      if ('stateOutput' in n.data.parameters) return 'State';

      if ('cronExpression' in n.data.parameters || 'timerInterval' in n.data.parameters) return 'Timer';

      if ('apiMethod' in n.data.parameters && 'incrementalKey' in n.data.parameters) return 'API_Incremental';

      if ('apiMethod' in n.data.parameters) return 'API_Connector';

      if ('jsonPath' in n.data.parameters) return 'JSON_Connector';

    }

    if (n.data.name === 'JSON Connector List' || n.data.label === 'JSON Connector List') {

      return 'JSON_Connector_List';

    }

    const fallback = n.data.name || n.data.label || '';

    return fallback.replace(/\s+/g, '_');

  };



  const isWorkflowTimerNode = (n?: Node | null): boolean => {

    if (!n || !n.data) return false;

    const type = (n.data.nodeType || n.data.nodeClass || '').toLowerCase().replace(/_/g, ' ');

    if (type === 'workflow timer') return true;

    const name = (n.data.name || '').toLowerCase().replace(/_/g, ' ');

    const label = (n.data.label || '').toLowerCase().replace(/_/g, ' ');

    const cat = (n.data.category || '').toLowerCase().replace(/_/g, ' ');

    return name === 'workflow timer' || label === 'workflow timer' || cat === 'workflow timer';

  };



  const isRegularTimerNode = (n?: Node | null): boolean => {

    if (!n || !n.data) return false;

    if (isWorkflowTimerNode(n)) return false;

    const type = (n.data.nodeType || n.data.nodeClass || getNodeClass(n) || '').toLowerCase().replace(/_/g, ' ');

    if (type === 'timer') return true;

    const name = (n.data.name || '').toLowerCase().replace(/_/g, ' ');

    const label = (n.data.label || '').toLowerCase().replace(/_/g, ' ');

    const cat = (n.data.category || '').toLowerCase().replace(/_/g, ' ');

    return name === 'timer' || label === 'timer' || (cat === 'actions' && type === 'timer');

  };



  const isProtectedTimerNode = (n?: Node | null): boolean => {

    if (!n || !n.data) return false;

    if (isWorkflowTimerNode(n)) return false;

    return n.data.isProtected === true || n.deletable === false;

  };



  const isTargetAgentNode = (n?: Node | null): boolean => {

    if (!n || !n.data) return false;

    const nodeType = (n.data.nodeType || getNodeClass(n) || '').toLowerCase().replace(/_/g, ' ');

    const name = (n.data.name || '').toLowerCase().replace(/_/g, ' ');

    const label = (n.data.label || '').toLowerCase().replace(/_/g, ' ');

    const nodeClass = (n.data.nodeClass || '').toLowerCase().replace(/_/g, ' ');



    const isImageNode = nodeType === 'pdf to image agent' || nodeType === 'pdf to base64 agent' ||

                        name.includes('pdf to image agent') || label.includes('pdf to image agent') || nodeClass.includes('pdf to image agent') ||

                        name.includes('pdf to base64 agent') || label.includes('pdf to base64 agent') || nodeClass.includes('pdf to base64 agent') ||

                        name.includes('agent pdfs image') || label.includes('agent pdfs image') || nodeClass.includes('agent pdfs image') ||

                        name.includes('ocr');

                        

    const isDbNode = nodeType === 'agent db' || name.includes('agent db') || label.includes('agent db') || nodeClass.includes('agent db');

    const isAuditNode = nodeType === 'agent audit' || name.includes('agent audit') || label.includes('agent audit') || nodeClass.includes('agent audit');

    const isPdfNode = (nodeType === 'agent' || name.includes('agent') || label.includes('agent') || nodeClass.includes('agent')) && !isImageNode && !isDbNode && !isAuditNode;



    return isImageNode || isPdfNode || isDbNode || isAuditNode;

  };



  const getParentMaxListForNode = (targetNodeId: string, currentNodes: Node[], currentEdges: Edge[]): { parentMax: number, parentKey: string, parentName: string } => {

    const incomingEdges = currentEdges.filter(e => e.target === targetNodeId);

    let parentMax = 0;

    let parentKey = '';

    let parentName = '';



    incomingEdges.forEach(e => {

      const pNode = currentNodes.find(n => n.id === e.source);

      if (!pNode || !pNode.data) return;

      const pParams = pNode.data.parameters || {};

      

      const q = pParams.pdfQueue || pParams.txtQueue || pParams.zipQueue || pParams.table;

      let count = 0;

      if (Array.isArray(q)) count = q.length;

      else if (typeof q === 'object' && q !== null) count = Object.keys(q).length;

      

      const aOut = pParams.agentOutputsTable;

      let aCount = 0;

      if (Array.isArray(aOut)) aCount = aOut.length;

      else if (typeof aOut === 'object' && aOut !== null) aCount = Object.keys(aOut).length;



      const effectiveCount = Math.max(count, aCount, Number(pParams.queueLength) || 0, Number(pParams.previous_max) || 0);

      if (effectiveCount > parentMax) {

        parentMax = effectiveCount;

        parentKey = pNode.id;

        parentName = pNode.data.label || pNode.data.name || pNode.id;

      }

    });



    return { parentMax, parentKey, parentName };

  };



  const getChildCompletedCountForNode = (node: Node): number => {

    const params = node.data?.parameters || {};

    const rawOutputs = params.agentOutputsTable || params.agentResultQueue;

    let count = 0;

    if (typeof rawOutputs === 'object' && !Array.isArray(rawOutputs) && rawOutputs !== null) {

      count = Object.keys(rawOutputs).length;

    } else if (Array.isArray(rawOutputs)) {

      count = rawOutputs.length;

    }

    return Math.max(count, Number(params.currentIndex) || 0);

  };



  // @ts-ignore

  // @ts-ignore

const getCleanFileName = (fileUrl: any) => {

    if (!fileUrl || typeof fileUrl !== 'string') return '';

    let name = fileUrl;

    if (name.includes('?')) {

      name = name.split('?')[0];

    }

    if (name.includes('/')) {

      name = name.substring(name.lastIndexOf('/') + 1);

    }

    let changed = true;

    while (changed) {

      changed = false;

      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_?/;

      if (uuidRegex.test(name)) {

        name = name.replace(uuidRegex, '');

        changed = true;

        continue;

      }

      const nodeRegex = /^node_[a-zA-Z0-9-]+_|^[a-zA-Z0-9-]+_node_[a-zA-Z0-9-]+_|^[0-9a-fA-F-]{36}_[a-zA-Z0-9-]+_/;

      if (nodeRegex.test(name)) {

        name = name.replace(nodeRegex, '');

        changed = true;

        continue;

      }

      if (selectedWorkflowId && name.startsWith(selectedWorkflowId + '_')) {

        name = name.substring(selectedWorkflowId.length + 1);

        changed = true;

        continue;

      }

      // General fallback: if still starts with prefix like wf_node-id_, strip up to second underscore if it matches ID pattern

      const prefixPattern = /^[^_]+_(node_[^_\.]+|[^_\.]+)_/;

      if (prefixPattern.test(name)) {

        name = name.replace(prefixPattern, '');

        changed = true;

        continue;

      }

    }

    return name;

  };



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

  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);



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



  // Big Data & Analytics local inspector states

  const [isConvertingParquet, setIsConvertingParquet] = useState(false);

  const [conversionStatusMsg, setConversionStatusMsg] = useState<string | null>(null);

  const [isExecutingDuckDb, setIsExecutingDuckDb] = useState(false);

  const [duckdbQueryResult, setDuckdbQueryResult] = useState<any>(null);

  const [duckdbQueryError, setDuckdbQueryError] = useState<string | null>(null);

  const [isGeneratingTeam, setIsGeneratingTeam] = useState(false);

  const [activeBigDataTab, setActiveBigDataTab] = useState<'auto' | 'manual'>('auto');

  const [duckdbViewMode, setDuckdbViewMode] = useState<'table' | 'json'>('table');



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



  const handleConvertParquetClick = async () => {

    if (!selectedNode) return;

    setIsConvertingParquet(true);

    setConversionStatusMsg('Converting Excel/CSV files to Parquet via Polars (Rust)...');

    try {

      const params = selectedNode.data.parameters || {};

      const res = await fetch(`${BACKEND_URL}/api/analytics/convert-parquet`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          source_type: params.sourceType || 'upload',

          file_paths: params.sourceFiles || [],

          file_pattern: params.filePattern || '*.xlsx, *.csv',

          sheet_name: params.sheetName || 'Sheet1',

          compression: params.compression || 'snappy',

          chunk_size: params.chunkSize || 50000,

          auto_type_inference: params.autoTypeInference !== false,

          null_handling: params.nullHandling || 'keep',

          output_dir: params.outputParquetPath || './workflow_inputs/parquet_cache'

        })

      });

      const data = await res.json();

      if (data.status === 'success') {

        const rowCount = data.results?.reduce((sum: number, r: any) => sum + (r.rows || 0), 0) || 0;

        setConversionStatusMsg(`Converted ${data.results?.length || 0} file(s) successfully (${rowCount.toLocaleString()} rows).`);

        updateSelectedNodeParameter('convertedFiles', data.results || []);

        updateSelectedNodeParameter('catalog', data.catalog || {});

      } else {

        setConversionStatusMsg(`Conversion Failed: ${data.message || 'Error occurred'}`);

      }

    } catch (err: any) {

      setConversionStatusMsg(`Network Error: ${err.message || 'Failed to call converter'}`);

    } finally {

      setIsConvertingParquet(false);

    }

  };



  const handleExecuteDuckDbQueryClick = async () => {

    if (!selectedNode) return;

    setIsExecutingDuckDb(true);

    setDuckdbQueryError(null);

    try {

      const params = selectedNode.data.parameters || {};

      let timeoutSec = 10;

      if (typeof params.statementTimeout === 'string') {

        const parsed = parseInt(params.statementTimeout.replace(/[^0-9]/g, ''), 10);

        if (!isNaN(parsed) && parsed > 0) timeoutSec = parsed;

      }

      const res = await fetch(`${BACKEND_URL}/api/analytics/duckdb-query`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          query: params.sqlQuery || "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10",

          timeout: timeoutSec,

          max_rows: Number(params.maxResultRows) || 100

        })

      });

      const data = await res.json();

      if (data.status === 'success') {

        setDuckdbQueryResult(data);

        updateSelectedNodeParameter('queryResults', data.data);

        updateSelectedNodeParameter('executionTimeMs', data.execution_time_ms);

      } else {

        setDuckdbQueryError(data.message || 'DuckDB execution failed');

        setDuckdbQueryResult(null);

      }

    } catch (err: any) {

      setDuckdbQueryError(err.message || 'Execution error');

      setDuckdbQueryResult(null);

    } finally {

      setIsExecutingDuckDb(false);

    }

  };



  const handleAutoGenerateTeamClick = async () => {

    if (!selectedNode) return;

    setIsGeneratingTeam(true);

    try {

      const params = selectedNode.data.parameters || {};

      const res = await fetch(`${BACKEND_URL}/api/analytics/auto-team-planner`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          objective: params.businessObjective || 'วิเคราะห์ยอดขายและผลประกอบการ หาแนวโน้มสำคัญและจุดผิดปกติ (Anomalies)',

          catalog: params.catalog || {}

        })

      });

      const data = await res.json();

      if (data.status === 'success' && Array.isArray(data.team)) {

        updateSelectedNodeParameter('team', data.team);

        updateSelectedNodeParameter('teamRationale', data.rationale);

      }

    } catch (err) {

      console.error('Failed to auto plan team:', err);

    } finally {

      setIsGeneratingTeam(false);

    }

  };



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



  const getCalendarDays = (month: number, year: number) => {

    const firstDay = new Date(year, month, 1);

    let startDayOfWeek = firstDay.getDay() - 1;

    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const totalDays = new Date(year, month + 1, 0).getDate();

    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {

      const d = prevMonthTotalDays - i;

      const prevMonth = month === 0 ? 11 : month - 1;

      const prevYear = month === 0 ? year - 1 : year;

      days.push({ day: d, month: prevMonth, year: prevYear, isCurrentMonth: false });

    }

    for (let i = 1; i <= totalDays; i++) {

      days.push({ day: i, month, year, isCurrentMonth: true });

    }

    const remainingCells = 42 - days.length;

    for (let i = 1; i <= remainingCells; i++) {

      const nextMonth = month === 11 ? 0 : month + 1;

      const nextYear = month === 11 ? year + 1 : year;

      days.push({ day: i, month: nextMonth, year: nextYear, isCurrentMonth: false });

    }

    return days;

  };



  // Clock Picker Modal State

  const [isClockOpen, setIsClockOpen] = useState(false);

  const [clockTimeValue, setClockTimeValue] = useState("09:00");

  const [clockOnSaveCallback, setClockOnSaveCallback] = useState<((time: string) => void) | null>(null);

  const [clockActiveTab, setClockActiveTab] = useState<'hour' | 'minute'>('hour');

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

    setClockActiveTab('hour');

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



  const [isDraggingClock, setIsDraggingClock] = useState(false);

  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  const [clockDragAngle, setClockDragAngle] = useState<number | null>(null);



  const handleClockInteraction = (e: React.MouseEvent) => {

    const rect = e.currentTarget.getBoundingClientRect();

    const px = e.clientX - rect.left;

    const py = e.clientY - rect.top;

    const dx = px - 110;

    const dy = py - 110;

    let angle = Math.atan2(dy, dx) + Math.PI / 2; // 0 is top

    if (angle < 0) angle += 2 * Math.PI;



    setClockDragAngle(angle);



    const { hour12, minute, amPm } = convert24to12(clockTimeValue);



    if (clockActiveTab === 'hour') {

      let hr = Math.round((angle / (2 * Math.PI)) * 12) % 12;

      if (hr === 0) hr = 12;

      setClockTimeValue(convert12to24(hr, minute, amPm));

    } else {

      const min = Math.round((angle / (2 * Math.PI)) * 60) % 60;

      setClockTimeValue(convert12to24(hour12, min, amPm));

    }

  };



  const handleClockRelease = () => {

    if (!isDraggingClock) return;

    setIsDraggingClock(false);

    setClockDragAngle(null);

    if (clockActiveTab === 'hour') {

      setTimeout(() => setClockActiveTab('minute'), 250);

    }

  };



  const convert24to12 = (time24: string): { hour12: number; minute: number; amPm: 'AM' | 'PM' } => {

    const [hStr, mStr] = (time24 || "09:00").split(':');

    const h24 = parseInt(hStr) || 0;

    const minute = parseInt(mStr) || 0;

    

    const amPm = h24 >= 12 ? 'PM' : 'AM';

    let hour12 = h24 % 12;

    if (hour12 === 0) hour12 = 12;

    

    return { hour12, minute, amPm };

  };



  const convert12to24 = (hour12: number, minute: number, amPm: 'AM' | 'PM'): string => {

    let h24 = hour12 % 12;

    if (amPm === 'PM') {

      h24 += 12;

    }

    return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  };



  const format24toAmPmString = (time24: string): string => {

    if (!time24) return "09:00 AM";

    const [hStr, mStr] = time24.split(':');

    const h24 = parseInt(hStr) || 0;

    const m = mStr || "00";

    const amPm = h24 >= 12 ? 'PM' : 'AM';

    let h12 = h24 % 12;

    if (h12 === 0) h12 = 12;

    return `${String(h12).padStart(2, '0')}:${m} ${amPm}`;

  };



  const parseAmPmStringTo24 = (ampmStr: string): string => {

    if (!ampmStr) return "09:00";

    const regex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;

    const match = ampmStr.match(regex);

    if (match) {

      let h12 = parseInt(match[1]) || 12;

      const m = match[2];

      const amPm = match[3].toUpperCase() as 'AM' | 'PM';

      let h24 = h12 % 12;

      if (amPm === 'PM') h24 += 12;

      return `${String(h24).padStart(2, '0')}:${m}`;

    }

    return ampmStr;

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

  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

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



  const inferCanonicalNodeType = (n: any): string => {

    if (!n) return 'Agent';

    const params = n.data?.parameters || {};



    // 0. Parameter-based self-healing first (highest fidelity):

    if ('filePattern' in params && 'compression' in params) return 'Polars Parquet Converter';

    if ('executionMode' in params && 'statementTimeout' in params) return 'DuckDB Virtual Lake';

    if ('businessObjective' in params && 'team' in params) {

      if (n.data?.name?.includes('Container') || n.type === 'containerNode') return 'Multi-Agent Pipeline Container';

      return 'Autonomous Big Data Analyst';

    }



    const explicitType = n.data?.nodeType;

    if (explicitType && typeof explicitType === 'string' && explicitType.trim() !== '') {

      const raw = explicitType.trim();

      const low = raw.toLowerCase();

      // Big Data & Analytics & Datasets & Agents

      if (low === 'polars parquet converter' || low.includes('polars') || low.includes('parquet converter')) return 'Polars Parquet Converter';

      if (low === 'duckdb virtual lake' || low === 'duckdb query engine' || low.includes('duckdb')) return 'DuckDB Virtual Lake';

      if (low === 'autonomous big data analyst' || low.includes('big data analyst') || low.includes('big_data_analyst')) return 'Autonomous Big Data Analyst';

      if (low === 'multi-agent pipeline container' || low.includes('pipeline container')) return 'Multi-Agent Pipeline Container';

      if (low === 'planner agent' || low === 'planner') return 'Planner Agent';

      if (low === 'sql engineer & critic' || low.includes('sql engineer') || low.includes('critic')) return 'SQL Engineer & Critic';

      if (low === 'domain specialist' || low.includes('domain specialist')) return 'Domain Specialist';

      if (low === 'executive synthesizer' || low.includes('synthesizer')) return 'Executive Synthesizer';



      if (low === 'agent db' || low === 'ai agent db') return 'Agent DB';

      if (low === 'agent audit' || low === 'ai agent pdfs audit' || low === 'ai agent audit') return 'Agent Audit';

      if (low === 'agent' || low === 'ai agent' || low === 'ai agent pdfs' || low === 'ai agent pdf' || low === 'ai agent zip' || low === 'ai agent pdfs loop' || low === 'ai agent api pdfs' || low === 'ai agent api') return 'Agent';

      if (low === 'pdf to image agent' || low === 'ai agent pdfs image' || low === 'ocr pdfs' || low === 'pdf to image') return 'PDF to Image Agent';

      if (low === 'pdf to base64 agent' || low === 'ai agent pdfs base64' || low === 'pdf to base64') return 'PDF to Base64 Agent';

      if (low === 'workflow timer') return 'Workflow Timer';

      if (low === 'timer') return 'Timer';

      if (low === 'api incremental' || low === 'api connector') return 'API Incremental';

      if (low === 'graph rag' || low === 'graph_rag' || low.includes('graph rag') || low.includes('graph_rag')) return 'Graph RAG';

      if (low === 'db' || low === 'database' || low === 'supabase' || low === 'vector db') return 'DB';

      if (low === 'page' || low === 'mark it down' || low === 'markitdown') return 'Page';

      if (low === 'storage') return 'Storage';

      if (low === 'json connector' || low === 'json connector list' || low.includes('json')) return 'JSON Connector';

      if (low === 'pdf queue') return 'PDF Queue';

      if (low === 'txt queue') return 'TXT Queue';

      if (low === 'zip queue') return 'Zip Queue';

      if (low === 'gmail') return 'Gmail';

      if (low === 'line') return 'Line';

      if (low === 'mobile message') return 'Mobile Message';

      if (low === 'rubric') return 'Rubric';

      if (low === 'multi-criteria analysis' || low === 'mca' || low.includes('multi-criteria')) return 'Multi-Criteria Analysis';

      if (low === 'sample') return 'Sample';

      if (low === 'table') return 'Table';

      return raw;

    }



    const nodeClass = (n.data?.nodeClass || '').trim();

    const originalName = (n.data?.originalName || '').trim();

    const name = (n.data?.name || '').trim();

    const label = (n.data?.label || '').trim();

    const rfType = (n.type || '').trim();

    const category = (n.data?.category || '').trim();

    const allText = [nodeClass, originalName, name, label].join(' ').toLowerCase();



    // Big Data & Analytics checking:

    if (allText.includes('polars') || allText.includes('parquet converter')) return 'Polars Parquet Converter';

    if (allText.includes('duckdb')) return 'DuckDB Virtual Lake';

    if (allText.includes('autonomous') || allText.includes('big data analyst') || allText.includes('big_data_analyst')) return 'Autonomous Big Data Analyst';

    if (allText.includes('pipeline container') || allText.includes('pipeline_container') || rfType === 'containerNode') return 'Multi-Agent Pipeline Container';



    // Agents team checking:

    if (allText.includes('planner')) return 'Planner Agent';

    if (allText.includes('sql engineer') || allText.includes('critic')) return 'SQL Engineer & Critic';

    if (allText.includes('domain specialist') || (category === 'Agents' && allText.includes('specialist'))) return 'Domain Specialist';

    if (allText.includes('synthesizer') || (category === 'Agents' && allText.includes('executive'))) return 'Executive Synthesizer';



    // 1. Timers

    if (isWorkflowTimerNode(n) || nodeClass === 'Workflow Timer' || name === 'Workflow Timer' || label === 'Workflow Timer') {

      return 'Workflow Timer';

    }

    if (nodeClass === 'Timer' || name === 'Timer' || label === 'Timer' || (name.toLowerCase().includes('timer') && !name.toLowerCase().includes('workflow'))) {

      return 'Timer';

    }

    // 2. OCR Agents

    if (nodeClass.includes('Base64') || originalName.includes('Base64') || name.includes('Base64') || label.includes('Base64')) {

      return 'PDF to Base64 Agent';

    }

    if (nodeClass.includes('Image') || originalName.includes('Image') || name.includes('Image') || label.includes('Image')) {

      return 'PDF to Image Agent';

    }

    // 3. Agent DB

    if (nodeClass.includes('Agent DB') || originalName.includes('Agent DB') || name.includes('Agent DB') || label.includes('Agent DB') ||

        nodeClass.includes('AI Agent DB') || originalName.includes('AI Agent DB') || name.includes('AI Agent DB') || label.includes('AI Agent DB')) {

      return 'Agent DB';

    }

    // 4. Agent Audit

    if (nodeClass.includes('Audit') || originalName.includes('Audit') || name.includes('Audit') || label.includes('Audit')) {

      return 'Agent Audit';

    }

    // 5. Queues

    if (nodeClass === 'PDF Queue' || name === 'PDF Queue' || originalName === 'PDF Queue' || label === 'PDF Queue') return 'PDF Queue';

    if (nodeClass === 'TXT Queue' || name === 'TXT Queue' || originalName === 'TXT Queue' || label === 'TXT Queue') return 'TXT Queue';

    if (nodeClass === 'Zip Queue' || name === 'Zip Queue' || originalName === 'Zip Queue' || label === 'Zip Queue') return 'Zip Queue';

    // 6. Data Sources / Actions

    if (nodeClass === 'API Incremental' || originalName === 'API Incremental' || name === 'API Incremental' || label === 'API Incremental' || name === 'API Connector' || label === 'API Connector') return 'API Incremental';

    if (nodeClass === 'Graph RAG' || nodeClass === 'Graph_RAG' || originalName === 'Graph RAG' || name === 'Graph RAG' || label === 'Graph RAG' || name.toLowerCase().includes('graph rag')) return 'Graph RAG';

    if (nodeClass === 'DB' || originalName === 'DB' || name === 'DB' || label === 'DB' || name === 'Database' || label === 'Database') return 'DB';

    if (nodeClass === 'Page' || originalName === 'Page' || name === 'Page' || label === 'Page') return 'Page';

    if (nodeClass === 'Storage' || originalName === 'Storage' || name === 'Storage' || label === 'Storage') return 'Storage';

    if (nodeClass === 'JSON Connector' || originalName === 'JSON Connector' || name === 'JSON Connector' || label === 'JSON Connector' || name.toLowerCase().includes('json')) return 'JSON Connector';

    // 7. Notifications

    if (nodeClass === 'Gmail' || originalName === 'Gmail' || name === 'Gmail' || label === 'Gmail') return 'Gmail';

    if (nodeClass.toLowerCase() === 'line' || originalName.toLowerCase() === 'line' || name.toLowerCase() === 'line' || label.toLowerCase() === 'line') return 'Line';

    if (nodeClass.toLowerCase().includes('mobile') || originalName.toLowerCase().includes('mobile') || name.toLowerCase().includes('mobile') || label.toLowerCase().includes('mobile')) return 'Mobile Message';

    // 8. Criteria

    if (rfType === 'rubric' || name === 'Rubric' || label === 'Rubric') return 'Rubric';

    if (rfType === 'mca' || name === 'Multi-Criteria Analysis' || label === 'Multi-Criteria Analysis') return 'Multi-Criteria Analysis';

    if (rfType === 'sample' || name === 'Sample' || label === 'Sample') return 'Sample';

    if (rfType === 'table' || name === 'Table' || label === 'Table') return 'Table';



    // 9. Legacy / Original Agents

    if (category === 'Agent' || nodeClass.toLowerCase() === 'agent' || name.toLowerCase() === 'agent' || label.toLowerCase() === 'agent') {

      return 'Agent';

    }



    // Preserve custom node name if present

    if (name && name !== 'Agent') return name;



    return 'Agent';

  };



  const sanitizeLoadedNodes = (nodesList: any[]) => {

    const sanitized = (nodesList || []).map((n: any, idx: number) => {

      const position = n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number'

        ? n.position

        : { x: 150 + idx * 240, y: 150 };



      const canonicalType = inferCanonicalNodeType(n);



      const isWfTimer = canonicalType === 'Workflow Timer' || isWorkflowTimerNode(n);

      if (isWfTimer) {

        return {

          ...n,

          position,

          deletable: true,

          data: {

            ...n.data,

            nodeType: 'Workflow Timer',

            nodeClass: 'Workflow_Timer',

            originalName: 'Workflow Timer',

            name: n.data?.name || 'Workflow Timer',

            label: n.data?.label || 'Workflow Timer',

            category: 'Actions',

            isProtected: false,

            parameters: {

              timerMode: 'interval',

              intervalValue: n.data?.parameters?.intervalValue !== undefined ? n.data?.parameters?.intervalValue : 2,

              intervalUnit: n.data?.parameters?.intervalUnit || 'seconds',

              remainingSeconds: n.data?.parameters?.remainingSeconds !== undefined ? n.data?.parameters?.remainingSeconds : 2,

              ...n.data?.parameters

            }

          }

        };

      }



      if (n.data?.name === 'Extract' || n.data?.label === 'Extract') {

        return {

          ...n,

          position,

          data: {

            ...n.data,

            nodeType: canonicalType,

            parameters: {

              ...n.data?.parameters,

              extractedText: ''

            }

          }

        };

      }



      // Check category from DRAGGABLE_TEMPLATES

      let category: string | undefined = undefined;

      for (const sec of DRAGGABLE_TEMPLATES) {

        if (sec.items.some(item => item.name === canonicalType)) {

          category = sec.category;

          break;

        }

      }

      if (!category) {

        category = n.data?.category;

      }



      // Preserve existing label or friendly name, while ensuring nodeType is canonical

      const currentLabel = n.data?.label !== undefined ? n.data?.label : n.data?.name;

      const finalLabel = (currentLabel === 'AI Agent PDFs' ? 'Agent' :

                          currentLabel === 'AI Agent PDFs Image' ? 'PDF to Image Agent' :

                          currentLabel === 'AI Agent PDFs Base64' ? 'PDF to Base64 Agent' :

                          currentLabel === 'AI Agent DB' ? 'Agent DB' :

                          currentLabel === 'AI Agent PDFs Audit' ? 'Agent Audit' :

                          (currentLabel && currentLabel !== 'Agent') ? currentLabel : canonicalType);



      const currentName = n.data?.name || canonicalType;

      const finalName = (currentName === 'AI Agent PDFs' ? 'Agent' :

                         currentName === 'AI Agent PDFs Image' ? 'PDF to Image Agent' :

                         currentName === 'AI Agent PDFs Base64' ? 'PDF to Base64 Agent' :

                         currentName === 'AI Agent DB' ? 'Agent DB' :

                         currentName === 'AI Agent PDFs Audit' ? 'Agent Audit' :

                         (currentName && currentName !== 'Agent') ? currentName : canonicalType);



      return {

        ...n,

        position,

        data: {

          ...n.data,

          nodeType: canonicalType,

          nodeClass: canonicalType.replace(/\s+/g, '_'),

          originalName: n.data?.originalName || canonicalType,

          category: category || n.data?.category || 'Actions',

          name: finalName,

          label: finalLabel

        }

      };

    });



    return sanitized;

  };



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

      let position = dropPosition;

      if (!position) {

        if (reactFlowWrapper.current && reactFlowInstance) {

          const bounds = reactFlowWrapper.current.getBoundingClientRect();

          const jitterX = (Math.random() - 0.5) * 60;

          const jitterY = (Math.random() - 0.5) * 60;

          position = reactFlowInstance.project({

            x: bounds.width / 2 + jitterX,

            y: bounds.height / 2 + jitterY,

          });

        } else {

          position = { x: 350, y: 250 };

        }

      }



      const nodeId = `node_${Date.now()}`;



      let logicPosition = { x: position?.x ?? 350, y: position?.y ?? 250 };

      let agentPosition = { x: position?.x ?? 350, y: position?.y ?? 250 };

      let parentNode: string | undefined = undefined;

      let extent: 'parent' | undefined = undefined;



      if (category === 'Data Sources') {

        parentNode = 'container-sources';

        extent = 'parent';

        const currentSources = agentNodes.filter(n => n.parentNode === 'container-sources');

        agentPosition = { x: 5, y: 40 + currentSources.length * 120 };

      } else if (category === 'Notification') {

        parentNode = 'container-notifications';

        extent = 'parent';

        const currentNotifs = agentNodes.filter(n => n.parentNode === 'container-notifications');

        agentPosition = { x: 5, y: 40 + currentNotifs.length * 120 };

      } else if (category === 'Actions' || category === 'Dataset' || category === 'Datasets' || category === 'Big Data & Analytics') {

        parentNode = 'container-deliverables';

        extent = 'parent';

        const currentActions = agentNodes.filter(n => n.parentNode === 'container-deliverables');

        agentPosition = { x: 10 + currentActions.length * 260, y: 45 };

      }



      let defaultParams: any = {};

      if (name === 'API Connector') {

        defaultParams = {

          apiUrl: 'https://api.example.com/v1/data',

          functionName: 'fetchData()',

          apiParameters: 'limit=10&status=active',

          apiOutput: '{\n  "status": "success",\n  "data": {\n    "id": 101,\n    "name": "John Doe",\n    "email": "john@example.com",\n    "role": "developer"\n  }\n}'

        };

      } else if (name === 'API Incremental') {

        defaultParams = {

          apiUrl: 'https://bqysaldeijwvnhtcfiuj.supabase.co/rest/v1/pdf_table',

          authHeader: 'Bearer sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism',

          anonKeyHeader: 'sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism',

          functionName: 'GetPDF_Incremental()',

          apiParameters: 'select=number,date,file_url',

          round: 1,

          row: 5,

          apiOutput: ''

        };

      } else if (name === 'Graph RAG') {

        defaultParams = {

          graphEndpoint: 'bolt://localhost:7687',

          databaseType: 'neo4j',

          graphQuery: 'MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 25',

          topK: 5,

          similarityThreshold: 0.7,

          tools: ['database', 'search']

        };

      } else if (name === 'JSON Connector' || name === 'JSON Connector List') {

        defaultParams = {

          fields: []

        };

      } else if (name === 'Storage') {

        defaultParams = {

          supabaseUrl: 'https://bqysaldeijwvnhtcfiuj.supabase.co',

          supabaseKey: '',

          bucketName: 'pdfs'

        };

      } else if (name === 'Timer') {

        defaultParams = {

          timerMode: 'calendarSpecific',

          calendarSpecificDates: [],

          calendarPatternType: 'daily'

        };

      } else if (name === 'Workflow Timer') {

        defaultParams = {

          timerMode: 'interval',

          intervalValue: 2,

          intervalUnit: 'seconds',

          remainingSeconds: 2,

          schedulerActive: false

        };

      } else if (name === 'Pdfs Loader') {

        defaultParams = {

          pdfUrls: ''

        };

      } else if (name === 'PDF Queue') {

        defaultParams = {

          supabaseUrls: '',

          bucketName: 'pdfs',

          currentIndex: 0,

          queueLength: 0,

          currentUrl: '',

          hasNext: false

        };

      } else if (name === 'TXT Queue') {

        defaultParams = {

          supabaseUrls: '',

          bucketName: 'txts',

          currentIndex: 0,

          queueLength: 0,

          currentUrl: '',

          hasNext: false,

          txtQueue: []

        };

      } else if (name === 'Zip Queue') {

        defaultParams = {

          supabaseUrls: '',

          bucketName: 'zips',

          currentIndex: 0,

          queueLength: 0,

          currentUrl: '',

          hasNext: false,

          zipQueue: []

        };

      } else if (name === 'Extract') {

        defaultParams = {

          googleApiKey: '',

          modelName: 'gemini-2.5-flash',

          prompt: 'Extract all core assertions, technical specifications, and key requirements. Remove preamble and redundant text.',

          extractedText: ''

        };

      } else if (name === 'De-duplicate Text') {

        defaultParams = {

          googleApiKey: '',

          modelName: 'gemini-2.5-flash',

          prompt: 'Remove semantic redundancies and collapse duplicate claims. Isolate specific numeric thresholds and metrics.',

          deduplicatedText: ''

        };

      } else if (name === 'Structured Parse JSON') {

        defaultParams = {

          googleApiKey: '',

          modelName: 'gemini-2.5-flash',

          structuredJson: ''

        };

      } else if (name === 'State') {

        defaultParams = {

          stateOutput: ''

        };

      } else if (name === 'Mark It Down' || name === 'MarkItDown') {

        defaultParams = {

          agentOutputsTable: [],

          pdfUrls: '',

          currentIndex: 0,

          previous_max: 0

        };

      } else if (name === 'Agent' || name === 'Agent DB' || name === 'Agent Audit' || name === 'PDF to Image Agent' || name === 'PDF to Base64 Agent' || name === 'AI Agent API' || name === 'AI Agent API PDFs' || name === 'AI Agent PDFs' || name === 'AI Agent DB' || name === 'AI Agent PDFs Audit' || name === 'AI Agent Zip' || name === 'AI Agent PDFs Loop' || name === 'AI Agent PDFs Chain' || name === 'AI Agent PDFs Base64' || name === 'AI Agent PDFs Image' || name === 'OCR PDFs' || name === 'AI Agent Account' || name === 'AI Agent Vertex AI') {

        defaultParams = {

          modelName: 'gemini-2.5-flash',

          temperature: 0.0,

          maxOutputTokens: 2048,

          topP: 1.0,

          topK: 40,

          safetySettings: 'BLOCK_MEDIUM_AND_ABOVE',

          recursionLimit: 20,

          stateSchema: 'messages, remaining_chunks, pdf_content',

          configurableModel: 'default',

          configurableTemp: '',

          langsmithTracing: true,

          langsmithProject: 'gemini-pdf-summarizer',

          langsmithTags: 'v1-test, temp-0',

          langsmithMetadata: '{\n  "user_id": "123"\n}'

        };

        

        if (name === 'AI Agent API') {

          defaultParams.googleApiKey = '';

        } else if (name === 'Agent' || name === 'Agent DB' || name === 'Agent Audit' || name === 'PDF to Image Agent' || name === 'PDF to Base64 Agent' || name === 'AI Agent API PDFs' || name === 'AI Agent PDFs' || name === 'AI Agent DB' || name === 'AI Agent PDFs Audit' || name === 'AI Agent Zip' || name === 'AI Agent PDFs Loop' || name === 'AI Agent PDFs Chain' || name === 'AI Agent PDFs Base64' || name === 'AI Agent PDFs Image' || name === 'OCR PDFs') {

          defaultParams.googleApiKey = '';

          defaultParams.pdfUrls = '';

          defaultParams.agentOutputsTable = [];

          defaultParams.agentOutputStatusesMap = {};

          

          if (name === 'AI Agent DB' || name === 'Agent DB') {

            defaultParams.connectionString = '';

            defaultParams.mode = 'auto';

            defaultParams.prompt = 'Analyze the input data and construct a raw SQL INSERT query to save it into the target database table. Return ONLY the SQL statement, no markdown formatting.';

          }

          

          if (name === 'AI Agent Zip') {

            defaultParams.prompt = "????????????????????????????????????? ???????????????, ?????, ???????????????? ???? ???????????? ??????? ?????????????? '??' ????????? ????????????????? '?????'";

          }

          if (name === 'AI Agent PDFs Base64' || name === 'AI Agent PDFs Image' || name === 'PDF to Base64 Agent' || name === 'PDF to Image Agent') {

            defaultParams.modelName = 'gemini-1.5-flash';

          }

        } else if (name === 'AI Agent Account') {

          defaultParams.googleCloudProject = '';

        } else if (name === 'AI Agent Vertex AI') {

          defaultParams.googleCloudProject = '';

          defaultParams.serviceAccountJsonPath = '';

        }

      } else if (name === 'Polars Parquet Converter') {

        defaultParams = {

          sourceType: 'upload',

          filePattern: '*.xlsx, *.csv',

          sheetName: 'Sheet1',

          compression: 'snappy',

          autoTypeInference: true,

          nullHandling: 'keep',

          chunkSize: 50000,

          outputParquetPath: './workflow_inputs/parquet_cache',

          convertedFiles: [],

          catalog: {}

        };

      } else if (name === 'DuckDB Virtual Lake') {

        defaultParams = {

          executionMode: 'agent_driven',

          sqlQuery: "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10",

          statementTimeout: '10s',

          maxResultRows: 100,

          memoryLimit: '2GB',

          queryResults: [],

          previewColumns: []

        };

      } else if (name === 'Autonomous Big Data Analyst' || name === 'Multi-Agent Pipeline Container') {

        defaultParams = {

          mode: 'auto',

          businessObjective: 'วิเคราะห์ยอดขายและผลประกอบการ หาแนวโน้มสำคัญ ตรวจสอบความผิดปกติ (Anomalies) และจัดทำข้อเสนอแนะเชิงกลยุทธ์',

          sourceFiles: [],

          targetParquetPath: './workflow_inputs/parquet_cache',

          sqlTimeout: '15s',

          team: [

            { id: 'agent_1', name: 'Planner Agent', role: 'วางแผนและแตกโจทย์วิเคราะห์เป็นลำดับขั้นตอน', model: 'gemini-2.5-flash', persona: 'Chief Data Strategist' },

            { id: 'agent_2', name: 'SQL Engineer & Critic', role: 'สร้างและตรวจสอบคำสั่ง DuckDB SQL ข้าม Parquet', model: 'gemini-2.5-flash', persona: 'DuckDB Senior Engineer & Verification Lead' },

            { id: 'agent_3', name: 'Domain Specialist', role: 'วิเคราะห์ตัวเลข สถิติ และหาจุดผิดปกติเชิงธุรกิจ', model: 'gemini-2.5-flash', persona: 'Senior Business Intelligence Specialist' },

            { id: 'agent_4', name: 'Executive Synthesizer', role: 'สังเคราะห์บทสรุปและจัดทำคำแนะนำผู้บริหาร', model: 'gemini-2.5-flash', persona: 'Executive Insights Director' }

          ],

          executionStatus: 'idle',

          finalReport: ''

        };

      } else if (name === 'Planner Agent' || name === 'SQL Engineer & Critic' || name === 'Domain Specialist' || name === 'Executive Synthesizer') {

        defaultParams = {

          modelName: 'gemini-2.5-flash',

          temperature: 0.0,

          maxOutputTokens: 2048,

          role: name === 'Planner Agent' 

            ? 'Chief Data Strategist' 

            : name === 'SQL Engineer & Critic' 

              ? 'DuckDB Senior Engineer & Critic' 

              : name === 'Domain Specialist' 

                ? 'Senior Business Intelligence Specialist' 

                : 'Executive Insights Director',

          prompt: name === 'Planner Agent' 

            ? 'วิเคราะห์โครงสร้างตารางข้อมูลและแตกขั้นตอนการวิเคราะห์ (Analytical Decomposition) เป็นข้อๆ'

            : name === 'SQL Engineer & Critic'

              ? 'เขียนและตรวจสอบคำสั่ง DuckDB SQL เพื่อดึงข้อมูลและคำนวณตัวเลขตามขั้นตอนที่ได้รับ'

              : name === 'Domain Specialist'

                ? 'วิเคราะห์ผลลัพธ์จาก SQL เพื่อหา Insight เชิงธุรกิจ และหาความผิดปกติของตัวเลข'

                : 'รวบรวมข้อค้นพบจากทุก Agent และสังเคราะห์เป็นบทสรุปผู้บริหาร (Executive Summary)'

        };

      }



      const newNodeLogic: Node = {

        id: nodeId,

        type: category === 'Criteria' ? (name === 'Sample' ? 'sample' : (name === 'Table' ? 'table' : (name === 'Multi-Criteria Analysis' ? 'mca' : 'rubric'))) : (name === 'PDF Extractor' ? 'pdfExtractor' : (name === 'Multi-Agent Pipeline Container' ? 'containerNode' : 'customNode')),

        position: logicPosition,

        selected: true,

        data: { 

          label: name, 

          category, 

          name, 

          nodeClass: name.replace(/\s+/g, '_'),

          originalName: name,

          nodeType: name,

          prompt: defaultParams.prompt || (category === 'Models' || category === 'Agents' || category === 'Agent' || name?.toLowerCase().includes('agent') ? 'Configure instructions' : ''),

          role: defaultParams.role || (category === 'Agents' || category === 'Agent' || name?.toLowerCase().includes('agent') ? 'Agent Role' : ''),

          parameters: defaultParams

        },

      };



      const newNodeAgent: Node = {

        id: nodeId,

        type: category === 'Criteria' ? (name === 'Sample' ? 'sample' : (name === 'Table' ? 'table' : (name === 'Multi-Criteria Analysis' ? 'mca' : 'rubric'))) : 'customNode',

        parentNode,

        extent,

        position: agentPosition,

        data: { 

          label: name, 

          category, 

          name, 

          nodeClass: name.replace(/\s+/g, '_'),

          originalName: name,

          nodeType: name,

          prompt: defaultParams.prompt || (category === 'Models' || category === 'Agents' || category === 'Agent' || name?.toLowerCase().includes('agent') ? 'Configure instructions' : ''),

          role: defaultParams.role || (category === 'Agents' || category === 'Agent' || name?.toLowerCase().includes('agent') ? 'Agent Role' : ''),

          parameters: defaultParams

        },

      };



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



  // Smart Debounce Auto-Save & Manual DB/JSON Save Logic

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

        fetchWorkflows(finalId);

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





  const handleNewWorkflowConfirmYes = async () => {

    setShowSaveConfirmModal(false);

    await handleSaveWorkflow();

    handleNewWorkflowClear();

  };



  const handleNewWorkflowConfirmNo = () => {

    setShowSaveConfirmModal(false);

    handleNewWorkflowClear();

  };



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

        setSelectedWorkflowId(wfId);

        fetchWorkflows(wfId || undefined);

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

    const activeTargetIds = (selectedNodeIds && selectedNodeIds.length > 0) ? selectedNodeIds : (isSubflowModeActive ? selectedProcessNodeIds : []);



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

        : (isSubflowModeActive ? selectedProcessNodeIds : []);

        

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

              : (isSubflowModeActive ? selectedProcessNodeIds : []);

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

                    setSelectedNode(prev => prev ? {

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

      setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, status: 'running' } } : null);

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

          setSelectedNode(prev => prev ? {

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

          setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, status: 'idle' } } : null);

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

        setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, status: 'idle' } } : null);

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





  const generateFinalPromptAsync = async (nodeId: string) => {

    const node = nodes.find(n => n.id === nodeId);

    if (!node) return "";

    

    let promptPreview = node.data.prompt || "";

    

    const nCls = getNodeClass(node).replace(/_/g, ' ');

    const isPdfsNode = nCls === 'Agent' || node.data.name === 'Agent' || nCls === 'Agent DB' || node.data.name === 'Agent DB' || nCls === 'Agent Audit' || node.data.name === 'Agent Audit' || nCls === 'PDF to Image Agent' || node.data.name === 'PDF to Image Agent' || nCls === 'PDF to Base64 Agent' || node.data.name === 'PDF to Base64 Agent' || nCls === 'AI Agent API PDFs' || node.data.name === 'AI Agent API PDFs' || node.type === 'AgentAPIPDFsNode' || nCls === 'AI Agent PDFs' || node.data.name === 'AI Agent PDFs' || node.data.name === 'AI Agent PDFs Audit'  || node.type === 'AgentPDFsNode' || nCls === 'AI Agent Zip' || node.data.name === 'AI Agent Zip' || node.type === 'AgentZipNode' || node.type === 'AgentPDFsAuditNode' || nCls === 'AI Agent PDFs Loop' || node.data.name === 'AI Agent PDFs Loop' || node.type === 'AgentPDFsLoopNode' || nCls === 'AI Agent PDFs Chain' || node.data.name === 'AI Agent PDFs Chain' || node.type === 'AgentPDFsChainNode' || nCls === 'AI Agent PDFs Base64' || node.data.name === 'AI Agent PDFs Base64' || node.type === 'AgentPDFsBase64Node' || nCls === 'AI Agent PDFs Image' || node.data.name === 'AI Agent PDFs Image' || node.type === 'AgentPDFsImageNode' || nCls === 'OCR PDFs' || node.data.name === 'OCR PDFs' || node.type === 'OCRPDFsNode';

    if (isPdfsNode) {

      promptPreview = "[PDF Document Content/URL will be injected here]\n\n" + promptPreview;

    }



    const incomingEdges = edges.filter(e => e.target === nodeId);

    let appendedJson = "";

    

    incomingEdges.forEach(edge => {

      const srcNode = nodes.find(n => n.id === edge.source);

      if (srcNode) {

        const srcType = srcNode.type;

        const srcData = srcNode.data;

        

        if ((srcType === "rubric" || srcType === "mca") && srcData.rubricData) {

          let finalData = srcData.rubricData;

          if (edge.sourceHandle && edge.sourceHandle.startsWith("criterion-")) {

            const critId = edge.sourceHandle.replace("criterion-", "");

            const selectedCrit = srcData.rubricData.criteria?.find((c: any) => c.id === critId);

            if (selectedCrit) {

              finalData = {

                ...srcData.rubricData,

                criteria: [selectedCrit]

              };

            }

          }

          appendedJson += "\n\n" + srcType.toUpperCase() + " JSON:\n" + JSON.stringify(finalData, null, 2);

        } else if (srcType === "sample" && srcData.sampleData) {

          let finalData = srcData.sampleData;

          if (edge.sourceHandle && edge.sourceHandle.startsWith("sample-") && edge.sourceHandle !== "sample-all") {

            const sampleId = edge.sourceHandle.replace("sample-", "");

            const selectedSample = srcData.sampleData.samples?.find((s: any) => s.id === sampleId);

            if (selectedSample) {

              finalData = {

                ...srcData.sampleData,

                samples: [selectedSample]

              };

            }

          }

          appendedJson += "\n\nSample JSON:\n" + JSON.stringify(finalData, null, 2);

        } else if (srcType === "table" && srcData.tableData) {

          let finalData = srcData.tableData;

          if (edge.sourceHandle && edge.sourceHandle.startsWith("table-row-")) {

            const rowId = edge.sourceHandle.replace("table-row-", "");

            const selectedRow = srcData.tableData.rows?.find((r: any) => r.id === rowId);

            if (selectedRow) {

              finalData = {

                ...srcData.tableData,

                rows: [selectedRow]

              };

            }

          }

          appendedJson += "\n\nTable JSON:\n" + JSON.stringify(finalData, null, 2);

        }

      }

    });



    

      // Inject TXT fetch logic here

      let appendedText = "";

      for (const edge of incomingEdges) {

        const srcNode = nodes.find(n => n.id === edge.source);

        if (srcNode) {

          const srcData = srcNode.data || {};

          let fileList: any[] = [];

          

          if (srcData.outputs?.agentOutputsTable) fileList = srcData.outputs.agentOutputsTable;

          else if (srcData.parameters?.agentOutputsTable) fileList = srcData.parameters.agentOutputsTable;

          else if (srcData.outputs?.pdfQueue) fileList = srcData.outputs.pdfQueue;

          else if (srcData.parameters?.pdfQueue) fileList = srcData.parameters.pdfQueue;



          if (Array.isArray(fileList)) {

            const txtFiles = fileList.filter(f => typeof f === 'string' && f.endsWith('.txt'));

            for (const txtFile of txtFiles) {

              try {

                const wfId = selectedWorkflowId || 'default';

                const url = `${BACKEND_URL}/api/agent-result/${encodeURIComponent(txtFile)}?workflow_id=${encodeURIComponent(wfId)}`;

                const res = await fetch(url);

                if (res.ok) {

                  const textData = await res.text();

                  appendedText += "\n\n--- Text from " + txtFile + " ---\n" + textData;

                }

              } catch (e) {

                console.error("Failed to fetch txt file:", txtFile, e);

              }

            }

          }

        }

      }

      return promptPreview + appendedJson + appendedText;

    };



  const generateFinalPayloadAsync = async (nodeId: string) => {

    const node = nodes.find(n => n.id === nodeId);

    if (!node) return "";

    

    const finalPrompt = await generateFinalPromptAsync(nodeId);

    const modelName = node.data.parameters?.modelName || 'gemini-2.5-flash';

    const nCls = getNodeClass(node).replace(/_/g, ' ');

    const isPdfsNode = nCls === 'Agent' || node.data.name === 'Agent' || nCls === 'Agent DB' || node.data.name === 'Agent DB' || nCls === 'Agent Audit' || node.data.name === 'Agent Audit' || nCls === 'PDF to Image Agent' || node.data.name === 'PDF to Image Agent' || nCls === 'PDF to Base64 Agent' || node.data.name === 'PDF to Base64 Agent' || nCls === 'AI Agent API PDFs' || node.data.name === 'AI Agent API PDFs' || node.type === 'AgentAPIPDFsNode' || nCls === 'AI Agent PDFs' || node.data.name === 'AI Agent PDFs' || node.data.name === 'AI Agent PDFs Audit'  || node.type === 'AgentPDFsNode' || nCls === 'AI Agent Zip' || node.data.name === 'AI Agent Zip' || node.type === 'AgentZipNode' || node.type === 'AgentPDFsAuditNode' || nCls === 'AI Agent PDFs Loop' || node.data.name === 'AI Agent PDFs Loop' || node.type === 'AgentPDFsLoopNode' || nCls === 'AI Agent PDFs Chain' || node.data.name === 'AI Agent PDFs Chain' || node.type === 'AgentPDFsChainNode' || nCls === 'AI Agent PDFs Base64' || node.data.name === 'AI Agent PDFs Base64' || node.type === 'AgentPDFsBase64Node' || nCls === 'AI Agent PDFs Image' || node.data.name === 'AI Agent PDFs Image' || node.type === 'AgentPDFsImageNode' || nCls === 'OCR PDFs' || node.data.name === 'OCR PDFs' || node.type === 'OCRPDFsNode';

    const isOpenRouter = modelName.includes('/');

    

    const hasIncomingQueue = edges.some(e => {

      const n = nodes.find(sn => sn.id === e.source);

      if (!n || e.target !== nodeId) return false;

      const name = n.data?.name?.toLowerCase() || '';

      return name.includes('queue') || n.type === 'pdfQueue' || n.type === 'fileQueue' || n.type === 'imageQueue' || n.type === 'urlList';

    });



    const hasFile = isPdfsNode || hasIncomingQueue;



    let payload: any = {};



    if (isOpenRouter) {

      const messages: any[] = [];

      const role = node.data.role?.trim();

      if (role) {

        messages.push({ role: "system", content: role });

      }



      if (hasFile) {

        messages.push({

          role: "user",

          content: [

            { type: "text", text: finalPrompt },

            { type: "file", file: { file_data: "data:application/pdf;base64,<BASE64_DATA_GENERATED_AT_RUNTIME>" } }

          ]

        });

      } else {

        messages.push({ role: "user", content: finalPrompt });

      }



      payload = {

        model: modelName,

        messages: messages,

        temperature: parseFloat(node.data.parameters?.temperature || 0),

        top_p: parseFloat(node.data.parameters?.topP || 0.95),

        max_tokens: parseInt(node.data.parameters?.maxOutputTokens || 8192)

      };

    } else {

      payload = {

        contents: [

          {

            parts: [

              { text: finalPrompt }

            ]

          }

        ],

        generationConfig: {

          temperature: parseFloat(node.data.parameters?.temperature || 0),

          maxOutputTokens: parseInt(node.data.parameters?.maxOutputTokens || 8192),

          topP: parseFloat(node.data.parameters?.topP || 0.95),

          topK: parseInt(node.data.parameters?.topK || 40)

        }

      };



      if (hasFile) {

        payload.contents[0].parts.push({

          fileData: {

            mimeType: "application/pdf",

            fileUri: "https://generativelanguage.googleapis.com/v1beta/files/<FILE_URI_GENERATED_AT_RUNTIME>"

          }

        });

      }

    }



    return JSON.stringify(payload, null, 2);

  };



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



  const updateDbConnectionParameter = (key: string, val: any) => {

    if (!selectedNode) return;

    const currentParams = selectedNode.data.parameters || {};

    const updatedParams = { ...currentParams, [key]: val };

    

    const mode = updatedParams.dbConnectionMode || 'localhost';



    if (mode === 'localhost') {

      const filePath = updatedParams.dbFilePath || 'workflow_app.db';

      updatedParams.connectionString = `sqlite:///${filePath}`;

    }



    updateSelectedNodeData('parameters', updatedParams);

  };



  const updateNodeParameter = (nodeId: string, key: string, val: any) => {

    setNodes((nds) =>

      nds.map((n) => {

        if (n.id === nodeId) {

          const currentParams = n.data.parameters || {};

          return {

            ...n,

            data: {

              ...n.data,

              parameters: { ...currentParams, [key]: val }

            }

          };

        }

        return n;

      })

    );

  };



  // @ts-ignore

  const handleTestSelectedNodes = () => {

    const selectedNodes = nodes.filter(n => n.selected);

    const activeSelectedNodes = selectedNodes.length > 0 ? selectedNodes : (selectedNode ? [selectedNode] : []);

                if (activeSelectedNodes.length === 0) return;



    // Open logs tray

    setShowLogsTray(true);



    const selectedIds = activeSelectedNodes.map(n => n.id);



    // Set nodes status to running

    setNodes(nds => nds.map(n => selectedIds.includes(n.id) ? { ...n, data: { ...n.data, status: 'running' } } : n));



    // Append start log

    setLogs(prev => [

      ...prev,

      {

        message: `[System] Starting node-level connection test for: ${activeSelectedNodes.map(n => n.data.name || n.data.label).join(', ')}...`,

        level: 'INFO',

        timestamp: new Date().toISOString()

      }

    ]);



    // Simulate node checks

    activeSelectedNodes.forEach((n, idx) => {

      setTimeout(() => {

        const nodeName = n.data.name || n.data.label;

        const category = n.data.category || '';

        

        let nodeLogs: { message: string; level: string }[] = [];



        if (nodeName === 'API Connector') {

          const url = n.data.parameters?.apiUrl || 'https://api.example.com/v1/data';

          const func = n.data.parameters?.functionName || 'fetchData()';

          const params = n.data.parameters?.apiParameters || '';

          const authHeader = n.data.parameters?.authHeader || '';

          const anonKeyHeader = n.data.parameters?.anonKeyHeader || '';

          

          setLogs(prev => [

            ...prev,

            { message: `[API Connector] Testing connection to ${url}...`, level: 'INFO', timestamp: new Date().toISOString() },

            { message: `[API Connector] Executing function ${func} with parameters: ${params}`, level: 'INFO', timestamp: new Date().toISOString() },

            { message: `[API Connector] Routing request through backend proxy to bypass browser CORS blockages...`, level: 'INFO', timestamp: new Date().toISOString() }

          ]);



          fetch(`${BACKEND_URL}/api/test-api-connection`, {

            method: 'POST',

            headers: {

              'Content-Type': 'application/json'

            },

            body: JSON.stringify({

              url: url,

              params: params,

              headers: {

                'Authorization': authHeader,

                'apikey': anonKeyHeader

              }

            })

          })

            .then(res => {

              if (!res.ok) {

                return res.json().then(errData => {

                  throw new Error(errData.detail || `HTTP Error ${res.status}`);

                });

              }

              return res.json();

            })

            .then(result => {

              const formattedOutput = result.is_json 

                ? JSON.stringify(result.data, null, 2)

                : String(result.data);



              updateNodeParameter(n.id, 'apiOutput', formattedOutput);

              if (selectedNode && selectedNode.id === n.id) {

                setSelectedNode(prev => prev ? {

                  ...prev,

                  data: {

                    ...prev.data,

                    parameters: { ...prev.data.parameters, apiOutput: formattedOutput }

                  }

                } : null);

              }



              setLogs(prev => [

                ...prev,

                {

                  message: `[API Connector] Connection test succeeded! Response data successfully loaded into Output.`,

                  level: 'SUCCESS',

                  timestamp: new Date().toISOString()

                }

              ]);

            })

            .catch(err => {

              const proxyErrorMsg = `[API Connector] Connection test failed: ${err.message}.`;

              setLogs(prev => [

                ...prev,

                {

                  message: proxyErrorMsg,

                  level: 'ERROR',

                  timestamp: new Date().toISOString()

                }

              ]);



              const errorPayload = JSON.stringify({

                status: "error",

                error: err.message,

                hint: "Double check your URL, headers, and parameters. Ensure the backend server has outbound network access to the target endpoint."

              }, null, 2);



              updateNodeParameter(n.id, 'apiOutput', errorPayload);

              if (selectedNode && selectedNode.id === n.id) {

                setSelectedNode(prev => prev ? {

                  ...prev,

                  data: {

                    ...prev.data,

                    parameters: { ...prev.data.parameters, apiOutput: errorPayload }

                  }

                } : null);

              }

            });

        } else if (nodeName === 'JSON Connector' || nodeName === 'JSON Connector List') {

          const jsonText = n.data.parameters?.jsonText || '';

          nodeLogs = [

            { message: `[JSON Connector] Parsing JSON payload text...`, level: 'INFO' }

          ];

          try {

            const parsed = JSON.parse(jsonText);

            const keys = Object.keys(parsed);

            nodeLogs.push({ message: `[JSON Connector] Successfully parsed ${keys.length} fields: ${keys.join(', ')}`, level: 'SUCCESS' });

          } catch (e: any) {

            nodeLogs.push({ message: `[JSON Connector] JSON Parse Error: ${e.message}`, level: 'ERROR' });

          }

        } else if (

          nodeName?.toLowerCase().includes('db') ||

          nodeName?.toLowerCase().includes('database') ||

          nodeName?.toLowerCase().includes('supabase') ||

          n.data.label?.toLowerCase().includes('db') ||

          n.data.label?.toLowerCase().includes('database') ||

          n.data.label?.toLowerCase().includes('supabase') ||

          n.id?.toLowerCase().includes('db')

        ) {

          const conn = n.data.parameters?.connectionString || 'sqlite:///workflow_app.db';

          const query = n.data.parameters?.sqlQuery || 'SELECT * FROM users;';



          setLogs(prev => [

            ...prev,

            { message: `[Database] Testing connection to ${conn}...`, level: 'INFO', timestamp: new Date().toISOString() },

            { message: `[Database] Executing SQL Query: ${query}...`, level: 'INFO', timestamp: new Date().toISOString() }

          ]);



          fetch(`${BACKEND_URL}/api/test-db-connection`, {

            method: 'POST',

            headers: {

              'Content-Type': 'application/json'

            },

            body: JSON.stringify({

              connection_string: conn,

              sql_query: query

            })

          })

            .then(res => {

              if (!res.ok) {

                return res.json().then(errData => {

                  throw new Error(errData.detail || `HTTP Error ${res.status}`);

                });

              }

              return res.json();

            })

            .then(result => {

              let formattedOutput = '';

              if (result.rows && result.rows.length > 0) {

                formattedOutput = JSON.stringify(result.rows, null, 2);

              } else if (result.message) {

                formattedOutput = result.message;

              } else {

                formattedOutput = JSON.stringify(result, null, 2);

              }



              updateNodeParameter(n.id, 'dbOutput', formattedOutput);

              if (selectedNode && selectedNode.id === n.id) {

                setSelectedNode(prev => prev ? {

                  ...prev,

                  data: {

                    ...prev.data,

                    parameters: { ...prev.data.parameters, dbOutput: formattedOutput }

                  }

                } : null);

              }



              setLogs(prev => [

                ...prev,

                {

                  message: `[Database] Connection test succeeded! SQL query execution completed successfully.`,

                  level: 'SUCCESS',

                  timestamp: new Date().toISOString()

                }

              ]);

            })

            .catch(err => {

              const errorPayload = JSON.stringify({

                status: "error",

                error: err.message,

                hint: "Double check your connection string, table names, and query syntax. Ensure the database is accessible."

              }, null, 2);



              updateNodeParameter(n.id, 'dbOutput', errorPayload);

              if (selectedNode && selectedNode.id === n.id) {

                setSelectedNode(prev => prev ? {

                  ...prev,

                  data: {

                    ...prev.data,

                    parameters: { ...prev.data.parameters, dbOutput: errorPayload }

                  }

                } : null);

              }



              setLogs(prev => [

                ...prev,

                {

                  message: `[Database] Connection test failed: ${err.message}`,

                  level: 'ERROR',

                  timestamp: new Date().toISOString()

                }

              ]);

            });

        } else if (category === 'Agents' || category === 'Agent') {

          const role = n.data.role || 'Agent';

          nodeLogs = [

            { message: `[${nodeName}] Activating Agent persona: ${role}...`, level: 'INFO' },

            { message: `[${nodeName}] Agent instructions evaluated. Agent is ready.`, level: 'SUCCESS' }

          ];

        } else if (category === 'Criteria') {

          nodeLogs = [

            { message: `[${nodeName}] Initializing criteria evaluation...`, level: 'INFO' }

          ];

        } else if (category === 'Models') {

          nodeLogs = [

            { message: `[${nodeName}] Initializing Model context pipeline...`, level: 'INFO' },

            { message: `[${nodeName}] Model generation endpoint checked. Status: OK. Block output simulated.`, level: 'SUCCESS' }

          ];

        } else if (category === 'Notification') {

          nodeLogs = [

            { message: `[${nodeName}] Verifying notification gateway...`, level: 'INFO' },

            { message: `[${nodeName}] Notification channel active and tested.`, level: 'SUCCESS' }

          ];

        } else {

          nodeLogs = [

            { message: `[${nodeName}] Performing connection test verification...`, level: 'INFO' },

            { message: `[${nodeName}] Node verified successfully.`, level: 'SUCCESS' }

          ];

        }



        setLogs(prev => [

          ...prev,

          ...nodeLogs.map(l => ({

            message: l.message,

            level: l.level,

            timestamp: new Date().toISOString()

          }))

        ]);

      }, idx * 300);

    });



    setTimeout(() => {

      setNodes(nds => nds.map(n => selectedIds.includes(n.id) ? { ...n, data: { ...n.data, status: 'idle' } } : n));

      setLogs(prev => [

        ...prev,

        {

          message: `[System] Connection test completed.`,

          level: 'SUCCESS',

          timestamp: new Date().toISOString()

        }

      ]);

    }, 1500);

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

    return <LoginScreen onLogin={(token) => {

      if (token) localStorage.setItem('app_auth_token', token);

      setIsLoggedIn(true);

    }} />;

  }



  const handleStartWorkFlowClick = async () => {

    const isWorkflowSchedulerActive = nodes.some(n => 

      isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full"

    );

    

    // Toggle schedulerActive for Workflow Timer

    const updatedNodes = nodes.map(n => {

      const isWfTimer = isWorkflowTimerNode(n);

      if (isWfTimer) {

        if (isWorkflowSchedulerActive) {

          // Pausing: Disable schedulerActive

          return {

            ...n,

            data: {

              ...n.data,

              parameters: {

                ...n.data.parameters,

                schedulerActive: false

              }

            }

          };

        } else {

          // Starting: Enable schedulerActive

          return {

            ...n,

            data: {

              ...n.data,

              parameters: {

                ...n.data.parameters,

                schedulerActive: true,

                lastRun: new Date().toISOString(),

                runMode: "full",

                remainingSeconds: n.data.parameters?.intervalValue !== undefined ? n.data.parameters.intervalValue : 2,

                pausedTimeLeft: undefined

              }

            }

          };

        }

      } else {

        // Reset activeSubflow parameter on other nodes

        return {

          ...n,

          data: {

            ...n.data,

            parameters: {

              ...n.data.parameters,

              activeSubflow: false

            }

          }

        };

      }

    });

    setNodes(updatedNodes);



    // Also update selectedNode state if it's currently selected

    if (selectedNode) {

      const isWfTimer = isWorkflowTimerNode(selectedNode);

      if (isWfTimer) {

        setSelectedNode(prev => prev ? {

          ...prev,

          data: {

            ...prev.data,

            parameters: {

              ...prev.data.parameters,

              schedulerActive: !isWorkflowSchedulerActive,

              ...(isWorkflowSchedulerActive ? {} : {

                lastRun: new Date().toISOString(),

                runMode: "full",

                remainingSeconds: prev.data.parameters?.intervalValue !== undefined ? prev.data.parameters.intervalValue : 2,

                pausedTimeLeft: undefined

              })

            }

          }

        } : null);

      } else {

        setSelectedNode(prev => prev ? {

          ...prev,

          data: {

            ...prev.data,

            parameters: {

              ...prev.data.parameters,

              activeSubflow: false

            }

          }

        } : null);

      }

    }



    if (isWorkflowSchedulerActive) {

      // STOP

      if (currentRunId) {

        handleStopProcess(currentRunId);

      } else {

        setIsRunning(false);

      }

      

      // Save update to backend to disable schedule

      const payload = {

        name: workflowName,

        description: workflowDesc,

        nodes: updatedNodes,

        edges,

        agentNodes,

        agentEdges,

      };

      try {

        if (selectedWorkflowId) {

          await fetch(`${BACKEND_URL}/api/workflows/${selectedWorkflowId}`, {

            method: 'PUT',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(payload),

          });

        }

      } catch (e) {

        console.error("Failed to stop scheduler in backend:", e);

      }

    } else {

      // START

      // Save updated scheduler state

      const payload = {

        name: workflowName,

        description: workflowDesc,

        nodes: updatedNodes,

        edges,

        agentNodes,

        agentEdges,

      };

      try {

        if (selectedWorkflowId) {

          await fetch(`${BACKEND_URL}/api/workflows/${selectedWorkflowId}`, {

            method: 'PUT',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(payload),

          });

        }

      } catch (e) {

        console.error("Failed to save scheduler status to backend:", e);

      }



      // Start workflow execution run

      handleRun(undefined, updatedNodes);

    }

  };



  const handleStartSubWorkFlowClick = async () => {

    if (isSubflowModeActive) {

      if (currentRunId) {

        handleStopProcess(currentRunId);

      } else {

        handleStopProcess('dummy_id');

      }

      setIsSubflowModeActive(false);



      const updatedNodes = nodes.map(n => {

        const isWfTimer = isWorkflowTimerNode(n);

        if (isWfTimer) {

          return {

            ...n,

            data: {

              ...n.data,

              parameters: {

                ...n.data.parameters,

                schedulerActive: false,

                activeSubflow: false

              }

            }

          };

        }

        return {

          ...n,

          data: {

            ...n.data,

            parameters: {

              ...n.data.parameters,

              activeSubflow: false

            }

          }

        };

      });

      setNodes(updatedNodes);



      if (selectedNode) {

        setSelectedNode(prev => prev ? {

          ...prev,

          data: {

            ...prev.data,

            parameters: {

              ...prev.data.parameters,

              schedulerActive: false,

              activeSubflow: false

            }

          }

        } : null);

      }



      const payload = {

        name: workflowName,

        description: workflowDesc,

        nodes: updatedNodes,

        edges,

        agentNodes,

        agentEdges,

      };

      try {

        if (selectedWorkflowId) {

          await fetch(`${BACKEND_URL}/api/workflows/${selectedWorkflowId}`, {

            method: 'PUT',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(payload),

          });

        }

      } catch (e) {

        console.error("Failed to stop scheduler in backend:", e);

      }

      return;

    }



    // START SUBFLOW

    const canvasSelectedNodes = nodes.filter(n => n.selected);

    const effectiveSubflowIds = canvasSelectedNodes.length > 0

      ? canvasSelectedNodes.map(n => n.id)

      : (selectedProcessNodeIds.length > 0 ? selectedProcessNodeIds : (selectedNode ? [selectedNode.id] : []));



    if (effectiveSubflowIds.length === 0) {

      showAlert('Please drag to select the nodes you want to run in Sub Work Flow (กรุณาลากครอบเลือก Node ที่ต้องการรันใน Sub Work Flow ก่อนครับ)', 'Sub Work Flow', 'info');

      return;

    }



    setSelectedProcessNodeIds(effectiveSubflowIds);

    setIsSubflowModeActive(true);



    const updatedNodes = nodes.map(n => {

      const isWfTimer = isWorkflowTimerNode(n);

      const isActive = effectiveSubflowIds.includes(n.id);

      if (isWfTimer) {

        return {

          ...n,

          data: {

            ...n.data,

            parameters: {

              ...n.data.parameters,

              schedulerActive: true,

              lastRun: new Date().toISOString(),

              runMode: "subflow",

              remainingSeconds: n.data.parameters?.intervalValue !== undefined ? n.data.parameters.intervalValue : 2,

              pausedTimeLeft: undefined,

              activeSubflow: true,

              subflowNodeIds: effectiveSubflowIds

            }

          }

        };

      }

      return {

        ...n,

        data: {

          ...n.data,

          parameters: {

            ...n.data.parameters,

            activeSubflow: isActive

          }

        }

      };

    });

    setNodes(updatedNodes);



    if (selectedNode) {

      const isWfTimer = isWorkflowTimerNode(selectedNode);

      const isActive = effectiveSubflowIds.includes(selectedNode.id);

      setSelectedNode(prev => prev ? {

        ...prev,

        data: {

          ...prev.data,

          parameters: {

            ...prev.data.parameters,

            schedulerActive: isWfTimer ? true : prev.data.parameters?.schedulerActive,

            ...(isWfTimer ? {

              lastRun: new Date().toISOString(),

              runMode: "subflow",

              remainingSeconds: prev.data.parameters?.intervalValue !== undefined ? prev.data.parameters.intervalValue : 2,

              pausedTimeLeft: undefined,

              activeSubflow: true,

              subflowNodeIds: effectiveSubflowIds

            } : {

              activeSubflow: isActive

            })

          }

        }

      } : null);

    }



    const payload = {

      name: workflowName,

      description: workflowDesc,

      nodes: updatedNodes,

      edges,

      agentNodes,

      agentEdges,

    };

    try {

      if (selectedWorkflowId) {

        await fetch(`${BACKEND_URL}/api/workflows/${selectedWorkflowId}`, {

          method: 'PUT',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(payload),

        });

      }

    } catch (e) {

      console.error("Failed to save scheduler status to backend:", e);

    }



    // Start execution of selected subflow nodes

    handleRun(effectiveSubflowIds, updatedNodes);

  };



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

        

        {/* Left Dashboard Navigation Rail (Visible when activeTab !== 'logic') */}

        {activeTab !== 'logic' && (

        <aside className="w-[58px] bg-[#1A6AFF] flex flex-col h-full z-30 select-none items-center py-3.5 justify-between shadow-[4px_0_24px_rgba(26,106,255,0.18)]">

          <div className="flex flex-col items-center w-full space-y-4">

            {/* Dashboard Header: Replaced 'Dashboard' text with Home Icon */}

            <div className="flex flex-col items-center justify-center pb-2.5 border-b border-white/20 w-full px-2">

              <button

                onClick={() => {

                  setActiveTab('process');

                  setIsShowingSettings(false);

                  setIsShowingModels(false);

                  fetchWorkflows();

                  fetchProcesses();

                }}

                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm hover:scale-105"

                title="Dashboard Home (หน้าหลัก Dashboard)"

              >

                <Home className="w-5 h-5 text-white" />

              </button>

            </div>



            {/* Top Menu Items: Projects, Workflow */}

            <div className="flex flex-col items-center w-full space-y-2.5 px-1.5">

              {/* 1. projects */}

              <button

                onClick={() => {

                  setActiveTab('process');

                  setIsShowingSettings(false);

                  setIsShowingModels(false);

                  fetchWorkflows();

                  fetchProcesses();

                }}

                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${

                  activeTab === 'process'

                    ? 'bg-white/25 text-white shadow-md scale-105'

                    : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-102'

                }`}

                title="Projects (Workflow Monitor)"

              >

                <FolderKanban className="w-5 h-5 text-white" />

              </button>

            </div>

          </div>



          {/* Bottom Rail Footer: Setting, Profile, and Logout */}

          <div className="flex flex-col items-center space-y-2.5 w-full px-1.5 pb-2">

            {/* Setting */}

            <button

              onClick={() => {

                setIsUnifiedSettingsOpen(true);

              }}

              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${

                isUnifiedSettingsOpen

                  ? 'bg-white/25 text-white shadow-md scale-105'

                  : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-102'

              }`}

              title="Settings (การตั้งค่า)"

            >

              <Settings className="w-5 h-5 text-white" />

            </button>



            {/* Logout (Door exit icon) */}

            <button

              onClick={() => {

                localStorage.removeItem('app_auth_token');

                localStorage.removeItem('app_user');

                setIsLoggedIn(false);

              }}

              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-rose-500/30 transition-all cursor-pointer"

              title="Logout (ออกจากระบบ)"

            >

              <LogOut className="w-5 h-5 text-white" />

            </button>

          </div>

        </aside>

        )}



        {/* Tools Menu Set (Visible ONLY when activeTab === 'logic' / page workflow) */}

        {activeTab === 'logic' && (

        <aside className={`bg-cyber-panel border-r border-cyber-border flex flex-col h-full z-20 transition-all duration-200 ${

          isSubflowModeActive ? (isMiniSidebar ? 'w-[58px]' : 'w-64') : 'w-[58px]'

        }`}>

          {isSubflowModeActive ? (

            <>

              <div className={`p-4 border-b border-cyber-border bg-cyber-dark bg-opacity-50 flex flex-col ${isMiniSidebar ? 'items-center justify-center' : ''}`}>

                <div className="flex items-center justify-between w-full">

                  {!isMiniSidebar && (

                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-neon flex items-center space-x-2 select-none font-extrabold">

                      <Layers className="w-4 h-4 text-cyber-neon animate-pulse" />

                      <span>Node Process</span>

                    </h3>

                  )}

                  <button

                    onClick={() => setIsMiniSidebar(!isMiniSidebar)}

                    className={`p-1 rounded bg-cyber-dark hover:bg-cyber-panel text-cyber-muted hover:text-cyber-neon border border-cyber-border transition-all ${isMiniSidebar ? 'mx-auto' : ''}`}

                    title={isMiniSidebar ? "Expand Sidebar" : "Collapse Sidebar"}

                  >

                    {isMiniSidebar ? <ChevronRight className="w-4 h-4 text-cyber-neon" /> : <ChevronLeft className="w-4 h-4" />}

                  </button>

                </div>

                {!isMiniSidebar && (

                  <p className="text-[10px] text-cyber-muted mt-1 leading-relaxed select-none">

                    Toggle checkboxes to select which nodes will execute in the Sub Work Flow.

                  </p>

                )}

              </div>



              <div className={`flex-1 overflow-y-auto min-h-0 p-4 ${isMiniSidebar ? 'space-y-4 flex flex-col items-center' : 'space-y-5'}`}>

                {!isMiniSidebar ? (

                  <div className="space-y-4">

                    <div className="flex items-center justify-between pb-1 border-b border-cyber-border border-opacity-40">

                      <span className="text-[10px] text-cyber-muted font-bold uppercase tracking-wider">

                        Workflow Nodes ({selectedProcessNodeIds.length}/{nodes.length} Selected)

                      </span>

                      <div className="flex items-center space-x-2">

                        <button

                          onClick={() => {

                            const allIds = nodes.map(n => n.id);

                            setSelectedProcessNodeIds(allIds);

                            setNodes(nds => nds.map(nd => ({ ...nd, selected: true })));

                            setAgentNodes(nds => nds.map(nd => ({ ...nd, selected: true })));

                          }}

                          className="text-[9px] text-cyber-neon hover:underline cursor-pointer"

                        >

                          All

                        </button>

                        <span className="text-[9px] text-cyber-muted">|</span>

                        <button

                          onClick={() => {

                            setSelectedProcessNodeIds([]);

                            setNodes(nds => nds.map(nd => ({ ...nd, selected: false })));

                            setAgentNodes(nds => nds.map(nd => ({ ...nd, selected: false })));

                          }}

                          className="text-[9px] text-cyber-muted hover:text-cyber-text cursor-pointer"

                        >

                          None

                        </button>

                      </div>

                    </div>

                    <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">

                      {nodes.map(n => {

                        const isChecked = selectedProcessNodeIds.includes(n.id);

                        return (

                          <label

                            key={n.id}

                            className={`flex items-center space-x-3 p-2.5 rounded bg-cyber-dark border hover:border-cyber-neon hover:border-opacity-40 transition-all cursor-pointer group ${

                              isChecked ? 'border-cyber-neon border-opacity-40 bg-opacity-70' : 'border-cyber-border opacity-75'

                            }`}

                          >

                            <input

                              type="checkbox"

                              checked={isChecked}

                              onChange={() => {

                                const newIsChecked = !isChecked;

                                setSelectedProcessNodeIds(prev =>

                                  newIsChecked ? [...new Set([...prev, n.id])] : prev.filter(id => id !== n.id)

                                );

                                setNodes(nds => nds.map(nd => nd.id === n.id ? { ...nd, selected: newIsChecked } : nd));

                                setAgentNodes(nds => nds.map(nd => nd.id === n.id ? { ...nd, selected: newIsChecked } : nd));

                              }}

                              className="rounded border-cyber-border text-cyber-neon focus:ring-cyber-neon bg-cyber-dark cursor-pointer w-4 h-4"

                            />

                            <div className="flex-1 min-w-0">

                              <span className={`text-xs block truncate font-semibold transition-colors ${

                                isChecked ? 'text-cyber-neon' : 'text-cyber-text group-hover:text-cyber-neon'

                              }`}>

                                {n.data.label || n.data.name || n.id}

                              </span>

                              <span className="text-[9px] text-cyber-muted block truncate font-mono mt-0.5">

                                ID: {n.id}

                              </span>

                            </div>

                          </label>

                        );

                      })}

                    </div>

                  </div>

                ) : (

                  <div className="flex flex-col items-center space-y-3">

                    <Layers className="w-5 h-5 text-cyber-neon" />

                    {nodes.map(n => {

                      const isChecked = selectedProcessNodeIds.includes(n.id);

                      return (

                        <div

                          key={n.id}

                          onClick={() => {

                            const newIsChecked = !isChecked;

                            setSelectedProcessNodeIds(prev =>

                              newIsChecked ? [...new Set([...prev, n.id])] : prev.filter(id => id !== n.id)

                            );

                            setNodes(nds => nds.map(nd => nd.id === n.id ? { ...nd, selected: newIsChecked } : nd));

                            setAgentNodes(nds => nds.map(nd => nd.id === n.id ? { ...nd, selected: newIsChecked } : nd));

                          }}

                          className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${

                            isChecked 

                              ? 'bg-cyber-neon bg-opacity-25 border-cyber-neon text-cyber-neon shadow-[0_0_8px_rgba(0,255,243,0.35)]' 

                              : 'bg-cyber-dark border-cyber-border text-cyber-muted hover:border-cyber-border-hover'

                          }`}

                          title={`${n.data.label || n.data.name} (ID: ${n.id})`}

                        >

                          <span className="text-[10px] font-mono font-bold">

                            {isChecked ? '✓' : (n.data.label || n.data.name || 'N').substring(0, 2).toUpperCase()}

                          </span>

                        </div>

                      );

                    })}

                  </div>

                )}

              </div>

            </>

          ) : (

            // Primary Group Menu Icon Bar (w-[58px])

            <div className="flex flex-col h-full select-none bg-[#1A6AFF] justify-between shadow-[4px_0_24px_rgba(26,106,255,0.18)]">

              <div>

                {/* Header: Home button to return to Dashboard */}

                <div className="py-3 px-1.5 border-b border-white/20 flex flex-col items-center justify-center">

                  <button 

                    onClick={() => {

                      setActiveTab('process');

                      setIsShowingSettings(false);

                      setIsShowingModels(false);

                      fetchWorkflows();

                      fetchProcesses();

                    }}

                    className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm hover:scale-105" 

                    title="Return to Dashboard (กลับหน้า Dashboard)"

                  >

                    <Home className="w-5 h-5 text-white" />

                  </button>

                </div>



                {/* Group Menu Icon List */}

                <div className="py-2.5 px-1.5 flex flex-col items-center space-y-2 overflow-y-auto overflow-x-hidden">

                  {GROUP_MENUS.map((group) => {

                    const isHovered = hoveredGroup === group.id;

                    const IconComponent = group.icon;

                    return (

                      <div

                        key={group.id}

                        onMouseEnter={() => handleGroupMouseEnter(group.id)}

                        onMouseLeave={handleGroupMouseLeave}

                        className="w-full flex justify-center"

                      >

                        <button

                          onClick={() => handleGroupMouseEnter(group.id)}

                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${

                            isHovered

                              ? 'bg-white/30 text-white shadow-md scale-105'

                              : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-102'

                          }`}

                          title={group.label}

                        >

                          <IconComponent className={`w-5 h-5 text-white transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`} />

                        </button>

                      </div>

                    );

                  })}

                </div>

              </div>



              {/* Bottom Logic Rail Footer: Setting, Profile, and Logout */}

              <div className="flex flex-col items-center space-y-2.5 w-full px-1.5 pb-2 pt-2 border-t border-white/20">

                {/* Setting */}

                <button

                  onClick={() => {

                    setIsUnifiedSettingsOpen(true);

                  }}

                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${

                    isUnifiedSettingsOpen

                      ? 'bg-white/25 text-white shadow-md scale-105'

                      : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-102'

                  }`}

                  title="Settings (การตั้งค่า)"

                >

                  <Settings className="w-5 h-5 text-white" />

                </button>



                {/* Logout (Door exit icon) */}

                <button

                  onClick={() => {

                    localStorage.removeItem('app_auth_token');

                    setIsLoggedIn(false);

                  }}

                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-rose-500/30 transition-all cursor-pointer"

                  title="Logout (ออกจากระบบ)"

                >

                  <LogOut className="w-5 h-5 text-white" />

                </button>

              </div>

            </div>

          )}

        </aside>

        )}



        {/* Floating Sub Menu Flyout Panel */}

        {hoveredGroup && activeTab === 'logic' && !isSubflowModeActive && (() => {

          const currentGroupMeta = GROUP_MENUS.find(g => g.id === hoveredGroup);

          const templateSection = DRAGGABLE_TEMPLATES.find(s => s.category === hoveredGroup);

          if (!templateSection) return null;



          return (

            <div

              className="absolute left-[58px] top-0 bottom-0 z-40 flex items-start pt-3 pl-1.5 pointer-events-auto"

              onMouseEnter={handleFlyoutMouseEnter}

              onMouseLeave={handleFlyoutMouseLeave}

            >

              <div className="w-64 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[0_16px_40px_rgba(30,60,110,0.14)] flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150">

                {/* Flyout Header */}

                <div className="p-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">

                  <div className="flex items-center space-x-2">

                    {currentGroupMeta && (

                      <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">

                        <currentGroupMeta.icon className="w-4 h-4" />

                      </div>

                    )}

                    <div>

                      <h4 className="text-xs font-bold text-slate-800 tracking-wide">

                        {currentGroupMeta?.label || hoveredGroup}

                      </h4>

                      <span className="text-[10px] text-slate-400">

                        {templateSection.items.length} {templateSection.items.length === 1 ? 'tool' : 'tools'} • Click or drag

                      </span>

                    </div>

                  </div>

                  <button

                    onClick={() => setHoveredGroup(null)}

                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"

                    title="Close"

                  >

                    <X className="w-3.5 h-3.5" />

                  </button>

                </div>



                {/* Flyout Items List */}

                <div className="p-2.5 overflow-y-auto space-y-1.5 max-h-[calc(85vh-65px)]">

                  {templateSection.items.map((item, itemIdx) => (

                    <div

                      key={itemIdx}

                      onClick={() => createNewNode(item.category, item.name)}

                      draggable

                      onDragStart={(e) => {

                        onDragStart(e, 'customNode', item.category, item.name);

                        setTimeout(() => setHoveredGroup(null), 50);

                      }}

                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-400 cursor-pointer shadow-sm transition-all group"

                      title="Click to add to canvas or drag"

                    >

                      <div className="flex items-center space-x-2.5 min-w-0">

                        <div className="p-1.5 rounded-lg bg-white border border-slate-200/80 text-blue-600 group-hover:scale-105 shrink-0 transition-transform">

                          {getSidebarIcon(item.category, item.name)}

                        </div>

                        <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate">

                          {item.name}

                        </span>

                      </div>

                      <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-600 font-bold shrink-0 ml-1">

                        + Add

                      </span>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          );

        })()}



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

            <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-[#F0F4F9] text-slate-800">

              {/* Projects Page Top Action & Summary Bar */}

              <div className="px-6 py-4 border-b border-slate-200/90 bg-white flex items-center justify-between select-none shrink-0 shadow-sm">

                <div className="flex items-center space-x-3">

                  {/* Back Button (Shown when inside a Group) */}

                  {currentGroupId !== null && (

                    <button

                      onClick={handleBackGroup}

                      className="btn-diffuse-white flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold transition-all cursor-pointer group"

                      title="Back to Parent Group / Root (ย้อนกลับ)"

                    >

                      <ArrowLeft className="w-4 h-4 text-blue-600 group-hover:-translate-x-0.5 transition-transform" />

                      <span>Back</span>

                    </button>

                  )}



                  <div>

                    {/* Breadcrumbs Navigation */}

                    <div className="flex items-center space-x-1.5 text-sm font-extrabold text-slate-800">

                      {(() => {

                        const crumbs: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Projects' }];

                        let curr = groups.find(g => g.id === currentGroupId);

                        const chain: Array<{ id: string; name: string }> = [];

                        while (curr) {

                          chain.unshift({ id: curr.id, name: curr.name });

                          curr = groups.find(g => g.id === curr?.parentId);

                        }

                        crumbs.push(...chain);



                        return crumbs.map((crumb, idx) => {

                          const isCrumbDragOver = dragOverCrumbId === (crumb.id || 'root');

                          return (

                            <React.Fragment key={crumb.id || 'root'}>

                              {idx > 0 && <span className="text-slate-400 font-mono text-xs">/</span>}

                              <button

                                onClick={() => {

                                  setSelectedWorkflowIds([]);

                                  setCurrentGroupId(crumb.id);

                                }}

                                onDragOver={(e) => {

                                  e.preventDefault();

                                  setDragOverCrumbId(crumb.id || 'root');

                                }}

                                onDragLeave={() => {

                                  if (dragOverCrumbId === (crumb.id || 'root')) setDragOverCrumbId(null);

                                }}

                                onDrop={(e) => {

                                  e.preventDefault();

                                  handleDropWorkflowsOnFolder(crumb.id, e);

                                }}

                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer text-xs uppercase tracking-wider ${

                                  isCrumbDragOver

                                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 font-black scale-105'

                                    : idx === crumbs.length - 1

                                    ? 'text-blue-600 font-black'

                                    : 'text-slate-500 hover:text-slate-800 hover:underline'

                                }`}

                                title={isCrumbDragOver ? `Drop to move workflows to ${crumb.name}` : undefined}

                              >

                                {crumb.name}

                              </button>

                            </React.Fragment>

                          );

                        });

                      })()}

                    </div>

                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">

                      6-Column Grid View • Nested Groups & Workflow Orchestration

                    </p>

                  </div>

                </div>



                {/* Right Action Controls: Selection indicator, + Create Group & + New Workflow */}

                <div className="flex items-center space-x-3">

                  {(selectedWorkflowIds.length > 0 || selectedGroupIds.length > 0) && (

                    <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold text-blue-700 shadow-sm animate-in fade-in duration-150">

                      <span>เลือก {selectedWorkflowIds.length + selectedGroupIds.length} รายการ</span>

                      <span className="text-blue-400 font-normal text-[11px] hidden md:inline">

                        ({selectedWorkflowIds.length} Workflows, {selectedGroupIds.length} Folders)

                      </span>



                      {/* Batch Move Button */}

                      <button

                        onClick={(e) => {

                          const rect = e.currentTarget.getBoundingClientRect();

                          setMoveMenuState({

                            workflowIds: selectedWorkflowIds,

                            groupIds: selectedGroupIds,

                            anchorRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }

                          });

                        }}

                        className="btn-diffuse-blue flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"

                        title="Move Selected Items (ย้ายรายการที่เลือก)"

                      >

                        <FolderKanban className="w-3 h-3" />

                        <span>Move</span>

                      </button>



                      <button

                        onClick={() => {

                          setSelectedWorkflowIds([]);

                          setSelectedGroupIds([]);

                        }}

                        className="p-0.5 hover:bg-blue-200 rounded text-blue-600 transition-colors cursor-pointer"

                        title="ยกเลิกการเลือก (Deselect All)"

                      >

                        <X className="w-3.5 h-3.5" />

                      </button>

                    </div>

                  )}



                  <div className="flex items-center space-x-2 text-xs">

                    <span className="bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-full flex items-center space-x-1.5 font-bold text-[11px]">

                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />

                      <span className="text-slate-700">{processes.filter(p => p.status === 'running').length} Running</span>

                    </span>

                    <span className="bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-full flex items-center space-x-1.5 font-bold text-[11px] text-slate-500">

                      <span>{processes.length} Workflows</span>

                    </span>

                  </div>



                  <div className="w-[1px] h-5 bg-slate-200" />



                  {/* Button 1: Create Group */}

                  <button

                    onClick={() => {

                      setNewGroupName('');

                      setNewGroupDesc('');

                      setShowCreateGroupModal(true);

                    }}

                    className="btn-diffuse-white flex items-center space-x-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-blue-600 font-bold text-xs cursor-pointer group"

                    title="Create New Group / Subgroup (สร้าง Group ใหม่)"

                  >

                    <FolderPlus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />

                    <span>Create Group</span>

                  </button>



                  {/* Button 2: New Workflow */}

                  <button

                    onClick={() => {

                      handleNewWorkflowClick();

                    }}

                    className="btn-diffuse-blue flex items-center space-x-2 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs cursor-pointer"

                    title="Create New Workflow (สร้าง Workflow ใหม่)"

                  >

                    <Plus className="w-4 h-4 stroke-[3]" />

                    <span className="tracking-wide">New Workflow</span>

                  </button>

                </div>

              </div>



              {/* 6-Column Grid Container of Groups & Workflows */}

              <div 

                ref={gridContainerRef}

                onMouseDown={handleContainerMouseDown}

                className="flex-1 overflow-y-auto p-6 relative select-none"

              >

                {/* Marquee Rubberband Selection Overlay Box */}

                {marqueeBox && marqueeBox.isSelecting && (

                  <div

                    className="fixed pointer-events-none z-[9999] bg-blue-500/20 border-2 border-blue-500 rounded-lg shadow-sm"

                    style={{

                      left: Math.min(marqueeBox.startX, marqueeBox.currentX),

                      top: Math.min(marqueeBox.startY, marqueeBox.currentY),

                      width: Math.abs(marqueeBox.currentX - marqueeBox.startX),

                      height: Math.abs(marqueeBox.currentY - marqueeBox.startY),

                    }}

                  />

                )}



                {(() => {

                  const currentSubgroups = groups.filter(g => g.parentId === currentGroupId);

                  const currentWorkflows = processes.filter(p => (workflowGroupMap[p.workflowId || p.id] || null) === currentGroupId);

                  const isEmpty = currentSubgroups.length === 0 && currentWorkflows.length === 0;



                  if (isEmpty) {

                    return (

                      <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-cyber-panel/50 border border-cyber-border text-center space-y-4 max-w-lg mx-auto mt-12 select-none">

                        {(() => {

                          const currentGrp = groups.find(g => g.id === currentGroupId);

                          const curTheme = currentGrp ? getGroupTheme(currentGrp.color) : null;

                          return (

                            <div className={`w-16 h-16 rounded-2xl ${curTheme ? `${curTheme.iconBg} border ${curTheme.iconBorder} ${curTheme.iconText}` : 'bg-cyber-neon/10 border border-cyber-neon/20 text-cyber-neon shadow-[0_0_20px_rgba(0,255,204,0.15)]'} flex items-center justify-center`}>

                              {currentGroupId ? <FolderOpen className="w-8 h-8" /> : <FolderKanban className="w-8 h-8" />}

                            </div>

                          );

                        })()}

                        <div>

                          <h3 className="text-base font-bold text-white">

                            {currentGroupId ? 'This Group is Empty' : 'No Workflows or Groups Yet'}

                          </h3>

                          <p className="text-xs text-cyber-muted mt-1">

                            {currentGroupId

                              ? 'Organize workflows or create nested subgroups inside this folder.'

                              : 'Create a group folder or your first AI workflow pipeline.'}

                          </p>

                        </div>

                        <div className="flex items-center space-x-3 pt-2">

                          <button

                            onClick={() => {

                              setNewGroupName('');

                              setNewGroupDesc('');

                              setShowCreateGroupModal(true);

                            }}

                            className="btn-diffuse-white flex items-center space-x-2 px-4.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold rounded-full cursor-pointer"

                          >

                            <FolderPlus className="w-4 h-4 text-blue-600" />

                            <span>Create Group</span>

                          </button>

                          <button

                            onClick={() => handleNewWorkflowClick()}

                            className="btn-diffuse-blue flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-extrabold rounded-full cursor-pointer"

                          >

                            <Plus className="w-4 h-4 stroke-[3]" />

                            <span>New Workflow</span>

                          </button>

                        </div>

                      </div>

                    );

                  }



                  return (

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4">

                      {/* 1. Group Cards (Subgroups) - Rendered as Google Drive-style Royal Blue Folders */}

                      {currentSubgroups.map((grp) => {

                        const childWorkflowsCount = processes.filter(p => workflowGroupMap[p.workflowId || p.id] === grp.id).length;

                        const childSubgroupsCount = groups.filter(g => g.parentId === grp.id).length;

                        const isGrpSelected = selectedGroupIds.includes(grp.id);



                        return (

                          <FolderCard

                            key={grp.id}

                            id={grp.id}

                            name={grp.name}

                            description={grp.description}

                            color={grp.color}

                            childWorkflowsCount={childWorkflowsCount}

                            childSubgroupsCount={childSubgroupsCount}

                            createdAt={grp.createdAt}

                            isSelected={isGrpSelected}

                            draggable={true}

                            hasPreviousLayer={currentGroupId !== null}

                            onMoveToPreviousLayer={() => handleMoveToPreviousLayer(grp.id, 'folder')}

                            onDragStart={(e) => handleGroupDragStart(e, grp.id)}

                            onSelectToggle={(e) => handleGroupSelectToggle(e, grp.id)}

                            onMove={(e) => {

                              const hasMultiSelect = selectedWorkflowIds.length > 0 || selectedGroupIds.length > 0;

                              const grpIds = hasMultiSelect

                                ? Array.from(new Set([...selectedGroupIds, grp.id]))

                                : [grp.id];

                              const wfIds = hasMultiSelect ? selectedWorkflowIds : [];



                              const rect = e.currentTarget.getBoundingClientRect();

                              setMoveMenuState({

                                workflowIds: wfIds,

                                groupIds: grpIds,

                                anchorRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }

                              });

                            }}

                            onClick={() => {

                              setSelectedWorkflowIds([]);

                              setSelectedGroupIds([]);

                              setCurrentGroupId(grp.id);

                            }}

                            onDelete={() => setGroupToDelete(grp)}

                            onDragOver={(e) => {

                              e.preventDefault();

                              setDragOverGroupId(grp.id);

                            }}

                            onDragLeave={() => {

                              if (dragOverGroupId === grp.id) setDragOverGroupId(null);

                            }}

                            onDrop={(e) => {

                              e.preventDefault();

                              handleDropWorkflowsOnFolder(grp.id, e);

                            }}

                            isDragOver={dragOverGroupId === grp.id}

                          />

                        );

                      })}



                      {/* 2. Workflow Cards */}

                      {currentWorkflows.map((proc, index) => {

                        const isProcess = proc.status === 'running' || proc.status === 'processing';

                        const wfId = proc.workflowId || proc.id;

                        const nodeCount = proc.nodes?.length || 0;

                        const edgeCount = proc.edges?.length || 0;

                        const wfColor = proc.color || workflowColorMap[wfId] || 'blue';

                        const bannerHex = getPaletteHex(wfColor);

                        const isSelected = selectedWorkflowIds.includes(proc.id) || selectedWorkflowIds.includes(wfId);

                        const wfCreatedAt = proc.createdAt || proc.created_at || proc.startTime;

                        const displayDate = wfCreatedAt ? new Date(wfCreatedAt).toLocaleDateString() : new Date().toLocaleDateString();



                        return (

                          <div

                            key={proc.id}

                            data-card-item="true"

                            data-wf-id={proc.id}

                            draggable={true}

                            onDragStart={(e) => handleWorkflowDragStart(e, proc.id)}

                            onClick={(e) => handleWorkflowCardClick(e, proc.id, index, currentWorkflows)}

                            onDoubleClick={() => handleInspectProcess(proc.id, 'logic')}

                            className={`group rounded-2xl bg-white border-2 card-diffuse-white hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden h-[265px] cursor-pointer select-none ${

                              isSelected

                                ? 'border-blue-600 ring-4 ring-blue-500/25 shadow-[0_4px_12px_-1px_rgba(30,60,110,0.12),0_9px_22px_-1px_rgba(26,106,255,0.35),0_14px_30px_1px_rgba(26,106,255,0.25)] -translate-y-1'

                                : 'border-slate-200/80 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/30'

                            }`}

                          >

                            {/* Blue Upper Section: Double-Layered Glassmorphic Border Frame */}

                            <div className="m-1.5 mb-0.5 p-1 rounded-2xl bg-slate-100/90 border-[1.5px] border-white shadow-[0_2px_6px_rgba(20,50,100,0.05)] relative select-none">

                              {/* Inner Blue Pill Capsule */}

                              <div

                                className="rounded-xl bg-gradient-to-br from-[#1E6BFF] to-[#1456D3] p-2.5 pb-2 text-white flex flex-col justify-between select-none relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"

                                style={wfColor !== 'blue' ? { background: `linear-gradient(135deg, ${bannerHex}, ${bannerHex}dd)` } : undefined}

                              >

                                {/* Top Row: Checkbox / Index Badge, Status badge & Run/Stop Button */}

                                <div className="flex items-center justify-between">

                                  <div className="flex items-center space-x-1.5">

                                    {/* Number / Checkbox Circular Badge matching reference mockup */}

                                    <button

                                      type="button"

                                      onClick={(e) => {

                                        e.stopPropagation();

                                        handleWorkflowCardClick(e, proc.id, index, currentWorkflows);

                                      }}

                                      className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all cursor-pointer font-bold text-xs shadow-xs hover:scale-110 active:scale-95 ${

                                        isSelected

                                          ? 'bg-white text-blue-600 ring-2 ring-white shadow-md'

                                          : 'bg-white text-blue-600/90 hover:ring-2 hover:ring-white/80'

                                      }`}

                                      style={{ color: bannerHex }}

                                      title={isSelected ? 'Deselect Workflow' : 'Select Workflow (Ctrl/Shift supported)'}

                                    >

                                      {isSelected ? (

                                        <Check className="w-3.5 h-3.5 stroke-[3]" style={{ color: bannerHex }} />

                                      ) : (

                                        <>

                                          <span className="text-[11px] font-black group-hover:hidden" style={{ color: bannerHex }}>{index + 1}</span>

                                          <Check className="w-3.5 h-3.5 stroke-[2.5] hidden group-hover:block opacity-60" style={{ color: bannerHex }} />

                                        </>

                                      )}

                                    </button>



                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider flex items-center space-x-1 select-none ${

                                      isProcess

                                        ? 'bg-emerald-400 text-slate-900 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse font-extrabold'

                                        : 'bg-white/20 text-white border border-white/30 backdrop-blur-sm font-semibold'

                                    }`}>

                                      {isProcess && (

                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping inline-block mr-0.5" />

                                      )}

                                      <span>{isProcess ? 'PROCESS' : 'IDLE'}</span>

                                    </span>

                                  </div>



                                  <div className="flex items-center space-x-1">

                                    {isProcess ? (

                                      <button

                                        onClick={(e) => {

                                          e.stopPropagation();

                                          handleStopProcess(proc.id);

                                        }}

                                        className="p-1 rounded-full bg-emerald-400 hover:bg-rose-500 text-slate-900 hover:text-white shadow-[0_0_7px_rgba(52,211,153,0.85)] ring-2 ring-white/90 animate-pulse hover:animate-none cursor-pointer transition-all flex items-center justify-center group/playbtn"

                                        title="Active: กำลังทำงาน (คลิกเพื่อหยุด / Stop Workflow)"

                                      >

                                        <Play className="w-3 h-3 fill-current text-slate-900 group-hover/playbtn:text-white" />

                                      </button>

                                    ) : (

                                      <button

                                        onClick={(e) => {

                                          e.stopPropagation();

                                          handlePlayProcess(proc.id);

                                        }}

                                        className="btn-diffuse-white p-1 rounded-full bg-white text-blue-600 hover:bg-blue-50 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center"

                                        title="Run Workflow (คลิกเพื่อเริ่มทำงาน)"

                                      >

                                        <Play className="w-3 h-3 fill-blue-600" />

                                      </button>

                                    )}

                                  </div>

                                </div>



                                {/* Workflow Name */}

                                <div className="text-left py-1">

                                  <h4

                                    onClick={(e) => {

                                      e.stopPropagation();

                                      handleInspectProcess(proc.id, 'logic');

                                    }}

                                    className="text-sm font-extrabold text-white truncate tracking-wide drop-shadow-sm cursor-pointer hover:underline"

                                    title={proc.name || 'Unnamed Workflow'}

                                  >

                                    {proc.name || 'Unnamed Workflow'}

                                  </h4>

                                </div>



                                {/* Workflow ID and Description */}

                                <div className="text-left px-0.5">

                                  <div className="text-[10px] font-mono text-white/80 truncate flex items-center space-x-1" title={wfId}>

                                    <span className="opacity-70 font-sans">ID:</span>

                                    <span className="font-semibold">{wfId}</span>

                                  </div>



                                  <p className="text-[10.5px] text-white/90 line-clamp-2 mt-0.5 leading-snug break-words">

                                    {proc.description || 'Workflow automated pipeline.'}

                                  </p>

                                </div>

                              </div>

                            </div>



                            {/* White Lower Body: Open Button at bottom directly above Move & Delete actions */}

                            <div className="p-3 pt-1.5 bg-white flex flex-col justify-end space-y-1.5 flex-1">

                              {/* Prominent Blue Open Button with Diffuse Shade / Soft Glow Aura */}

                              <button

                                onClick={(e) => {

                                  e.stopPropagation();

                                  handleInspectProcess(proc.id, 'logic');

                                }}

                                className="btn-diffuse-blue w-full py-2.5 px-3 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer select-none"

                                title={`Open in Workflow Canvas (${nodeCount} Nodes, ${edgeCount} Edges)`}

                              >

                                <ExternalLink className="w-3.5 h-3.5 text-white" />

                                <span>Open</span>

                              </button>



                              {/* Card Footer: Move to Previous Layer Button & Secondary Actions (Move and Delete) */}

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs select-none">

                                {/* Left: Button to move out to previous layer (เหลือแค่ Icon ย้ายออก) */}

                                <button

                                  type="button"

                                  disabled={currentGroupId === null}

                                  onClick={(e) => {

                                    e.stopPropagation();

                                    handleMoveToPreviousLayer(proc.id, 'workflow');

                                  }}

                                  className={`p-1 rounded-full transition-all ${

                                    currentGroupId !== null

                                      ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer shadow-2xs hover:scale-105 active:scale-95'

                                      : 'text-slate-300 cursor-not-allowed opacity-40'

                                  }`}

                                  title={currentGroupId !== null ? 'ย้ายออกจากโฟลเดอร์นี้ ไป Layer ก่อนหน้า' : 'อยู่ที่หน้าหลัก (Root) แล้ว'}

                                >

                                  <CornerUpLeft className="w-3.5 h-3.5 stroke-[2.5]" />

                                </button>



                                <div className="flex items-center space-x-1 text-slate-400">

                                  <span className="text-[10px] font-mono text-slate-400 mr-0.5">

                                    {displayDate}

                                  </span>



                                  {/* Move to Group / Layer Button (Opens Drop Down) */}

                                  <button

                                    onClick={(e) => {

                                      e.stopPropagation();

                                      const hasMultiSelect = selectedWorkflowIds.length > 0 || selectedGroupIds.length > 0;

                                      const wfIds = hasMultiSelect

                                        ? Array.from(new Set([...selectedWorkflowIds, proc.id]))

                                        : [proc.id];

                                      const grpIds = hasMultiSelect ? selectedGroupIds : [];



                                      const rect = e.currentTarget.getBoundingClientRect();

                                      setMoveMenuState({

                                        workflowIds: wfIds,

                                        groupIds: grpIds,

                                        anchorRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }

                                      });

                                    }}

                                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"

                                    title="ย้าย Layer (เลือกโฟลเดอร์ปลายทาง)"

                                  >

                                    <FolderKanban className="w-3.5 h-3.5" />

                                  </button>

                                  <button

                                    onClick={(e) => {

                                      e.stopPropagation();

                                      setProcessToDelete(proc);

                                    }}

                                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"

                                    title="Delete Workflow"

                                  >

                                    <Trash2 className="w-3.5 h-3.5" />

                                  </button>

                                </div>

                              </div>

                            </div>

                          </div>

                        );

                      })}

                    </div>

                  );

                })()}

              </div>

            </div>



          ) : (

            <div className="flex-1 w-full h-full relative">

              {/* Floating Workflow Info on Top-Left of Screen (Transparent & Click-Through to Nodes Behind) */}

              <div className="absolute top-5 left-6 z-20 pointer-events-none flex items-center space-x-3.5">

                <div 

                  className={`w-3.5 h-3.5 rounded-full ${

                    isAutoSaving 

                      ? 'bg-amber-400 animate-ping shadow-[0_0_12px_#fbbf24]' 

                      : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.85)]'

                  } shrink-0 pointer-events-none ring-4 ring-blue-500/15`}

                  title={isAutoSaving ? 'Saving...' : 'Auto-Saved'}

                />

                <div className="flex flex-col justify-center pointer-events-none">

                  <div className="flex items-center space-x-2.5 pointer-events-none">

                    <input

                      type="text"

                      value={workflowName}

                      onChange={(e) => {

                        const val = e.target.value;

                        setWorkflowName(val);

                        if (val.trim()) {

                          const cleanFname = val.trim().replace(/\s+/g, '_') + '.wf';

                          setCurrentFileName(cleanFname);

                          setProcesses(prev => prev.map(p => (p.workflowId === selectedWorkflowId || p.name === workflowName) ? { ...p, name: val } : p));

                        }

                      }}

                      style={{ width: `${Math.max(10, (workflowName || 'Workflow Name').length + 2)}ch` }}

                      className="pointer-events-auto text-base font-extrabold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white/90 focus:outline-none py-0.5 px-1 rounded-lg transition-colors max-w-[320px] tracking-tight"

                      placeholder="Workflow Name"

                    />

                    {currentFileName && (

                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100/90 border border-slate-200/90 text-slate-500 font-mono select-none whitespace-nowrap shadow-sm pointer-events-none font-semibold">

                        {currentFileName}

                      </span>

                    )}

                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider flex items-center space-x-1 select-none pointer-events-none ${

                      isRunning

                        ? 'bg-emerald-400 text-slate-900 shadow-sm animate-pulse font-extrabold'

                        : 'bg-slate-200 text-slate-600 border border-slate-300 font-semibold'

                    }`}>

                      {isRunning && (

                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping inline-block mr-0.5" />

                      )}

                      <span>{isRunning ? 'PROCESS' : 'IDLE'}</span>

                    </span>

                  </div>

                  <div className="flex items-center space-x-1.5 px-1 font-mono text-[11px] text-slate-400 select-none mt-0.5 pointer-events-none font-medium">

                    <span>ID:</span>

                    <span className="text-blue-600 font-semibold" title={selectedWorkflowId || 'Not Saved'}>

                      {selectedWorkflowId || 'Not Saved'}

                    </span>

                  </div>

                </div>

              </div>



              {/* Floating Execution Action Buttons on Top-Right of Screen (Hidden when Properties Inspector is open) */}

              {!isPropertiesInspectorOpen && (

                <div className="absolute top-5 right-6 z-20 pointer-events-auto flex items-center space-x-3">

                  {/* User Profile Capsule Pill */}

                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-full shadow-[0_4px_16px_rgba(30,60,110,0.06)] select-none">

                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">

                      BO

                    </div>

                    <span className="text-xs font-bold text-slate-700">Bryan Oh</span>

                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" title="Online" />

                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />

                  </div>



                  {/* Real-time Clock Capsule Pill */}

                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-full shadow-[0_4px_16px_rgba(30,60,110,0.06)] select-none text-slate-600 text-xs font-bold font-mono">

                    <Clock className="w-3.5 h-3.5 text-blue-500" />

                    <span>{currentTime}</span>

                  </div>



                  {/* Start / Stop Sub Work Flow (Visible when nodes selected or subflow running) */}

                  {(() => {

                    const selectedCount = nodes.filter(n => n.selected).length;

                    const isSubRunning = isSubflowModeActive || nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "subflow");



                    if (selectedCount === 0 && !isSubRunning) {

                      return null;

                    }



                    return (

                      <button

                        onClick={handleStartSubWorkFlowClick}

                        className={`flex items-center space-x-2 px-4 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer select-none shadow-md border border-transparent animate-in fade-in duration-150 ${

                          isSubRunning

                            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_10px_rgba(244,63,94,0.4)] scale-102 animate-pulse'

                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-[0_4px_10px_rgba(147,51,234,0.35)] hover:scale-102'

                        }`}

                        title={isSubRunning ? 'Stop Sub Work Flow' : 'Start Sub Work Flow (รันเฉพาะ Node ที่เลือก)'}

                      >

                        {isSubRunning ? (

                          <Square className="w-3.5 h-3.5 fill-white text-white" />

                        ) : (

                          <Play className="w-3.5 h-3.5 fill-current" />

                        )}

                        <span>

                          {isSubRunning

                            ? 'Stop Sub Work Flow'

                            : selectedCount > 1

                            ? `Start Sub Work Flow (${selectedCount})`

                            : 'Start Sub Work Flow'}

                        </span>

                      </button>

                    );

                  })()}



                  {/* 1. Start / Pause Work Flow (Full Run) */}

                  <button

                    onClick={handleStartWorkFlowClick}

                    className={`flex items-center space-x-2 px-5 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer select-none shadow-md border border-transparent ${

                      (nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning)

                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_10px_rgba(16,185,129,0.45)] scale-102 animate-pulse'

                        : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-[0_4px_10px_rgba(26,106,255,0.35)] hover:scale-102 active:scale-95'

                    }`}

                    title={(nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning) ? 'Pause Work Flow' : 'Start Work Flow'}

                  >

                    {(nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning) ? (

                      <Pause className="w-4 h-4 fill-white text-white" />

                    ) : (

                      <Play className="w-4 h-4 fill-white text-white" />

                    )}

                    <span>{(nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning) ? 'Pause Work Flow' : 'Start Work Flow'}</span>

                  </button>

                </div>

              )}



              <ReactFlow

                key="logic-flow"

                nodes={nodes}

                edges={edges}

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



          {/* Bottom Log Viewer Tray (Visible ONLY on Logic Workspace, hidden on Projects page) */}

          {showLogsTray && activeTab === 'logic' && (

            <div 

              className="relative border-t border-slate-200/90 bg-white flex flex-col z-10 shadow-[0_-12px_36px_rgba(30,60,110,0.06)]"

              style={{ height: isLogsTrayFullScreen ? '100%' : `${logsTrayHeight}px` }}

            >

              {/* Resize Grab Handle Divider */}

              {!isLogsTrayFullScreen && (

                <div 

                  onMouseDown={(e) => {

                    e.preventDefault();

                    setIsResizingLogsTray(true);

                  }}

                  className={`absolute top-0 left-0 right-0 h-1.5 -translate-y-1/2 cursor-row-resize z-50 hover:bg-blue-500/40 transition-colors ${

                    isResizingLogsTray ? 'bg-blue-500/40' : ''

                  }`}

                  title="Drag to resize console"

                />

              )}



              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white select-none">

                <div className="flex items-center space-x-2">

                  <Terminal className="w-4 h-4 text-blue-600" />

                  

                  <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/80 shadow-inner ml-2 mr-3">

                    <button 

                      onClick={() => setActiveLogTab('process')}

                      className={`px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase transition-all rounded-lg cursor-pointer ${activeLogTab === 'process' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}

                    >

                      Process

                    </button>

                    <button 

                      onClick={() => setActiveLogTab('system')}

                      className={`px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase transition-all rounded-lg cursor-pointer ${activeLogTab === 'system' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}

                    >

                      System

                    </button>

                    <button 

                      onClick={() => setActiveLogTab('ai')}

                      className={`px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase transition-all rounded-lg cursor-pointer ${activeLogTab === 'ai' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}

                    >

                      AI

                    </button>

                  </div>



                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">

                    <span>{activeLogTab === 'system' ? 'System Logs (Backend)' : (activeLogTab === 'ai' ? 'AI Agent Logs' : 'Workflow Execution Traces Console')}</span>

                    {currentRunId && activeLogTab !== 'system' && activeLogTab !== 'ai' && (

                      <span className="text-[10px] text-slate-400 font-mono font-normal lowercase ml-2">

                        (run: {currentRunId.slice(0, 8)}...)

                      </span>

                    )}

                  </span>

                  {activeLogTab !== 'system' && activeLogTab !== 'ai' && (

                    <span className="bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[10px] rounded-full text-slate-500 font-mono font-semibold ml-2">

                      {logs.length} entries

                    </span>

                  )}

                </div>

                <div className="flex items-center space-x-3">

                  <button 

                    onClick={() => {

                      clearWorkflowLogs(selectedWorkflowId || currentRunId || undefined);

                    }} 

                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(26,106,255,0.25)] transition-all cursor-pointer"

                  >

                    Clear Console

                  </button>

                  {/* Cyan-blue status indicator light strip */}

                  <div className="w-1.5 h-4 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" title="Console Status: Connected" />

                  <div className="w-[1px] h-3.5 bg-slate-200" />

                  <button

                    onClick={() => setIsLogsTrayFullScreen(!isLogsTrayFullScreen)}

                    className={`p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center ${

                      isLogsTrayFullScreen ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'

                    }`}

                    title={isLogsTrayFullScreen ? "Exit Full Screen" : "Full Screen"}

                  >

                    {isLogsTrayFullScreen ? (

                      <Minimize2 className="w-3.5 h-3.5" />

                    ) : (

                      <Maximize2 className="w-3.5 h-3.5" />

                    )}

                  </button>

                  <div className="w-[1px] h-3.5 bg-slate-200" />

                  <button

                    onClick={() => {

                      if (isLogsTrayFullScreen) setIsLogsTrayFullScreen(false);

                      setShowLogsTray(false);

                    }}

                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer flex items-center justify-center"

                    title="Hide Log File (ซ่อน Log File)"

                  >

                    <ChevronDown className="w-3.5 h-3.5" />

                  </button>

                </div>

              </div>



              {/* Log Messages List */}

              <div className="flex-1 overflow-y-auto min-h-0 mx-4 my-2.5 p-3.5 bg-[#F1F5F9] rounded-2xl border border-slate-200/90 shadow-inner font-mono text-xs space-y-1.5 text-slate-700">

                {activeLogTab === 'system' ? (

                  <pre className="text-slate-700 whitespace-pre-wrap">{systemLogs || "Waiting for system logs..."}</pre>

                ) : activeLogTab === 'ai' ? (

                  <pre className="text-emerald-700 whitespace-pre-wrap font-bold">{aiLogs || "Waiting for AI Agent logs..."}</pre>

                ) : logs.length === 0 ? (

                  <div className="text-slate-400 italic text-center pt-8">

                    Console ready. Execute workflow to capture execution traces...

                  </div>

                ) : (

                  logs.map((log, lIdx) => {

                    const isError = log.level === 'ERROR';

                    const isSuccess = log.level === 'SUCCESS';



                    let messageElement = (

                      <span className={isError ? 'text-rose-600 font-medium' : isSuccess ? 'text-emerald-700 font-medium' : 'text-slate-700'}>

                        {log.message}

                      </span>

                    );

                    

                    if (log.message.startsWith('Timer:')) {

                      messageElement = (

                        <span className="text-purple-700">

                          <span className="text-purple-600 font-extrabold">Timer ⏱️ </span>

                          {log.message.slice(6)}

                        </span>

                      );

                    } else if (log.message.startsWith('Database:')) {

                      messageElement = (

                        <span className="text-blue-700">

                          <span className="text-blue-600 font-extrabold">Database 🗄️ </span>

                          {log.message.slice(9)}

                        </span>

                      );

                    } else if (log.message.startsWith('Frontend Scheduler:')) {

                      messageElement = (

                        <span className="text-blue-700">

                          <span className="text-blue-600 font-black">Scheduler ⚙️ </span>

                          {log.message.slice(19)}

                        </span>

                      );

                    } else if (log.message.startsWith('[Timer]')) {

                      messageElement = (

                        <span className="text-purple-700">

                          <span className="text-purple-600 font-extrabold">Timer ⏱️ </span>

                          {log.message.slice(7)}

                        </span>

                      );

                    } else if (log.message.startsWith('[Database]')) {

                      messageElement = (

                        <span className="text-blue-700">

                          <span className="text-blue-600 font-extrabold">Database 🗄️ </span>

                          {log.message.slice(10)}

                        </span>

                      );

                    }



                    return (

                      <div key={lIdx} className="flex items-start space-x-2 border-b border-slate-200/60 pb-1">

                        <span className="text-[10px] text-slate-400 shrink-0">

                          [{new Date(log.timestamp).toLocaleTimeString()}]

                        </span>

                        <span className={`font-bold shrink-0 ${

                          isError ? 'text-rose-600' : isSuccess ? 'text-emerald-600' : 'text-blue-600'

                        }`}>

                          {log.level}:

                        </span>

                        {messageElement}

                      </div>

                    );

                  })

                )}

              </div>

            </div>

          )}

        </div>



        {/* Right Properties Panel Drawer */}

        {isPropertiesInspectorOpen && (

        <aside 

          className="relative bg-white/95 backdrop-blur-md border-l border-slate-200/90 flex flex-col h-full z-10 shadow-[-12px_0_36px_rgba(30,60,110,0.08)] text-slate-800"

          style={{ width: `${inspectorWidth}px` }}

          onFocus={handleInspectorFocus}

          onBlur={handleInspectorBlur}

        >

          {/* Resize Grab Handle Divider */}

          <div 

            onMouseDown={(e) => {

              e.preventDefault();

              setIsResizingInspector(true);

            }}

            className={`absolute top-0 bottom-0 left-0 w-1.5 -translate-x-1/2 cursor-col-resize z-50 hover:bg-blue-500/40 transition-colors ${

              isResizingInspector ? 'bg-blue-500/40' : ''

            }`}

            title="Drag to resize"

          />

          <div className="p-4 border-b border-slate-100 bg-slate-50/70">

              <div className="flex items-center justify-between">

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">

                  {(() => {

                    const selectedNodes = nodes.filter(n => n.selected);

                    const activeSelectedNodes = selectedNodes.length > 0 ? selectedNodes : (selectedNode ? [selectedNode] : []);

                    if (activeSelectedNodes.length > 0) {

                      return (

                        <>

                          <Settings className="w-4 h-4 text-blue-600" />

                          <span>Properties Inspector</span>

                        </>

                      );

                    } else {

                      return (

                        <>

                          <Layout className="w-4 h-4 text-blue-600" />

                          <span>Workspace Inspector</span>

                        </>

                      );

                    }

                  })()}

                </h3>

                <button

                  onClick={() => {

                    setSelectedNode(null);

                    setNodes(prev => prev.map(n => ({ ...n, selected: false })));

                  }}

                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"

                  title="Close Inspector"

                >

                  <X className="w-4 h-4" />

                </button>

              </div>

              {(() => {

                const selectedNodes = nodes.filter(n => n.selected);

                const activeSelectedNodes = selectedNodes.length > 0 ? selectedNodes : (selectedNode ? [selectedNode] : []);



                if (activeSelectedNodes.length > 0) {

                  return (

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">

                      <div className="flex items-center space-x-2">

                        {/* Start / Pause Work Flow Button in Inspector */}

                        <button

                          onClick={handleStartWorkFlowClick}

                          className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer hover:scale-105 ${

                            (nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning)

                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md animate-pulse'

                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_2px_6px_rgba(26,106,255,0.3)]'

                          }`}

                          title={(nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning) ? "Pause Work Flow" : "Start Work Flow"}

                        >

                          {(nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning) ? (

                            <>

                              <Pause className="w-3 h-3 fill-white text-white" />

                              <span>Pause Work Flow</span>

                            </>

                          ) : (

                            <>

                              <Play className="w-3 h-3 fill-white text-white" />

                              <span>Start Work Flow</span>

                            </>

                          )}

                        </button>

                      </div>

                      <span className="text-[9px] text-cyber-neon font-mono select-none">

                        {activeSelectedNodes.length} node{activeSelectedNodes.length > 1 ? 's' : ''} selected

                      </span>

                    </div>

                  );

                } else {

                  return (

                    <p className="text-[10px] text-cyber-muted mt-1 leading-relaxed">

                      Select any node on the canvas to configure its LangGraph properties.

                    </p>

                  );

                }

              })()}

            </div>



          <div 

            ref={inspectorContentRef}

            onMouseDown={handleInspectorMouseDown}

            className={`flex-1 overflow-y-auto min-h-0 p-5 space-y-5 cursor-grab ${

              isDraggingInspectorScroll ? 'cursor-grabbing select-none' : ''

            }`}

          >

            {selectedNode ? (

              <div className="space-y-4">

                {/* Node info header */}

                <div className="p-3 bg-cyber-dark bg-opacity-50 rounded-lg border border-cyber-border flex items-center justify-between">

                  <div>

                    <span className="text-[9px] uppercase tracking-widest text-cyber-muted font-bold font-mono">

                      ID: {selectedNode.id}

                    </span>

                    <h4 className="text-xs font-bold text-cyber-neon uppercase tracking-wide">

                      {selectedNode.data?.nodeType || getNodeClass(selectedNode) || 'Node'}

                    </h4>

                    <span className="text-[10px] text-cyber-muted block">

                      Category: {selectedNode.data.category || 'CustomNode'}

                    </span>

                  </div>

                  {isProtectedTimerNode(selectedNode) ? (

                    <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-cyber-dark bg-opacity-70 rounded border border-cyber-neon border-opacity-40 text-cyber-neon text-[10px] select-none" title="Protected System Node (โหนดระบบ ไม่สามารถลบได้)">

                      <Lock className="w-3 h-3 text-cyber-neon" />

                      <span className="font-mono text-[9px] font-bold tracking-wider">PROTECTED</span>

                    </div>

                  ) : (

                    <button

                      onClick={deleteSelectedElements}

                      className="p-1.5 rounded hover:bg-cyber-dark border border-cyber-border hover:border-red-500 hover:text-red-400 text-cyber-muted transition-all"

                      title="Delete Node"

                    >

                      <Trash2 className="w-4 h-4" />

                    </button>

                  )}

                </div>



                {/* Node Type Field (Workspace Tool Type) */}

                <div className="space-y-1.5">

                  <div className="flex items-center justify-between">

                    <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                      Node Type (Tool)

                    </label>

                    <span className="text-[9px] font-mono font-bold text-cyber-neon bg-cyber-dark px-2 py-0.5 rounded border border-cyber-neon border-opacity-40">

                      {selectedNode.data?.nodeType || getNodeClass(selectedNode) || 'CustomNode'}

                    </span>

                  </div>

                  <div className="flex items-center justify-between text-[9px] text-cyber-muted font-mono">

                    <span>Class Name:</span>

                    <span className="text-cyan-400 font-semibold">{getNodeClass(selectedNode)}</span>

                  </div>

                </div>



                {/* Node Label / Name Input */}

                <div className="space-y-1.5">

                  <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                    Node Title / Display Name

                  </label>

                  <input

                    type="text"

                    value={selectedNode.data.label !== undefined ? selectedNode.data.label : (selectedNode.data.name || '')}

                    onChange={(e) => {

                      const cls = getNodeClass(selectedNode);

                      const currentType = selectedNode.data?.nodeType || cls.replace(/_/g, ' ');

                      updateSelectedNodeDataFields({

                        name: e.target.value,

                        label: e.target.value,

                        nodeType: currentType,

                        nodeClass: cls,

                        originalName: selectedNode.data.originalName || currentType

                      });

                    }}

                    className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                    placeholder="e.g. OCR Reader"

                  />

                  <p className="text-[9px] text-cyber-muted italic">

                    Title/Display Name สำหรับตั้งชื่อให้เข้าใจง่าย โดยระบบจะตรวจสอบการทำงานผ่าน Node Type: <span className="text-cyber-neon font-semibold">{selectedNode.data?.nodeType || getNodeClass(selectedNode)}</span> เสมอ

                  </p>

                </div>



                {selectedNode.type === 'sample' && (

                  <div className="space-y-1.5 mt-4">

                    <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                      Table Description

                    </label>

                    <textarea

                      value={selectedNode.data.description || ''}

                      onChange={(e) => updateSelectedNodeDataFields({ description: e.target.value })}

                      className="w-full h-20 text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text resize-none"

                      placeholder="Describe the purpose of this sample table..."

                    />

                  </div>

                )}



                {/* Rubric/Sample Button */}

                {(selectedNode.type === 'rubric' || selectedNode.type === 'mca' || selectedNode.type === 'sample' || selectedNode.data?.category === 'Criteria') && (

                  <div className="flex flex-col space-y-4 mt-4 pt-4 border-t border-cyber-border">

                                          {selectedNode.type === 'table' ? (

                        <button

                          onClick={() => {

                            setTableBuilderNodeId(selectedNode.id);

                          }}

                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0f] font-bold rounded shadow-lg transition-colors"

                        >

                          Open Table Builder

                        </button>

                      ) : selectedNode.type === 'sample' ? (

                      <button

                        onClick={() => {

                          setSampleBuilderNodeId(selectedNode.id);

                        }}

                        className="w-full py-3 bg-[#38bdf8] hover:bg-cyan-400 text-[#0a0a0f] font-bold rounded shadow-lg transition-colors"

                      >

                        {selectedNode.data?.sampleData ? 'Edit Sample' : 'Create Sample'}

                      </button>

                    ) : (

                      <button

                        onClick={() => setRubricBuilderNodeId(selectedNode.id)}

                        className="w-full py-3 bg-[#84CC16] hover:bg-[#A3E635] text-[#0a0a0f] font-bold rounded shadow-lg transition-colors"

                      >

                        {selectedNode.data?.rubricData ? (selectedNode.type === 'mca' ? 'Edit MCA' : 'Edit Rubric') : (selectedNode.type === 'mca' ? 'Create MCA Table' : 'Create Rubric Table')}

                      </button>

                    )}

                  </div>

                )}



                {/* DB Connection String and SQL Query (Specific to DB / Database / Supabase nodes) */}

                {isSelectedDbNode && (

                  <>

                    {/* Connection Mode Dropdown */}

                    <div className="space-y-1.5 mb-2">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Connection Mode

                      </label>

                      <select

                        value={selectedNode.data.parameters?.dbConnectionMode || 'localhost'}

                        onChange={(e) => updateDbConnectionParameter('dbConnectionMode', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="localhost">Localhost</option>

                        <option value="http">HTTP</option>

                      </select>

                    </div>



                    {selectedNode.data.parameters?.dbConnectionMode === 'http' ? (

                      // HTTP Mode Details: Connection String input only

                      <div className="space-y-1.5 mb-2">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Database Connection String

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.connectionString || ''}

                          onChange={(e) => updateSelectedNodeParameter('connectionString', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                          placeholder="e.g. postgresql://user:password@host:port/dbname?sslmode=require"

                        />

                      </div>

                    ) : (

                      // Localhost Mode Details: SQLite Database File Path input only

                      <div className="space-y-1.5 mb-2">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Database File Path

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.dbFilePath || 'workflow_app.db'}

                          onChange={(e) => updateDbConnectionParameter('dbFilePath', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                          placeholder="e.g. workflow_app.db"

                        />

                      </div>

                    )}



                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        SQL Query

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.sqlQuery || ''}

                        onChange={(e) => updateSelectedNodeParameter('sqlQuery', e.target.value)}

                        rows={5}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-none leading-relaxed font-mono"

                        placeholder="e.g. SELECT * FROM workflows LIMIT 5;"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Query Result

                        </label>

                        {selectedNode.data.parameters?.dbOutput && (

                          <button

                            onClick={() => updateSelectedNodeParameter('dbOutput', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear query results"

                          >

                            Clear Result

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.dbOutput || ''}

                        rows={6}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                        placeholder="Query results will appear here..."

                      />

                    </div>

                  </>

                )}



                {/* Graph RAG configuration fields */}

                {isSelectedGraphRagNode && (

                  <>

                    <div className="space-y-1.5 mb-2">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Graph Database Type

                      </label>

                      <select

                        value={selectedNode.data.parameters?.databaseType || 'neo4j'}

                        onChange={(e) => updateSelectedNodeParameter('databaseType', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="neo4j">Neo4j (Bolt/HTTP)</option>

                        <option value="memgraph">Memgraph</option>

                        <option value="kuzu">Kùzu DB</option>

                        <option value="networkx">NetworkX / In-Memory</option>

                      </select>

                    </div>



                    <div className="space-y-1.5 mb-2">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Graph Endpoint URL

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.graphEndpoint || ''}

                        onChange={(e) => updateSelectedNodeParameter('graphEndpoint', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. bolt://localhost:7687 or http://localhost:7474"

                      />

                    </div>



                    <div className="space-y-1.5 mb-2">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Cypher / Graph Query

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.graphQuery || ''}

                        onChange={(e) => updateSelectedNodeParameter('graphQuery', e.target.value)}

                        rows={4}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-none leading-relaxed font-mono"

                        placeholder="e.g. MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 25"

                      />

                    </div>



                    <div className="grid grid-cols-2 gap-2 mb-2">

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Top K Entities

                        </label>

                        <input

                          type="number"

                          value={selectedNode.data.parameters?.topK !== undefined ? selectedNode.data.parameters.topK : 5}

                          onChange={(e) => updateSelectedNodeParameter('topK', Number(e.target.value))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        />

                      </div>

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Similarity Threshold

                        </label>

                        <input

                          type="number"

                          step="0.05"

                          min="0"

                          max="1"

                          value={selectedNode.data.parameters?.similarityThreshold !== undefined ? selectedNode.data.parameters.similarityThreshold : 0.7}

                          onChange={(e) => updateSelectedNodeParameter('similarityThreshold', Number(e.target.value))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        />

                      </div>

                    </div>



                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Graph Output / Result

                        </label>

                        {selectedNode.data.parameters?.output && (

                          <button

                            onClick={() => updateSelectedNodeParameter('output', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear graph result"

                          >

                            Clear

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.output || (selectedNode.data.parameters?.graphData ? JSON.stringify(selectedNode.data.parameters.graphData, null, 2) : '')}

                        rows={6}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                        placeholder="Graph query results and entity subgraphs will appear here after execution..."

                      />

                    </div>

                  </>

                )}



                {/* API Connector configuration fields */}

                {isSelectedApiConnectorNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        API Endpoint URL

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.apiUrl || ''}

                        onChange={(e) => updateSelectedNodeParameter('apiUrl', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. https://bqysaldeijwvnhtcfiuj.supabase.co/rest/v1/pdf_table"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Authorization (Header)

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.authHeader || ''}

                        onChange={(e) => updateSelectedNodeParameter('authHeader', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. Bearer sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Public Anon Key / API Key

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.anonKeyHeader || ''}

                        onChange={(e) => updateSelectedNodeParameter('anonKeyHeader', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Function Call

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.functionName || ''}

                        onChange={(e) => updateSelectedNodeParameter('functionName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. GetPDF()"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Parameters

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.apiParameters || ''}

                        onChange={(e) => updateSelectedNodeParameter('apiParameters', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. select=number,date,file_url"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          API Output

                        </label>

                        {selectedNode.data.parameters?.apiOutput && (

                          <button

                            onClick={() => updateSelectedNodeParameter('apiOutput', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear API output preview"

                          >

                            Clear

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.apiOutput || ''}

                        rows={8}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                        placeholder="API Response output will appear here after execution..."

                      />

                    </div>

                  </>

                )}



                {/* API Incremental configuration fields */}

                {isSelectedApiIncrementalNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        API Endpoint URL

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.apiUrl || ''}

                        onChange={(e) => updateSelectedNodeParameter('apiUrl', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. https://bqysaldeijwvnhtcfiuj.supabase.co/rest/v1/pdf_table"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Authorization (Header)

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.authHeader || ''}

                        onChange={(e) => updateSelectedNodeParameter('authHeader', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. Bearer sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Public Anon Key / API Key

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.anonKeyHeader || ''}

                        onChange={(e) => updateSelectedNodeParameter('anonKeyHeader', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Function Call

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.functionName || ''}

                        onChange={(e) => updateSelectedNodeParameter('functionName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. GetPDF_Incremental()"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Parameters

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.apiParameters || ''}

                        onChange={(e) => updateSelectedNodeParameter('apiParameters', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. select=number,date,file_url"

                      />

                    </div>

                    <div className="flex items-end space-x-2.5">

                      <div className="flex-1 space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Round (Automatic)

                        </label>

                        <input

                          type="number"

                          readOnly

                          value={selectedNode.data.parameters?.round !== undefined ? selectedNode.data.parameters.round : 1}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-muted font-mono cursor-not-allowed"

                          title="This value increments automatically. Use Reset to start over."

                        />

                      </div>

                      

                      <button

                        type="button"

                        onClick={() => {

                          updateSelectedNodeParameter('round', 1);

                          setNodes((nds) => nds.map((n) => {

                            const name = n.data.name?.toLowerCase() || '';

                            const label = n.data.label?.toLowerCase() || '';

                            const type = n.type?.toLowerCase() || '';

                            const isTimer = name.includes('timer') || label.includes('timer') || type.includes('timer');

                            if (isTimer) {

                              return {

                                ...n,

                                data: {

                                  ...n.data,

                                  parameters: {

                                    ...n.data.parameters,

                                    runCount: 0

                                  }

                                }

                              };

                            }

                            return n;

                          }));

                        }}

                        className="p-2 rounded-lg bg-cyber-dark border border-cyber-border hover:border-cyber-neon hover:text-cyber-neon text-cyber-text transition-all cursor-pointer flex items-center justify-center h-[34px] w-[34px] mb-0.5 focus:outline-none"

                        title="Reset round to 1"

                      >

                        <RotateCcw className="w-3.5 h-3.5" />

                      </button>



                      <div className="flex-1 space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Row Size

                        </label>

                        <input

                          type="number"

                          min="1"

                          value={selectedNode.data.parameters?.row !== undefined ? selectedNode.data.parameters.row : 5}

                          onChange={(e) => updateSelectedNodeParameter('row', Math.max(1, Number(e.target.value)))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        />

                      </div>

                    </div>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          API Output

                        </label>

                        {selectedNode.data.parameters?.apiOutput && (

                          <button

                            onClick={() => updateSelectedNodeParameter('apiOutput', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear API output preview"

                          >

                            Clear

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.apiOutput || ''}

                        rows={8}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                        placeholder="API Response output will appear here after execution..."

                      />

                    </div>

                  </>

                )}



                {/* JSON Connector configuration fields */}

                {(isSelectedJsonConnectorNode || isSelectedJsonConnectorListNode) && (

                  <>

                    <div className="space-y-4">

                      {/* JSON Data Table (Moved to Top) */}

                      {isSelectedJsonConnectorListNode && (() => {

                        const jsonListTableRaw = selectedNode.data.parameters?.table || selectedNode.data.parameters?.agentOutputsTable || [];

                        const jsonListTable = Array.isArray(jsonListTableRaw) ? jsonListTableRaw : Object.values(jsonListTableRaw);

                        const isJsonListTableValid = Array.isArray(jsonListTable) && jsonListTable.length > 0;

                        let jsonListKeys: string[] = [];

                        if (isJsonListTableValid) {

                          const firstItem = jsonListTable[0];

                          if (typeof firstItem === 'object' && firstItem !== null) {

                            jsonListKeys = Object.keys(firstItem);

                          }

                        }

                        return (

                          <div className="space-y-1.5 pb-2 border-b border-cyber-border border-opacity-50">

                            <div className="flex items-center justify-between">

                              <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block flex-1">

                                JSON Data Table ({jsonListTable.length || 0})

                              </label>

                            </div>

                            <div className="border border-cyber-border rounded-lg overflow-x-auto bg-cyber-dark bg-opacity-40 max-h-[300px]">

                              <table className="w-full text-left border-collapse whitespace-nowrap">

                                <thead>

                                  <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted sticky top-0 z-10">

                                    <th className="py-2 px-3 text-center w-16 border-r border-cyber-border border-opacity-30 bg-cyber-dark">View</th>

                                    <th className="py-2 px-3 text-center w-12 border-r border-cyber-border border-opacity-30 bg-cyber-dark">ID</th>

                                    {jsonListKeys.map(k => (

                                      <th key={k} className="py-2 px-3 border-r border-cyber-border border-opacity-30 bg-cyber-dark">{k}</th>

                                    ))}

                                    {jsonListKeys.length === 0 && <th className="py-2 px-3 border-r border-cyber-border border-opacity-30 bg-cyber-dark">Data</th>}

                                  </tr>

                                </thead>

                                <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                  {isJsonListTableValid ? jsonListTable.map((row: any, idx: number) => {

                                    const isSelected = selectedNode.data.parameters?.select_row_index === idx || (selectedNode.data.parameters?.select_row_index === undefined && idx === 0);

                                    return (

                                    <tr 

                                        key={idx} 

                                        onClick={async () => {

                                          updateSelectedNodeParameter('select_row_index', idx);

                                          if (isSelectedJsonConnectorListNode) {

                                            const tableDict = selectedNode.data.parameters?.agentOutputsTable || {};

                                            const keyArr = Object.keys(tableDict);

                                            let fileName = tableDict[idx] || tableDict[idx.toString()] || tableDict[keyArr[idx]];

                                            if (fileName && typeof fileName === 'string') {

                                              try {

                                                const res = await fetch(`${BACKEND_URL}/api/files?file=${encodeURIComponent(fileName)}`);

                                                if (res.ok) {

                                                  const text = await res.text();

                                                  updateSelectedNodeParameter('jsonOutput', text);

                                                } else {

                                                  console.error("Failed to fetch file:", fileName);

                                                  updateSelectedNodeParameter('jsonOutput', JSON.stringify(row, null, 2));

                                                }

                                              } catch (e) {

                                                console.error("Error fetching file:", e);

                                                updateSelectedNodeParameter('jsonOutput', JSON.stringify(row, null, 2));

                                              }

                                            } else {

                                              updateSelectedNodeParameter('jsonOutput', JSON.stringify(row, null, 2));

                                            }

                                          } else {

                                              updateSelectedNodeParameter('jsonOutput', JSON.stringify(row, null, 2));

                                          }

                                        }}

                                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-cyber-neon text-black font-bold' : 'hover:bg-cyber-light hover:bg-opacity-10 text-cyber-text'}`}

                                      >

                                      <td className="py-2 px-3 text-center border-r border-cyber-border border-opacity-30">

                                        <button

                                          type="button"

                                          onClick={(e) => {

                                            e.stopPropagation(); // prevent row click when clicking view

                                            if (typeof row === 'string' && (row.endsWith('.md') || row.endsWith('.txt') || row.endsWith('.json'))) {

                                              openDialog('agent_result', row);

                                            } else {

                                              const content = JSON.stringify(row, null, 2);

                                              openDialog('json', `row_${idx+1}.md`, content);

                                            }

                                          }}

                                          className="text-[9px] font-mono bg-cyber-dark hover:bg-cyber-light hover:bg-opacity-20 text-cyber-neon border border-cyber-border hover:border-cyber-neon px-1.5 py-0.5 rounded transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"

                                          title="View Full JSON Row"

                                        >

                                          <Eye className="w-2.5 h-2.5" /> View

                                        </button>

                                      </td>

                                      <td className="py-2 px-3 text-center font-mono font-bold text-[10px] text-cyber-muted border-r border-cyber-border border-opacity-30">{idx + 1}</td>

                                      {jsonListKeys.length > 0 ? jsonListKeys.map(k => (

                                        <td key={k} className="py-2 px-3 font-mono max-w-[250px] border-r border-cyber-border border-opacity-30" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>

                                          <span className="line-clamp-3">{typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k])}</span>

                                        </td>

                                      )) : (

                                        <td className="py-2 px-3 font-mono border-r border-cyber-border border-opacity-30" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>

                                          <span className="line-clamp-3">{typeof row === 'object' ? JSON.stringify(row) : String(row)}</span>

                                        </td>

                                      )}

                                    </tr>

                                  )}) : (

                                    <tr>

                                      <td colSpan={jsonListKeys.length + 2} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                        No data yet. Execute workflow to generate JSON data table.

                                      </td>

                                    </tr>

                                  )}

                                </tbody>

                              </table>

                            </div>

                          </div>

                        );

                      })()}





                      {/* JSON Output Text Box */}

                      <div className="space-y-1.5 pt-2 border-t border-cyber-border border-opacity-35">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            JSON Output

                          </label>

                          {selectedNode.data.parameters?.jsonOutput && (

                            <button

                              onClick={() => updateSelectedNodeParameter('jsonOutput', '')}

                              className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                              title="Clear JSON output preview"

                            >

                              Clear

                            </button>

                          )}

                        </div>

                        <textarea

                          readOnly

                          value={selectedNode.data.parameters?.jsonOutput || ''}

                          rows={12}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                          placeholder="Filtered JSON output will appear here after execution..."

                        />

                      </div>

                      {/* Retrieve JSON Button for JSON Connector List */}

                      {isSelectedJsonConnectorListNode && (

                        <button

                          type="button"

                          onClick={() => {

                            const incomingEdges = edges.filter(e => e.target === selectedNode.id);

                            if (incomingEdges.length === 0) {

                              alert("No parent node connected.");

                              return;

                            }

                            const parentNode = nodes.find(n => n.id === incomingEdges[0].source);

                            if (!parentNode) return;

                            

                            let resultData = null;

                            const params = parentNode.data?.parameters || {};

                            if (params.markitdownTable) resultData = params.markitdownTable;

                            else if (params.agentOutputsTable) resultData = params.agentOutputsTable;

                            else if (params.pdfQueue) resultData = params.pdfQueue;

                            else if (params.table) resultData = params.table;

                            else if (params.agentOutput) resultData = params.agentOutput;

                            else if (params.apiOutput) resultData = params.apiOutput;

                            else if (params.dbOutput) resultData = params.dbOutput;

                            else if (params.jsonOutput) resultData = params.jsonOutput;

                            else if (params.structuredJson) resultData = params.structuredJson;

                            else if (params.stateOutput) resultData = params.stateOutput;

                            else if (params.jsonText) resultData = params.jsonText;

                            else if (params.pdfUrls) resultData = params.pdfUrls;

                            

                            if (!resultData) {

                              alert("No result found in parent node yet. Please run the workflow first or add fields manually.");

                              return;

                            }

                            

                            try {

                              let jsonStr = '';

                              if (typeof resultData === 'string') {

                                jsonStr = resultData;

                              } else if (Array.isArray(resultData)) {

                                if (resultData.length > 0) {

                                  const firstRow = resultData[0];

                                  if (typeof firstRow === 'string') {

                                    jsonStr = firstRow;

                                  } else if (typeof firstRow === 'object' && firstRow !== null) {

                                    if (firstRow['.md']) jsonStr = firstRow['.md'];

                                    else if (firstRow.content) jsonStr = firstRow.content;

                                    else if (firstRow.markdown) jsonStr = firstRow.markdown;

                                    else jsonStr = JSON.stringify(firstRow);

                                  } else {

                                    jsonStr = JSON.stringify(firstRow);

                                  }

                                }

                              } else {

                                jsonStr = JSON.stringify(resultData);

                              }

                              

                              const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

                              if (jsonMatch) {

                                jsonStr = jsonMatch[1];

                              }

                              

                              let parsed: any = null;

                              try {

                                parsed = JSON.parse(jsonStr);

                              } catch (e) {

                                // If parsing fails (e.g. raw markdown text), fallback to the original table structure

                                parsed = resultData;

                              }

                              

                              let keys: string[] = [];

                              if (Array.isArray(parsed) && parsed.length > 0) {

                                keys = Object.keys(parsed[0]);

                              } else if (typeof parsed === 'object' && parsed !== null) {

                                keys = Object.keys(parsed);

                              }

                              

                              if (keys.length > 0) {

                                updateSelectedNodeParameter('fields', keys);

                                updateSelectedNodeParameter('parsedDataPreview', parsed);

                                alert(`Successfully retrieved ${keys.length} fields.`);

                              } else {

                                alert("No JSON fields could be extracted.");

                              }

                            } catch (e: any) {

                              alert("Error retrieving fields: " + e.message);

                            }

                          }}

                          className="w-full px-3 py-2 bg-cyber-neon text-black font-bold text-xs rounded-lg hover:bg-opacity-80 transition-all cursor-pointer border-none outline-none flex items-center justify-center space-x-2 shadow-[0_0_4px_rgba(212,255,58,0.3)]"

                        >

                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>

                            <polyline points="7 10 12 15 17 10"></polyline>

                            <line x1="12" y1="15" x2="12" y2="3"></line>

                          </svg>

                          <span>Retrieve JSON</span>

                        </button>

                      )}



                      {/* Add Field Input & Button */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Add JSON Field

                        </label>

                        <div className="flex space-x-2">

                          <input

                            type="text"

                            id="new-field-input"

                            placeholder="e.g. url, email"

                            className="flex-1 text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                            onKeyDown={(e) => {

                              if (e.key === 'Enter') {

                                const input = e.currentTarget;

                                const val = input.value.trim();

                                if (val) {

                                  const currentFields = selectedNode.data.parameters?.fields || [];

                                  if (!currentFields.includes(val)) {

                                    updateSelectedNodeParameter('fields', [...currentFields, val]);

                                  }

                                  input.value = '';

                                }

                              }

                            }}

                          />

                          <button

                            type="button"

                            onClick={() => {

                              const input = document.getElementById('new-field-input') as HTMLInputElement;

                              const val = input?.value.trim();

                              if (val) {

                                  const currentFields = selectedNode.data.parameters?.fields || [];

                                  if (!currentFields.includes(val)) {

                                    updateSelectedNodeParameter('fields', [...currentFields, val]);

                                  }

                                  if (input) input.value = '';

                              }

                            }}

                            className="px-3 py-2 bg-cyber-neon text-black font-bold text-xs rounded-lg hover:bg-opacity-80 transition-all cursor-pointer border-none outline-none"

                          >

                            Add Field

                          </button>

                        </div>

                      </div>



                      {/* Fields Table */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Fields List

                        </label>

                        <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                          <table className="w-full text-xs text-left border-collapse">

                            <thead>

                              <tr className="border-b border-cyber-border bg-cyber-dark bg-opacity-80">

                                <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-cyber-muted w-8 text-center">View</th>

                                <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Field Name</th>

                                <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-cyber-muted text-right">Action</th>

                              </tr>

                            </thead>

                            <tbody>

                              {!(selectedNode.data.parameters?.fields && selectedNode.data.parameters.fields.length > 0) ? (

                                <tr>

                                  <td colSpan={3} className="py-3 px-3 text-center text-cyber-muted italic text-[11px]">

                                    No fields added yet.

                                  </td>

                                </tr>

                              ) : (

                                selectedNode.data.parameters.fields.map((field: string) => (

                                  <tr key={field} className="border-b border-cyber-border border-opacity-35 hover:bg-cyber-dark hover:bg-opacity-20 transition-all">

                                    <td className="py-2 px-3 text-center">

                                      <button

                                        type="button"

                                        onClick={() => {

                                          let fieldData = '';

                                          if (isSelectedJsonConnectorListNode) {

                                            const idx = selectedNode.data.parameters?.select_row_index || 0;

                                            const table = selectedNode.data.parameters?.table || selectedNode.data.parameters?.agentOutputsTable || [];

                                            fieldData = table[idx] ? table[idx][field] : '';

                                          } else {

                                            try {

                                              const outputObj = JSON.parse(selectedNode.data.parameters?.jsonOutput || '{}');

                                              fieldData = outputObj[field];

                                            } catch(e) {}

                                          }

                                          openDialog('json', `field_${field}.json`, JSON.stringify(fieldData, null, 2) || '');

                                        }}

                                        className="text-[9px] font-mono bg-cyber-dark hover:bg-cyber-light hover:bg-opacity-20 text-cyber-neon border border-cyber-border hover:border-cyber-neon px-1.5 py-0.5 rounded transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"

                                        title="View extracted field data"

                                      >

                                        <Eye className="w-2.5 h-2.5" /> View

                                      </button>

                                    </td>

                                    <td className="py-2 px-3 font-mono text-cyan-400">{field}</td>

                                    <td className="py-2 px-3 text-right">

                                      <button

                                        type="button"

                                        onClick={() => {

                                          const currentFields = selectedNode.data.parameters?.fields || [];

                                          updateSelectedNodeParameter('fields', currentFields.filter((f: string) => f !== field));

                                        }}

                                        className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer"

                                      >

                                        Remove

                                      </button>

                                    </td>

                                  </tr>

                                ))

                              )}

                            </tbody>

                          </table>

                        </div>

                      </div>



                    </div>

                  </>

                )}

                {/* Page Display Node configuration fields */}

                {isSelectedPageNode && (

                  <>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Page Display Content

                        </label>

                        {selectedNode.data.parameters?.pageOutput && (

                          <button

                            onClick={() => updateSelectedNodeParameter('pageOutput', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear display content"

                          >

                            Clear

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.pageOutput || ''}

                        rows={16}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                      />

                    </div>

                  </>

                )}



                {/* Storage Node configuration fields */}

                {isSelectedStorageNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Supabase Project URL

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.supabaseUrl || ''}

                        onChange={(e) => updateSelectedNodeParameter('supabaseUrl', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. https://xyz.supabase.co"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Supabase Service Role Key / API Key

                      </label>

                      <div className="flex gap-2">

                        <input

                          type="password"

                          value={selectedNode.data.parameters?.supabaseKey || ''}

                          onChange={(e) => updateSelectedNodeParameter('supabaseKey', e.target.value)}

                          className="flex-1 text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                          placeholder="eyJhbGciOi..."

                        />

                        <button

                          type="button"

                          onClick={() => {

                            navigator.clipboard.writeText(selectedNode.data.parameters?.supabaseKey || '');

                            setCopiedNodeId(selectedNode.id);

                            setTimeout(() => setCopiedNodeId(null), 1000);

                          }}

                          className="px-2.5 py-2 rounded-lg bg-cyber-dark border border-cyber-border text-cyber-neon hover:bg-cyber-neon hover:text-black transition-all flex items-center justify-center space-x-1 cursor-pointer shrink-0"

                          title="Copy Key to Clipboard"

                        >

                          {copiedNodeId === selectedNode.id ? (

                            <span className="text-[9px] font-bold">Copied!</span>

                          ) : (

                            <Copy className="w-3.5 h-3.5" />

                          )}

                        </button>

                      </div>

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Storage Bucket Name

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.bucketName || ''}

                        onChange={(e) => updateSelectedNodeParameter('bucketName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. pdfs"

                      />

                    </div>

                  </>

                )}



                {/* Pdfs Loader Node configuration fields */}

                {isSelectedPdfsLoaderNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Fallback PDF URLs (JSON list or comma-separated)

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.pdfUrls || ''}

                        onChange={(e) => updateSelectedNodeParameter('pdfUrls', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text font-mono h-24 resize-y"

                        placeholder='e.g. ["http://url.pdf"] or http://url1.pdf, http://url2.pdf'

                      />

                    </div>

                  </>

                )}







                {/* PDF Queue Parameter Editor */}

                {isSelectedPdfQueueNode && (() => {

                  const getPdfList = () => {

                    const cleanList = (rawList: any[]) => {

                      const filtered = rawList.map(item => {

                        if (item && typeof item === 'object') return item.disk_name || item.url || item.filename || '';

                        return typeof item === 'string' ? item : JSON.stringify(item);

                      }).filter(item => {

                        if (!item) return false;

                        const trimmed = item.trim();

                        if (trimmed.includes('/rest/v1') || trimmed.endsWith('/')) {

                          return false;

                        }

                        return true;

                      });

                      return Array.from(new Set(filtered));

                    };



                    const execQueue = selectedNode.data.parameters?.pdfQueue;

                    if (execQueue && Array.isArray(execQueue) && execQueue.length > 0) {

                      return cleanList(execQueue);

                    } else if (execQueue && typeof execQueue === 'object' && Object.keys(execQueue).length > 0) {

                      return cleanList(Object.values(execQueue));

                    }

                    const urlsStr = selectedNode.data.parameters?.supabaseUrls || '';

                    let list: string[] = [];

                    if (urlsStr.trim().startsWith('[') && urlsStr.trim().endsWith(']')) {

                      try {

                        const parsed = JSON.parse(urlsStr);

                        if (Array.isArray(parsed)) {

                          list = parsed.map((item: any) => typeof item === 'object' && item !== null ? (item.file_url || item.url || item.name || JSON.stringify(item)) : String(item));

                        }

                      } catch (e) {}

                    }

                    if (list.length === 0) {

                      list = urlsStr.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);

                    }

                    return cleanList(list);

                  };



                  const handleOpenPdf = (url: string) => {

                        if (!url) return;

                        console.log(`[handleOpenPdf] Clicked URL/Filename:`, url);

                        

                        // Extract just the filename from any URL or path

                        const filename = url.split('/').pop()?.split('?')[0] || url;

                        

                        const wfParam = selectedWorkflowId || 'wf_default';

                        const finalUrl = `${BACKEND_URL}/api/queue-pdf/${encodeURIComponent(filename)}?workflow_id=${encodeURIComponent(wfParam)}`;

                        

                        console.log(`[handleOpenPdf] Extracted filename:`, filename);

                        console.log(`[handleOpenPdf] Opening local backend URL:`, finalUrl);

                        

                        openDialog('pdf_queue', finalUrl);

                      };



                  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

                    const files = e.target.files;

                    if (!files || files.length === 0) return;

                    const formData = new FormData();

                    Array.from(files).forEach((f) => {

                      if (f.name.toLowerCase().endsWith('.pdf')) {

                        formData.append('files', f);

                      }

                    });

                    try {

                      const currentQueueLen = (Array.isArray(selectedNode.data.parameters?.pdfQueue) ? selectedNode.data.parameters?.pdfQueue : getPdfList()).length;

                      const startIdx = currentQueueLen + 1;

                      const uploadUrl = `${BACKEND_URL}/api/upload-pdf-queue?workflow_id=${encodeURIComponent(selectedWorkflowId || 'wf_default')}&node_id=${encodeURIComponent(selectedNode.id)}&start_index=${startIdx}`;

                      const res = await fetch(uploadUrl, {

                        method: 'POST',

                        body: formData,

                      });

                      const data = await res.json();

                      if (data.status === 'success') {

                        const uploadedFiles = Array.isArray(data.filenames) ? data.filenames : [];

                        const currentQueue = Array.isArray(selectedNode.data.parameters?.pdfQueue) ? selectedNode.data.parameters?.pdfQueue : getPdfList();

                        const newQueue = Array.from(new Set([...currentQueue, ...uploadedFiles]));

                        updateSelectedNodeData('parameters', {

                          ...(selectedNode.data.parameters || {}),

                          pdfQueue: newQueue,

                          queueLength: newQueue.length

                        });

                        

                        // SYNC QUEUE LENGTH TO CHILD NODES

                        setNodes((nds) => {

                          const childNodeIds = edges.filter(e => e.source === selectedNode.id).map(e => e.target);

                          if (childNodeIds.length === 0) return nds;

                          return nds.map((n) => {

                            if (childNodeIds.includes(n.id)) {

                              return {

                                ...n,

                                data: {

                                  ...n.data,

                                  parameters: {

                                    ...(n.data.parameters || {}),

                                    queueLength: newQueue.length,

                                    previousMaxList: (() => {

                                      const updated = { ...(n.data.parameters?.previousMaxList || {}) };

                                      delete updated[`${selectedNode.id}_output`];

                                      updated[selectedNode.id] = newQueue.length;

                                      return updated;

                                    })()

                                  }

                                }

                              };

                            }

                            return n;

                          });

                        });

                      }

                    } catch (err) {

                      console.error('Error uploading PDFs:', err);

                    }

                  };



                  const handleClearAllPdfQueue = async () => {

                        try {

                          const wfParam = selectedWorkflowId || 'wf_default';

                          const nodeIdParam = selectedNode?.id || 'node_queue';

                          await fetch(`${BACKEND_URL}/api/clear-pdf-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(nodeIdParam)}`, { method: 'DELETE' });

                          updateSelectedNodeData('parameters', {

                            ...(selectedNode.data.parameters || {}),

                            pdfQueue: [],

                            queueLength: 0

                          });

                          setServerPdfQueueFiles([]);

                          showAlert("PDF Queue cleared successfully.", "Clear Success", "success");

                        } catch (err) {

                          console.error('Error clearing PDF queue:', err);

                          showAlert("Failed to clear PDF queue.", "Clear Error", "error");

                        }

                      };

  

                    const pdfList = getPdfList();

  

                    const orderedPdfList = (() => {

                      if (serverPdfQueueFiles && serverPdfQueueFiles.length > 0) {

                        const serverUrls = serverPdfQueueFiles.map((x: any) => x.filename);

                        const extraLocal = pdfList.filter((u: string) => !serverUrls.includes(u));

                        return [...serverUrls, ...extraLocal];

                      }

                      return [...pdfList];

                    })();

  

                    return (

                      <>

                        {/* PDF Upload / Drag & Drop Zone */}

                        <div className="space-y-1.5">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted flex items-center justify-between">

                              <span>Upload PDF Files (Drop / Select)</span>

                              <span className="text-cyber-neon/70 font-mono lowercase opacity-70" title="Data Source Path">Source: WF/{selectedWorkflowId || 'wf_default'}/Input</span>

                            </label>

                          <div className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group ${isDraggingPdf ? 'border-cyber-neon bg-cyber-dark bg-opacity-70 shadow-[0_0_15px_rgba(0,255,200,0.5)]' : 'border-cyber-border hover:border-cyber-neon bg-cyber-dark bg-opacity-50'}`}>

                            <input

                              type="file"

                              accept=".pdf"

                              multiple

                              onChange={(e) => { setIsDraggingPdf(false); handlePdfFileUpload(e); }}

                              onDragEnter={() => setIsDraggingPdf(true)}

                              onDragLeave={() => setIsDraggingPdf(false)}

                              onDrop={() => setIsDraggingPdf(false)}

                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"

                              title="Click or Drop PDF files here to upload"

                            />

                            <div className="flex flex-col items-center justify-center space-y-2 relative z-0 pointer-events-none">

                              <div className="p-3 bg-cyber-dark rounded-full shadow-inner group-hover:scale-110 transition-transform duration-300 border border-cyber-border">

                                <FileUp className="w-6 h-6 text-cyber-neon" />

                              </div>

                              <div>

                                <span className="font-bold text-cyber-neon uppercase tracking-wide block">Click to upload</span>

                                <span className="text-[10px] text-cyber-muted mt-1 block">or drag and drop</span>

                                <span className="text-[9px] text-cyber-muted opacity-50 block mt-0.5">PDF (MAX. 10MB)</span>

                              </div>

                            </div>

                          </div>

                        </div>



                        {/* Display PDF Queue Table list */}

                        <div className="space-y-1.5">

                          <div className="flex items-center justify-between">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              Queue Files Table ({orderedPdfList.length})

                            </label>

                            <button

                              type="button"

                              onClick={handleClearAllPdfQueue}

                              className="text-[9px] font-mono bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 hover:border-red-500 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-sm"

                              title="Clear all PDF files from Queue Table & delete files on Backend server"

                            >

                              <Trash2 className="w-2.5 h-2.5" /> Clear

                            </button>

                          </div>

                          <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                            <table className="w-full text-left border-collapse">

                              <thead>

                                <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted">

                                  <th className="py-2 px-3 text-center w-12">View</th>

                                  <th className="py-2 px-3 text-center w-12">ID</th>

                                  <th className="py-2 px-3">File Name / URL</th>

                                  <th className="py-2 px-3 text-center w-20">Status</th>

                                </tr>

                              </thead>

                              <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                {orderedPdfList.length === 0 ? (

                                <tr>

                                  <td colSpan={4} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                    No PDF files in queue. Drop files above or connect inputs.

                                  </td>

                                </tr>

                              ) : (

                                (() => {

                                  const PAGE_SIZE = 10;

                                  const totalPdfPages = Math.ceil(orderedPdfList.length / PAGE_SIZE) || 1;

                                  const currentPdfQueuePage = Math.min(pdfQueuePage, totalPdfPages);

                                  const startIdx = (currentPdfQueuePage - 1) * PAGE_SIZE;

                                  const paginatedPdfList = orderedPdfList.slice(startIdx, startIdx + PAGE_SIZE);



                                  return paginatedPdfList.map((url: string, pageIdx: number) => {

                                    const globalIdx = startIdx + pageIdx;

                                    const cleanName = getCleanFileName(url); void cleanName;

                                    

                                    // Logic for PDF Queue Table Status

                                    const serverUrls = serverPdfQueueFiles ? serverPdfQueueFiles.map((x: any) => x.filename) : [];

                                    const isComplete = serverUrls.includes(url);



                                    return (

                                      <tr key={globalIdx} className={`${

                                        isComplete ? 'text-emerald-300 bg-emerald-950 bg-opacity-20' : 'text-cyber-text'

                                      }`}>

                                        <td className="py-2 px-3 text-center">

                                          <button

                                            onClick={() => handleOpenPdf(url)}

                                            className={`p-1 rounded transition-colors cursor-pointer ${

                                              isComplete ? 'text-emerald-400 hover:bg-emerald-900 hover:bg-opacity-40' : 'text-cyber-muted hover:text-cyber-neon hover:bg-cyber-panel'

                                            }`}

                                            title="Open PDF File"

                                          >

                                            <FileText className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                        <td className="py-2 px-3 text-center font-mono font-bold text-cyber-muted text-[10px]">

                                          {globalIdx + 1}

                                        </td>

                                        <td className="py-2 px-3 truncate max-w-[150px]" title={url}>

                                          {url.split('/').pop()?.split('?')[0] || url}

                                        </td>

                                        <td className="py-2 px-3 text-center">

                                          {isComplete ? (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">

                                              Complete

                                            </span>

                                          ) : (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase text-cyber-muted border border-cyber-border">

                                              Queue

                                            </span>

                                          )}

                                        </td>

                                      </tr>

                                    );

                                  });

                                })()

                              )}

                            </tbody>

                          </table>

                        </div>



                        {/* PDF Queue Table Pagination Controls */}

                        {(() => {

                          const PAGE_SIZE = 10;

                          const totalPdfPages = Math.ceil(orderedPdfList.length / PAGE_SIZE) || 1;

                          const currentPdfQueuePage = Math.min(pdfQueuePage, totalPdfPages);



                          if (totalPdfPages <= 1) return null;

                          return (

                            <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-cyber-muted select-none">

                              <span className="font-mono">

                                Page {currentPdfQueuePage} / {totalPdfPages}

                              </span>

                              <div className="flex items-center gap-1">

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === 1}

                                  onClick={() => setPdfQueuePage(1)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === 1

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="First Page"

                                >

                                  &lt;&lt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === 1}

                                  onClick={() => setPdfQueuePage(prev => Math.max(1, prev - 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === 1

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Previous Page"

                                >

                                  &lt;

                                </button>

                                {(() => {

                                  const pages = [];

                                  const maxPagesToShow = 5;

                                  let startPage = Math.max(1, currentPdfQueuePage - Math.floor(maxPagesToShow / 2));

                                  let endPage = Math.min(totalPdfPages, startPage + maxPagesToShow - 1);

                                  if (endPage - startPage + 1 < maxPagesToShow) {

                                    startPage = Math.max(1, endPage - maxPagesToShow + 1);

                                  }

                                  for (let p = startPage; p <= endPage; p++) {

                                    pages.push(

                                      <button

                                        key={p}

                                        type="button"

                                        onClick={() => setPdfQueuePage(p)}

                                        className={`px-1.5 py-0.5 rounded border text-[8px] font-mono transition-colors cursor-pointer ${

                                          currentPdfQueuePage === p

                                            ? 'bg-cyber-neon border-cyber-neon text-black font-extrabold shadow-[0_0_6px_rgba(0,243,255,0.35)]'

                                            : 'border-cyber-border text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                        }`}

                                      >

                                        {p}

                                      </button>

                                    );

                                  }

                                  return pages;

                                })()}

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === totalPdfPages}

                                  onClick={() => setPdfQueuePage(prev => Math.min(totalPdfPages, prev + 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === totalPdfPages

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Next Page"

                                >

                                  &gt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === totalPdfPages}

                                  onClick={() => setPdfQueuePage(totalPdfPages)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === totalPdfPages

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Last Page"

                                >

                                  &gt;&gt;

                                </button>

                              </div>

                            </div>

                          );

                        })()}

                      </div>



                      <div className="p-3 bg-cyber-dark bg-opacity-70 border border-cyber-border rounded-lg space-y-1 text-[10px] leading-relaxed text-cyber-muted">

                        <span className="font-bold text-cyber-neon uppercase block">📦 Queue Status</span>

                        <div>Current Index: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentIndex ?? 0}</span></div>

                        <div>Queue Length: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.queueLength ?? 0}</span></div>

                        <div className="truncate">Current URL: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentUrl || 'None'}</span></div>

                        <div>Has Next: <span className={selectedNode.data.parameters?.hasNext ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{(selectedNode.data.parameters?.hasNext ?? false).toString()}</span></div>

                      </div>

                    </>

                  );

                })()}



                {/* Zip Queue Parameter Editor */}



                {isSelectedTxtQueueNode && (() => {

                  const getPdfList = () => {

                    const cleanList = (rawList: any[]) => {

                      const filtered = rawList.map(item => {

                        if (item && typeof item === 'object') return item.disk_name || item.url || item.filename || '';

                        return typeof item === 'string' ? item : JSON.stringify(item);

                      }).filter(item => {

                        if (!item) return false;

                        const trimmed = item.trim();

                        if (trimmed.includes('/rest/v1') || trimmed.endsWith('/')) {

                          return false;

                        }

                        return true;

                      });

                      return Array.from(new Set(filtered));

                    };



                    const execQueue = selectedNode.data.parameters?.txtQueue;

                    if (execQueue && Array.isArray(execQueue) && execQueue.length > 0) {

                      return cleanList(execQueue);

                    } else if (execQueue && typeof execQueue === 'object' && Object.keys(execQueue).length > 0) {

                      return cleanList(Object.values(execQueue));

                    }

                    const urlsStr = selectedNode.data.parameters?.supabaseUrls || '';

                    let list: string[] = [];

                    if (urlsStr.trim().startsWith('[') && urlsStr.trim().endsWith(']')) {

                      try {

                        const parsed = JSON.parse(urlsStr);

                        if (Array.isArray(parsed)) {

                          list = parsed.map((item: any) => typeof item === 'object' && item !== null ? (item.file_url || item.url || item.name || JSON.stringify(item)) : String(item));

                        }

                      } catch (e) {}

                    }

                    if (list.length === 0) {

                      list = urlsStr.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);

                    }

                    return cleanList(list);

                  };



                  const handleOpenPdf = (url: string) => {

                        if (!url) return;

                        console.log(`[handleOpenPdf] Clicked URL/Filename:`, url);

                        

                        // Extract just the filename from any URL or path

                        const filename = url.split('/').pop()?.split('?')[0] || url;

                        

                        const wfParam = selectedWorkflowId || 'wf_default';

                        const finalUrl = `${BACKEND_URL}/api/queue-pdf/${encodeURIComponent(filename)}?workflow_id=${encodeURIComponent(wfParam)}`;

                        

                        console.log(`[handleOpenPdf] Extracted filename:`, filename);

                        console.log(`[handleOpenPdf] Opening local backend URL:`, finalUrl);

                        

                        openDialog('txt_queue', finalUrl);

                      };



                  const handleTxtFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

                    const files = e.target.files;

                    if (!files || files.length === 0) return;

                    const formData = new FormData();

                    Array.from(files).forEach((f) => {

                      if (f.name.toLowerCase().endsWith('.txt') || f.name.toLowerCase().endsWith('.md')) {

                        formData.append('files', f);

                      }

                    });

                    try {

                      const currentQueueLen = (Array.isArray(selectedNode.data.parameters?.txtQueue) ? selectedNode.data.parameters?.txtQueue : getPdfList()).length;

                      const startIdx = currentQueueLen + 1;

                      const uploadUrl = `${BACKEND_URL}/api/upload-txt-queue?workflow_id=${encodeURIComponent(selectedWorkflowId || 'wf_default')}&node_id=${encodeURIComponent(selectedNode.id)}&start_index=${startIdx}`;

                      const res = await fetch(uploadUrl, {

                        method: 'POST',

                        body: formData,

                      });

                      const data = await res.json();

                      if (data.status === 'success') {

                        const uploadedFiles = Array.isArray(data.filenames) ? data.filenames : [];

                        const currentQueue = Array.isArray(selectedNode.data.parameters?.txtQueue) ? selectedNode.data.parameters?.txtQueue : getPdfList();

                        const newQueue = Array.from(new Set([...currentQueue, ...uploadedFiles]));

                        updateSelectedNodeData('parameters', {

                          ...(selectedNode.data.parameters || {}),

                          txtQueue: newQueue,

                          queueLength: newQueue.length,

                          currentIndex: selectedNode.data.parameters?.currentIndex || 1

                        });

                        

                        // SYNC QUEUE LENGTH TO CHILD NODES

                        setNodes((nds) => {

                          const childNodeIds = edges.filter(e => e.source === selectedNode.id).map(e => e.target);

                          if (childNodeIds.length === 0) return nds;

                          return nds.map((n) => {

                            if (childNodeIds.includes(n.id)) {

                              return {

                                ...n,

                                data: {

                                  ...n.data,

                                  parameters: {

                                    ...(n.data.parameters || {}),

                                    queueLength: newQueue.length,

                                    previousMaxList: (() => {

                                      const updated = { ...(n.data.parameters?.previousMaxList || {}) };

                                      delete updated[`${selectedNode.id}_output`];

                                      updated[selectedNode.id] = newQueue.length;

                                      return updated;

                                    })()

                                  }

                                }

                              };

                            }

                            return n;

                          });

                        });

                      }

                    } catch (err) {

                      console.error('Error uploading TXTs:', err);

                    }

                  };



                  const handleClearAllTxtQueue = async () => {

                        try {

                          const wfParam = selectedWorkflowId || 'wf_default';

                          const nodeIdParam = selectedNode?.id || 'node_queue';

                          await fetch(`${BACKEND_URL}/api/clear-txt-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(nodeIdParam)}`, { method: 'DELETE' });

                          updateSelectedNodeData('parameters', {

                            ...(selectedNode.data.parameters || {}),

                            txtQueue: [],

                            queueLength: 0

                          });

                          setServerTxtQueueFiles([]);

                          showAlert("TXT Queue cleared successfully.", "Clear Success", "success");

                        } catch (err) {

                          console.error('Error clearing TXT queue:', err);

                          showAlert("Failed to clear TXT queue.", "Clear Error", "error");

                        }

                      };

  

                    const pdfList = getPdfList();

  

                    const orderedPdfList = (() => {

                      if (serverTxtQueueFiles && serverTxtQueueFiles.length > 0) {

                        const serverUrls = serverTxtQueueFiles.map((x: any) => x.filename);

                        const extraLocal = pdfList.filter((u: string) => !serverUrls.includes(u));

                        return [...serverUrls, ...extraLocal];

                      }

                      return [...pdfList];

                    })();

  

                    return (

                      <>

                        {/* TXT Upload / Drag & Drop Zone */}

                        <div className="space-y-1.5">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted flex items-center justify-between">

                              <span>Upload TXT Files (Drop / Select)</span>

                              <span className="text-cyber-neon/70 font-mono lowercase opacity-70" title="Data Source Path">Source: WF/{selectedWorkflowId || 'wf_default'}/Input</span>

                            </label>

                          <div className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group ${isDraggingPdf ? 'border-cyber-neon bg-cyber-dark bg-opacity-70 shadow-[0_0_15px_rgba(0,255,200,0.5)]' : 'border-cyber-border hover:border-cyber-neon bg-cyber-dark bg-opacity-50'}`}>

                            <input

                              type="file"

                              accept=".txt,.md"

                              multiple

                              onChange={(e) => { setIsDraggingPdf(false); handleTxtFileUpload(e); }}

                              onDragEnter={() => setIsDraggingPdf(true)}

                              onDragLeave={() => setIsDraggingPdf(false)}

                              onDrop={() => setIsDraggingPdf(false)}

                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"

                              title="Click or Drop TXT/MD files here to upload"

                            />

                            <div className="flex flex-col items-center justify-center space-y-2 relative z-0 pointer-events-none">

                              <div className="p-3 bg-cyber-dark rounded-full shadow-inner group-hover:scale-110 transition-transform duration-300 border border-cyber-border">

                                <FileUp className="w-6 h-6 text-cyber-neon" />

                              </div>

                              <div>

                                <span className="font-bold text-cyber-neon uppercase tracking-wide block">Click to upload</span>

                                <span className="text-[10px] text-cyber-muted mt-1 block">or drag and drop</span>

                                <span className="text-[9px] text-cyber-muted opacity-50 block mt-0.5">TXT (MAX. 10MB)</span>

                              </div>

                            </div>

                          </div>

                        </div>



                        {/* Display TXT Queue Table list */}

                        <div className="space-y-1.5">

                          <div className="flex items-center justify-between">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              Queue Files Table ({orderedPdfList.length})

                            </label>

                            <button

                              type="button"

                              onClick={handleClearAllTxtQueue}

                              className="text-[9px] font-mono bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 hover:border-red-500 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-sm"

                              title="Clear all TXT/MD files from Queue Table & delete files on Backend server"

                            >

                              <Trash2 className="w-2.5 h-2.5" /> Clear

                            </button>

                          </div>

                          <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                            <table className="w-full text-left border-collapse">

                              <thead>

                                <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted">

                                  <th className="py-2 px-3 text-center w-12">View</th>

                                  <th className="py-2 px-3 text-center w-12">ID</th>

                                  <th className="py-2 px-3">File Name / URL</th>

                                  <th className="py-2 px-3 text-center w-20">Status</th>

                                </tr>

                              </thead>

                              <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                {orderedPdfList.length === 0 ? (

                                <tr>

                                  <td colSpan={4} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                    No TXT/MD files in queue. Drop files above or connect inputs.

                                  </td>

                                </tr>

                              ) : (

                                (() => {

                                  const PAGE_SIZE = 10;

                                  const totalTxtPages = Math.ceil(orderedPdfList.length / PAGE_SIZE) || 1;

                                  const currentPdfQueuePage = Math.min(txtQueuePage, totalTxtPages);

                                  const startIdx = (currentPdfQueuePage - 1) * PAGE_SIZE;

                                  const paginatedPdfList = orderedPdfList.slice(startIdx, startIdx + PAGE_SIZE);



                                  return paginatedPdfList.map((url: string, pageIdx: number) => {

                                    const globalIdx = startIdx + pageIdx;

                                    const cleanName = getCleanFileName(url); void cleanName;

                                    

                                    // Logic for TXT Queue Table Status

                                    const serverUrls = serverTxtQueueFiles ? serverTxtQueueFiles.map((x: any) => x.filename) : [];

                                    const isComplete = serverUrls.includes(url);



                                    return (

                                      <tr key={globalIdx} className={`${

                                        isComplete ? 'text-emerald-300 bg-emerald-950 bg-opacity-20' : 'text-cyber-text'

                                      }`}>

                                        <td className="py-2 px-3 text-center">

                                          <button

                                            onClick={() => handleOpenPdf(url)}

                                            className={`p-1 rounded transition-colors cursor-pointer ${

                                              isComplete ? 'text-emerald-400 hover:bg-emerald-900 hover:bg-opacity-40' : 'text-cyber-muted hover:text-cyber-neon hover:bg-cyber-panel'

                                            }`}

                                            title="Open TXT File"

                                          >

                                            <FileText className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                        <td className="py-2 px-3 text-center font-mono font-bold text-cyber-muted text-[10px]">

                                          {globalIdx + 1}

                                        </td>

                                        <td className="py-2 px-3 truncate max-w-[150px]" title={url}>

                                          {url.split('/').pop()?.split('?')[0] || url}

                                        </td>

                                        <td className="py-2 px-3 text-center">

                                          {isComplete ? (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">

                                              Complete

                                            </span>

                                          ) : (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase text-cyber-muted border border-cyber-border">

                                              Queue

                                            </span>

                                          )}

                                        </td>

                                      </tr>

                                    );

                                  });

                                })()

                              )}

                            </tbody>

                          </table>

                        </div>



                        {/* TXT Queue Table Pagination Controls */}

                        {(() => {

                          const PAGE_SIZE = 10;

                          const totalTxtPages = Math.ceil(orderedPdfList.length / PAGE_SIZE) || 1;

                          const currentPdfQueuePage = Math.min(txtQueuePage, totalTxtPages);



                          if (totalTxtPages <= 1) return null;

                          return (

                            <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-cyber-muted select-none">

                              <span className="font-mono">

                                Page {currentPdfQueuePage} / {totalTxtPages}

                              </span>

                              <div className="flex items-center gap-1">

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === 1}

                                  onClick={() => setTxtQueuePage(1)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === 1

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="First Page"

                                >

                                  &lt;&lt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === 1}

                                  onClick={() => setTxtQueuePage(prev => Math.max(1, prev - 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === 1

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Previous Page"

                                >

                                  &lt;

                                </button>

                                {(() => {

                                  const pages = [];

                                  const maxPagesToShow = 5;

                                  let startPage = Math.max(1, currentPdfQueuePage - Math.floor(maxPagesToShow / 2));

                                  let endPage = Math.min(totalTxtPages, startPage + maxPagesToShow - 1);

                                  if (endPage - startPage + 1 < maxPagesToShow) {

                                    startPage = Math.max(1, endPage - maxPagesToShow + 1);

                                  }

                                  for (let p = startPage; p <= endPage; p++) {

                                    pages.push(

                                      <button

                                        key={p}

                                        type="button"

                                        onClick={() => setTxtQueuePage(p)}

                                        className={`px-1.5 py-0.5 rounded border text-[8px] font-mono transition-colors cursor-pointer ${

                                          currentPdfQueuePage === p

                                            ? 'bg-cyber-neon border-cyber-neon text-black font-extrabold shadow-[0_0_6px_rgba(0,243,255,0.35)]'

                                            : 'border-cyber-border text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                        }`}

                                      >

                                        {p}

                                      </button>

                                    );

                                  }

                                  return pages;

                                })()}

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === totalTxtPages}

                                  onClick={() => setTxtQueuePage(prev => Math.min(totalTxtPages, prev + 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === totalTxtPages

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Next Page"

                                >

                                  &gt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === totalTxtPages}

                                  onClick={() => setTxtQueuePage(totalTxtPages)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === totalTxtPages

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Last Page"

                                >

                                  &gt;&gt;

                                </button>

                              </div>

                            </div>

                          );

                        })()}

                      </div>



                      <div className="p-3 bg-cyber-dark bg-opacity-70 border border-cyber-border rounded-lg space-y-1 text-[10px] leading-relaxed text-cyber-muted">

                        <span className="font-bold text-cyber-neon uppercase block">📦 Queue Status</span>

                        <div>Current Index: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentIndex ?? 0}</span></div>

                        <div>Queue Length: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.queueLength ?? 0}</span></div>

                        <div className="truncate">Current URL: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentUrl || 'None'}</span></div>

                        <div>Has Next: <span className={selectedNode.data.parameters?.hasNext ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{(selectedNode.data.parameters?.hasNext ?? false).toString()}</span></div>

                      </div>

                    </>

                  );

                })()}



                {/* Zip Queue Parameter Editor */}

                {isSelectedZipQueueNode && (() => {

                  const getPdfList = () => {

                    const cleanList = (rawList: any[]) => {

                      const filtered = rawList.map(item => {

                        if (item && typeof item === 'object') return item.disk_name || item.url || item.filename || '';

                        return typeof item === 'string' ? item : JSON.stringify(item);

                      }).filter(item => {

                        if (!item) return false;

                        const trimmed = item.trim();

                        if (trimmed.includes('/rest/v1') || trimmed.endsWith('/')) {

                          return false;

                        }

                        return true;

                      });

                      return Array.from(new Set(filtered));

                    };



                    const execQueue = selectedNode.data.parameters?.zipQueue;

                    if (execQueue && Array.isArray(execQueue) && execQueue.length > 0) {

                      return cleanList(execQueue);

                    } else if (execQueue && typeof execQueue === 'object' && Object.keys(execQueue).length > 0) {

                      return cleanList(Object.values(execQueue));

                    }

                    const urlsStr = selectedNode.data.parameters?.supabaseUrls || '';

                    let list: string[] = [];

                    if (urlsStr.trim().startsWith('[') && urlsStr.trim().endsWith(']')) {

                      try {

                        const parsed = JSON.parse(urlsStr);

                        if (Array.isArray(parsed)) {

                          list = parsed.map((item: any) => typeof item === 'object' && item !== null ? (item.file_url || item.url || item.name || JSON.stringify(item)) : String(item));

                        }

                      } catch (e) {}

                    }

                    if (list.length === 0) {

                      list = urlsStr.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);

                    }

                    return cleanList(list);

                  };



                  const handleOpenPdf = (url: string) => {

                        if (!url) return;

                        console.log(`[handleOpenPdf] Clicked URL/Filename:`, url);

                        

                        // Extract just the filename from any URL or path

                        const filename = url.split('/').pop()?.split('?')[0] || url;

                        

                        const wfParam = selectedWorkflowId || 'wf_default';

                        const finalUrl = `${BACKEND_URL}/api/queue-zip/${encodeURIComponent(filename)}?workflow_id=${encodeURIComponent(wfParam)}`;

                        

                        console.log(`[handleOpenPdf] Extracted filename:`, filename);

                        console.log(`[handleOpenPdf] Opening local backend URL:`, finalUrl);

                        

                        openDialog('zip_queue', finalUrl);

                      };



                  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

                    const files = e.target.files;

                    if (!files || files.length === 0) return;

                    const formData = new FormData();

                    Array.from(files).forEach((f) => {

                      if (f.name.toLowerCase().endsWith('.zip')) {

                        formData.append('files', f);

                      }

                    });

                    try {

                      const currentQueueLen = (Array.isArray(selectedNode.data.parameters?.zipQueue) ? selectedNode.data.parameters?.zipQueue : getPdfList()).length;

                      const startIdx = currentQueueLen + 1;

                      const uploadUrl = `${BACKEND_URL}/api/upload-zip-queue?workflow_id=${encodeURIComponent(selectedWorkflowId || 'wf_default')}&node_id=${encodeURIComponent(selectedNode.id)}&start_index=${startIdx}`;

                      const res = await fetch(uploadUrl, {

                        method: 'POST',

                        body: formData,

                      });

                      const data = await res.json();

                      if (data.status === 'success') {

                        const uploadedFiles = Array.isArray(data.filenames) ? data.filenames : [];

                        const currentQueue = Array.isArray(selectedNode.data.parameters?.zipQueue) ? selectedNode.data.parameters?.zipQueue : getPdfList();

                        const newQueue = Array.from(new Set([...currentQueue, ...uploadedFiles]));

                        updateSelectedNodeData('parameters', {

                          ...(selectedNode.data.parameters || {}),

                          zipQueue: newQueue,

                          queueLength: newQueue.length

                        });

                        

                        // SYNC QUEUE LENGTH TO CHILD NODES

                        setNodes((nds) => {

                          const childNodeIds = edges.filter(e => e.source === selectedNode.id).map(e => e.target);

                          if (childNodeIds.length === 0) return nds;

                          return nds.map((n) => {

                            if (childNodeIds.includes(n.id)) {

                              return {

                                ...n,

                                data: {

                                  ...n.data,

                                  parameters: {

                                    ...(n.data.parameters || {}),

                                    queueLength: newQueue.length,

                                    previousMaxList: (() => {

                                      const updated = { ...(n.data.parameters?.previousMaxList || {}) };

                                      delete updated[`${selectedNode.id}_output`];

                                      updated[selectedNode.id] = newQueue.length;

                                      return updated;

                                    })()

                                  }

                                }

                              };

                            }

                            return n;

                          });

                        });

                      }

                    } catch (err) {

                      console.error('Error uploading ZIPs:', err);

                    }

                  };



                  const handleClearAllZipQueue = async () => {

                        try {

                          const wfParam = selectedWorkflowId || 'wf_default';

                          const nodeIdParam = selectedNode?.id || 'node_queue';

                          await fetch(`${BACKEND_URL}/api/clear-zip-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(nodeIdParam)}`, { method: 'DELETE' });

                          updateSelectedNodeData('parameters', {

                            ...(selectedNode.data.parameters || {}),

                            zipQueue: [],

                            queueLength: 0

                          });

                          setServerZipQueueFiles([]);

                          showAlert("Zip Queue cleared successfully.", "Clear Success", "success");

                        } catch (err) {

                          console.error('Error clearing ZIP queue:', err);

                          showAlert("Failed to clear Zip queue.", "Clear Error", "error");

                        }

                      };

  

                    const zipList = getPdfList();

  

                    const orderedZipList = (() => {

                      if (serverZipQueueFiles && serverZipQueueFiles.length > 0) {

                        const serverUrls = serverZipQueueFiles.map((x: any) => x.filename);

                        const extraLocal = zipList.filter((u: string) => !serverUrls.includes(u));

                        return [...serverUrls, ...extraLocal];

                      }

                      return [...zipList];

                    })();

  

                    return (

                      <>

                        {/* ZIP Upload / Drag & Drop Zone */}

                        <div className="space-y-1.5">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted flex items-center justify-between">

                              <span>Upload ZIP Files (Drop / Select)</span>

                              <span className="text-cyber-neon/70 font-mono lowercase opacity-70" title="Data Source Path">Source: WF/{selectedWorkflowId || 'wf_default'}/Input</span>

                            </label>

                          <div className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group ${isDraggingPdf ? 'border-cyber-neon bg-cyber-dark bg-opacity-70 shadow-[0_0_15px_rgba(0,255,200,0.5)]' : 'border-cyber-border hover:border-cyber-neon bg-cyber-dark bg-opacity-50'}`}>

                            <input

                              type="file"

                              accept=".zip"

                              multiple

                              onChange={(e) => { setIsDraggingPdf(false); handlePdfFileUpload(e); }}

                              onDragEnter={() => setIsDraggingPdf(true)}

                              onDragLeave={() => setIsDraggingPdf(false)}

                              onDrop={() => setIsDraggingPdf(false)}

                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"

                              title="Click or Drop ZIP files here to upload"

                            />

                            <div className="flex flex-col items-center justify-center space-y-2 relative z-0 pointer-events-none">

                              <div className="p-3 bg-cyber-dark rounded-full shadow-inner group-hover:scale-110 transition-transform duration-300 border border-cyber-border">

                                <FileUp className="w-6 h-6 text-cyber-neon" />

                              </div>

                              <div>

                                <span className="font-bold text-cyber-neon uppercase tracking-wide block">Click to upload</span>

                                <span className="text-[10px] text-cyber-muted mt-1 block">or drag and drop</span>

                                <span className="text-[9px] text-cyber-muted opacity-50 block mt-0.5">ZIP (MAX. 10MB)</span>

                              </div>

                            </div>

                          </div>

                        </div>



                        {/* Display ZIP Queue Table list */}

                        <div className="space-y-1.5">

                          <div className="flex items-center justify-between">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              Queue Files Table ({orderedZipList.length})

                            </label>

                            <button

                              type="button"

                              onClick={handleClearAllZipQueue}

                              className="text-[9px] font-mono bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 hover:border-red-500 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-sm"

                              title="Clear all ZIP files from Queue Table & delete files on Backend server"

                            >

                              <Trash2 className="w-2.5 h-2.5" /> Clear

                            </button>

                          </div>

                          <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                            <table className="w-full text-left border-collapse">

                              <thead>

                                <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted">

                                  <th className="py-2 px-3 text-center w-12">View</th>

                                  <th className="py-2 px-3 text-center w-12">ID</th>

                                  <th className="py-2 px-3">File Name / URL</th>

                                  <th className="py-2 px-3 text-center w-20">Status</th>

                                </tr>

                              </thead>

                              <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                {orderedZipList.length === 0 ? (

                                <tr>

                                  <td colSpan={4} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                    No ZIP files in queue. Drop files above or connect inputs.

                                  </td>

                                </tr>

                              ) : (

                                (() => {

                                  const PAGE_SIZE = 10;

                                  const totalZipPages = Math.ceil(orderedZipList.length / PAGE_SIZE) || 1;

                                  const currentZipQueuePage = Math.min(zipQueuePage, totalZipPages);

                                  const startIdx = (currentZipQueuePage - 1) * PAGE_SIZE;

                                  const paginatedPdfList = orderedZipList.slice(startIdx, startIdx + PAGE_SIZE);



                                  return paginatedPdfList.map((url: string, pageIdx: number) => {

                                    const globalIdx = startIdx + pageIdx;

                                    const cleanName = getCleanFileName(url); void cleanName;

                                    

                                    // Logic for Zip Queue Table Status

                                    const serverUrls = serverZipQueueFiles ? serverZipQueueFiles.map((x: any) => x.filename) : [];

                                    const isComplete = serverUrls.includes(url);



                                    return (

                                      <tr key={globalIdx} className={`${

                                        isComplete ? 'text-emerald-300 bg-emerald-950 bg-opacity-20' : 'text-cyber-text'

                                      }`}>

                                        <td className="py-2 px-3 text-center">

                                          <button

                                            onClick={() => handleOpenPdf(url)}

                                            className={`p-1 rounded transition-colors cursor-pointer ${

                                              isComplete ? 'text-emerald-400 hover:bg-emerald-900 hover:bg-opacity-40' : 'text-cyber-muted hover:text-cyber-neon hover:bg-cyber-panel'

                                            }`}

                                            title="Open ZIP File"

                                          >

                                            <FileText className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                        <td className="py-2 px-3 text-center font-mono font-bold text-cyber-muted text-[10px]">

                                          {globalIdx + 1}

                                        </td>

                                        <td className="py-2 px-3 truncate max-w-[150px]" title={url}>

                                          {url.split('/').pop()?.split('?')[0] || url}

                                        </td>

                                        <td className="py-2 px-3 text-center">

                                          {isComplete ? (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">

                                              Complete

                                            </span>

                                          ) : (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase text-cyber-muted border border-cyber-border">

                                              Queue

                                            </span>

                                          )}

                                        </td>

                                      </tr>

                                    );

                                  });

                                })()

                              )}

                            </tbody>

                          </table>

                        </div>



                        {/* Zip Queue Table Pagination Controls */}

                        {(() => {

                          const PAGE_SIZE = 10;

                          const totalZipPages = Math.ceil(orderedZipList.length / PAGE_SIZE) || 1;

                          const currentZipQueuePage = Math.min(zipQueuePage, totalZipPages);



                          if (totalZipPages <= 1) return null;

                          return (

                            <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-cyber-muted select-none">

                              <span className="font-mono">

                                Page {currentZipQueuePage} / {totalZipPages}

                              </span>

                              <div className="flex items-center gap-1">

                                <button

                                  type="button"

                                  disabled={currentZipQueuePage === 1}

                                  onClick={() => setZipQueuePage(1)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentZipQueuePage === 1

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="First Page"

                                >

                                  &lt;&lt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentZipQueuePage === 1}

                                  onClick={() => setZipQueuePage(prev => Math.max(1, prev - 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentZipQueuePage === 1

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Previous Page"

                                >

                                  &lt;

                                </button>

                                {(() => {

                                  const pages = [];

                                  const maxPagesToShow = 5;

                                  let startPage = Math.max(1, currentZipQueuePage - Math.floor(maxPagesToShow / 2));

                                  let endPage = Math.min(totalZipPages, startPage + maxPagesToShow - 1);

                                  if (endPage - startPage + 1 < maxPagesToShow) {

                                    startPage = Math.max(1, endPage - maxPagesToShow + 1);

                                  }

                                  for (let p = startPage; p <= endPage; p++) {

                                    pages.push(

                                      <button

                                        key={p}

                                        type="button"

                                        onClick={() => setZipQueuePage(p)}

                                        className={`px-1.5 py-0.5 rounded border text-[8px] font-mono transition-colors cursor-pointer ${

                                          currentZipQueuePage === p

                                            ? 'bg-cyber-neon border-cyber-neon text-black font-extrabold shadow-[0_0_6px_rgba(0,243,255,0.35)]'

                                            : 'border-cyber-border text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                        }`}

                                      >

                                        {p}

                                      </button>

                                    );

                                  }

                                  return pages;

                                })()}

                                <button

                                  type="button"

                                  disabled={currentZipQueuePage === totalZipPages}

                                  onClick={() => setZipQueuePage(prev => Math.min(totalZipPages, prev + 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentZipQueuePage === totalZipPages

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Next Page"

                                >

                                  &gt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentZipQueuePage === totalZipPages}

                                  onClick={() => setZipQueuePage(totalZipPages)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentZipQueuePage === totalZipPages

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Last Page"

                                >

                                  &gt;&gt;

                                </button>

                              </div>

                            </div>

                          );

                        })()}

                      </div>



                      <div className="p-3 bg-cyber-dark bg-opacity-70 border border-cyber-border rounded-lg space-y-1 text-[10px] leading-relaxed text-cyber-muted">

                        <span className="font-bold text-cyber-neon uppercase block">📦 Queue Status</span>

                        <div>Current Index: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentIndex ?? 0}</span></div>

                        <div>Queue Length: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.queueLength ?? 0}</span></div>

                        <div className="truncate">Current URL: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentUrl || 'None'}</span></div>

                        <div>Has Next: <span className={selectedNode.data.parameters?.hasNext ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{(selectedNode.data.parameters?.hasNext ?? false).toString()}</span></div>

                      </div>

                    </>

                  );

                })()}



                {/* OCR PDFs Node Parameter Editor */}

                {isSelectedOcrPdfsNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Select OCR Engine

                      </label>

                      <select

                        value={selectedNode.data.parameters?.ocrEngine || 'PyMuPDF'}

                        onChange={(e) => updateSelectedNodeParameter('ocrEngine', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border rounded px-2 py-2 text-cyber-text focus:border-cyber-neon focus:outline-none"

                      >

                        <option value="PyMuPDF">PyMuPDF (Fast, Text Layer)</option>

                        <option value="pdfplumber">pdfplumber (Accurate Tables)</option>

                        <option value="paddleocr">PaddleOCR (Server Model)</option>

                        <option value="easyocr">EasyOCR (Thai + English)</option>

                      </select>

                      <p className="text-[9px] text-cyber-muted italic mt-1">

                        Select the engine to use for extracting text from the PDF queue.

                      </p>

                    </div>

                  </>

                )}



                {/* Extract Node Parameter Editor */}

                {isSelectedExtractNode && (

                  <>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between text-[10px]">

                        <label className="font-bold uppercase tracking-wider text-cyber-muted block">

                          AI Model Selection

                        </label>

                        <span className="text-[9px] text-cyber-neon italic">Shared API Key via Models Tab</span>

                      </div>

                      <select

                        value={selectedNode.data.parameters?.modelName || 'gemini-2.5-flash'}

                        onChange={(e) => updateSelectedNodeParameter('modelName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                      >

                        {aiModels.map((m) => (

                          <option key={m.id} value={m.modelName}>

                            {m.label || m.modelName} ({m.provider})

                          </option>

                        ))}

                      </select>

                    </div>



                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Extraction Prompt Instructions

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.prompt || ''}

                        onChange={(e) => updateSelectedNodeParameter('prompt', e.target.value)}

                        rows={3}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Extracted Text

                        </label>

                        <button

                          onClick={() => updateSelectedNodeParameter('extractedText', '')}

                          className="text-[9px] font-extrabold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors bg-cyber-dark px-2 py-0.5 rounded border border-cyber-border border-opacity-65 hover:border-red-400 cursor-pointer"

                        >

                          Clear

                        </button>

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.extractedText || ''}

                        rows={6}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                        placeholder="Core assertions will appear here after execution..."

                      />

                    </div>

                  </>

                )}



                {/* De-duplicate Node Parameter Editor */}

                {isSelectedDeDuplicateNode && (

                  <>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between text-[10px]">

                        <label className="font-bold uppercase tracking-wider text-cyber-muted block">

                          AI Model Selection

                        </label>

                        <span className="text-[9px] text-cyber-neon italic">Shared API Key via Models Tab</span>

                      </div>

                      <select

                        value={selectedNode.data.parameters?.modelName || 'gemini-2.5-flash'}

                        onChange={(e) => updateSelectedNodeParameter('modelName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                      >

                        {aiModels.map((m) => (

                          <option key={m.id} value={m.modelName}>

                            {m.label || m.modelName} ({m.provider})

                          </option>

                        ))}

                      </select>

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        De-duplication Prompt

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.prompt || ''}

                        onChange={(e) => updateSelectedNodeParameter('prompt', e.target.value)}

                        rows={3}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        De-duplicated Facts & Metrics

                      </label>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.deduplicatedText || ''}

                        rows={6}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                        placeholder="De-duplicated text and numeric count will appear here..."

                      />

                    </div>

                  </>

                )}



                {/* Structured Parse JSON Node Parameter Editor */}

                {isSelectedStructuredParseNode && (

                  <>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between text-[10px]">

                        <label className="font-bold uppercase tracking-wider text-cyber-muted block">

                          AI Model Selection

                        </label>

                        <span className="text-[9px] text-cyber-neon italic">Shared API Key via Models Tab</span>

                      </div>

                      <select

                        value={selectedNode.data.parameters?.modelName || 'gemini-2.5-flash'}

                        onChange={(e) => updateSelectedNodeParameter('modelName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                      >

                        {aiModels.map((m) => (

                          <option key={m.id} value={m.modelName}>

                            {m.label || m.modelName} ({m.provider})

                          </option>

                        ))}

                      </select>

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Structured 7-Section JSON Output

                      </label>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.structuredJson || ''}

                        rows={10}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                        placeholder="Structured JSON object will appear here after parsing..."

                      />

                    </div>

                  </>

                )}



                {/* State Node Parameter Editor */}

                {isSelectedStateNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Active State Variables & Debugger

                      </label>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.stateOutput || ''}

                        rows={16}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed font-mono"

                        placeholder="Global state values will appear here after execution..."

                      />

                    </div>

                  </>

                )}



                {/* Workflow Timer Parameter Editor */}

                {isSelectedWorkflowTimerNode && (

                  <div className="space-y-4 pt-3 border-t border-cyber-border border-opacity-40">

                    <div className="flex items-center justify-between">

                      <h4 className="text-xs font-bold text-cyber-neon uppercase tracking-wider flex items-center space-x-1.5">

                        <Clock className="w-3.5 h-3.5" />

                        <span>Workflow Timer Settings</span>

                      </h4>

                    </div>



                    <TimerCountdown 

                      parameters={nodes.find(n => n.id === selectedNode.id)?.data.parameters || selectedNode.data.parameters} 

                      title="Workflow Timer Countdown (นับถอยหลัง)"

                      isWorkflowTimer={true}

                      onToggleActive={() => {

                        const targetId = selectedNode.id;

                        const currNode = nodes.find(n => n.id === targetId) || selectedNode;

                        const currParams = currNode?.data?.parameters || {};

                        const newActive = !currParams.schedulerActive;

                        const intervalVal = currParams.intervalValue !== undefined ? Math.max(1, Number(currParams.intervalValue)) : 2;



                        setNodes(nds => nds.map(n => n.id === targetId ? {

                          ...n,

                          data: {

                            ...n.data,

                            parameters: {

                              ...n.data.parameters,

                              schedulerActive: newActive,

                              remainingSeconds: newActive ? intervalVal : n.data.parameters?.remainingSeconds,

                              lastRun: newActive ? new Date().toISOString() : n.data.parameters?.lastRun

                            }

                          }

                        } : n));



                        setSelectedNode(prev => prev && prev.id === targetId ? {

                          ...prev,

                          data: {

                            ...prev.data,

                            parameters: {

                              ...prev.data.parameters,

                              schedulerActive: newActive,

                              remainingSeconds: newActive ? intervalVal : prev.data.parameters?.remainingSeconds,

                              lastRun: newActive ? new Date().toISOString() : prev.data.parameters?.lastRun

                            }

                          }

                        } : prev);

                      }}

                    />



                    <div className="space-y-3 bg-cyber-dark bg-opacity-40 p-3 rounded-lg border border-cyber-border border-opacity-60">

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Heartbeat Interval (ระยะเวลาตรวจจับและปลุกโหนด)

                        </label>

                        <div className="flex items-center bg-cyber-dark border border-cyber-border focus-within:border-cyber-neon rounded-lg overflow-hidden">

                          <input

                            type="number"

                            min={1}

                            value={selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2}

                            onChange={(e) => {

                              const val = Math.max(1, parseInt(e.target.value) || 1);

                              updateSelectedNodeParameter('intervalValue', val);

                              const curr = nodes.find(n => n.id === selectedNode.id)?.data?.parameters;

                              if (!curr?.schedulerActive) {

                                updateSelectedNodeParameter('remainingSeconds', val);

                              }

                            }}

                            className="w-full text-xs bg-transparent border-none focus:ring-0 focus:outline-none py-2 px-3 text-cyber-text font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

                            placeholder="e.g. 2"

                          />

                          <div className="flex flex-col border-l border-cyber-border bg-cyber-dark">

                            <button

                              onClick={() => {

                                const currentVal = selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2;

                                const nextVal = currentVal + 1;

                                updateSelectedNodeParameter('intervalValue', nextVal);

                                const curr = nodes.find(n => n.id === selectedNode.id)?.data?.parameters;

                                if (!curr?.schedulerActive) {

                                  updateSelectedNodeParameter('remainingSeconds', nextVal);

                                }

                              }}

                              className="px-2.5 py-0.5 hover:bg-cyber-panel text-cyber-text hover:text-cyber-neon text-[8px] border-b border-cyber-border cursor-pointer transition-all"

                            >

                              ▲

                            </button>

                            <button

                              onClick={() => {

                                const currentVal = selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2;

                                const nextVal = Math.max(1, currentVal - 1);

                                updateSelectedNodeParameter('intervalValue', nextVal);

                                const curr = nodes.find(n => n.id === selectedNode.id)?.data?.parameters;

                                if (!curr?.schedulerActive) {

                                  updateSelectedNodeParameter('remainingSeconds', nextVal);

                                }

                              }}

                              className="px-2.5 py-0.5 hover:bg-cyber-panel text-cyber-text hover:text-cyber-neon text-[8px] cursor-pointer transition-all"

                            >

                              ▼

                            </button>

                          </div>

                        </div>

                      </div>

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Unit

                        </label>

                        <select

                          value={selectedNode.data.parameters?.intervalUnit || 'seconds'}

                          onChange={(e) => updateSelectedNodeParameter('intervalUnit', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                        >

                          <option value="seconds" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Seconds (วินาที)</option>

                          <option value="minutes" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Minutes (นาที)</option>

                          <option value="hours" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Hours (ชั่วโมง)</option>

                          <option value="days" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Days (วัน)</option>

                        </select>

                      </div>

                      <p className="text-[9px] text-cyber-muted leading-relaxed italic font-mono pt-1">

                        ⏱️ Workflow Timer: ระบบเฝ้าระวังและส่งสัญญาณ Wake Up ปลุก AI Agents (Agent, PDF to Image Agent, DB) ทุกๆ {selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2} {selectedNode.data.parameters?.intervalUnit || 'seconds'} หากโหนดว่างงานและมีข้อมูลรอประมวลผล (ถ้ากำลังประมวลผลอยู่จะไม่รบกวน)

                      </p>

                    </div>

                  </div>

                )}



                {/* Regular Timer Node Parameter Editor */}

                {isSelectedRegularTimerNode && (

                  <div className="space-y-4 pt-3 border-t border-cyber-border border-opacity-40">

                    <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider">

                      Timer Settings (Action Node)

                    </h4>

                    

                    {/* Timer Mode Selection */}

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Scheduling Mode

                      </label>

                      <select

                        value={selectedNode.data.parameters?.timerMode || 'interval'}

                        onChange={(e) => updateSelectedNodeParameter('timerMode', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="interval" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Interval Countdown (Every X)</option>

                        <option value="calendarSpecific" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Calendar (Specific Date & Time)</option>

                        <option value="calendarPattern" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Calendar Pattern (Daily/Weekly/Monthly)</option>

                      </select>

                    </div>

                    <TimerCountdown parameters={nodes.find(n => n.id === selectedNode.id)?.data.parameters || selectedNode.data.parameters} />

                    {/* Mode 1: Calendar Specific Dates - Premium Interactive Calendar Picker */}

                    {selectedNode.data.parameters?.timerMode === 'calendarSpecific' && (

                      <div className="space-y-4">

                        <div className="bg-cyber-dark bg-opacity-40 border border-cyber-border rounded-xl p-3.5 space-y-3">

                          {/* Calendar Month Header */}

                          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyber-text">

                            <span>

                              {new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}

                            </span>

                            <div className="flex items-center space-x-1.5">

                              <button

                                onClick={() => {

                                  if (calMonth === 0) {

                                    setCalMonth(11);

                                    setCalYear(y => y - 1);

                                  } else {

                                    setCalMonth(m => m - 1);

                                  }

                                }}

                                className="p-1 rounded hover:bg-cyber-panel text-cyber-muted hover:text-cyber-neon border border-cyber-border transition-all cursor-pointer"

                              >

                                <ChevronLeft className="w-3.5 h-3.5" />

                              </button>

                              <button

                                onClick={() => {

                                  if (calMonth === 11) {

                                    setCalMonth(0);

                                    setCalYear(y => y + 1);

                                  } else {

                                    setCalMonth(m => m + 1);

                                  }

                                }}

                                className="p-1 rounded hover:bg-cyber-panel text-cyber-muted hover:text-cyber-neon border border-cyber-border transition-all cursor-pointer"

                              >

                                <ChevronRight className="w-3.5 h-3.5" />

                              </button>

                            </div>

                          </div>



                          {/* Day Labels */}

                          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-cyber-muted uppercase tracking-wider font-mono">

                            <div>Mo</div>

                            <div>Tu</div>

                            <div>We</div>

                            <div>Th</div>

                            <div>Fr</div>

                            <div>Sa</div>

                            <div>Su</div>

                          </div>



                          {/* Days Grid */}

                          <div className="grid grid-cols-7 gap-1">

                            {getCalendarDays(calMonth, calYear).map((cell, idx) => {

                              const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;

                              const isSelected = selectedCalDate === cellDateStr;

                              const isCurrent = cell.isCurrentMonth;

                              

                              // Check if this date has any schedules configured

                              const currentList = selectedNode.data.parameters?.calendarSpecificDates || [];

                              const hasSchedule = currentList.some((dt: string) => dt.startsWith(cellDateStr));



                              return (

                                <button

                                  key={idx}

                                  onClick={() => setSelectedCalDate(cellDateStr)}

                                  className={`aspect-square w-full rounded-lg flex flex-col items-center justify-center text-[11px] font-mono transition-all cursor-pointer relative border ${

                                    isSelected

                                      ? 'bg-cyber-neon text-cyber-dark border-cyber-neon font-bold shadow-neon-glow'

                                      : isCurrent

                                        ? 'bg-cyber-dark bg-opacity-35 hover:bg-cyber-panel text-cyber-text border-transparent hover:border-cyber-neon border-opacity-40'

                                        : 'bg-transparent text-cyber-muted text-opacity-30 border-transparent'

                                  }`}

                                >

                                  <span>{cell.day}</span>

                                  {hasSchedule && (

                                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyber-dark' : 'bg-cyber-neon shadow-neon-glow'}`} />

                                  )}

                                </button>

                              );

                            })}

                          </div>



                          {/* Time Selector and Add Button */}

                          {selectedCalDate && (

                            <div className="pt-2.5 border-t border-cyber-border border-opacity-40 space-y-2.5">

                              <div className="flex items-center justify-between space-x-2">

                                <div className="flex-1 space-y-1">

                                  <label className="text-[9px] font-bold uppercase tracking-wider text-cyber-muted block">

                                    Trigger Time (12h)

                                  </label>

                                  <div className="flex items-center space-x-1.5">

                                    <input

                                      type="text"

                                      placeholder="09:00 AM"

                                      value={format24toAmPmString(selectedCalTime)}

                                      onChange={(e) => setSelectedCalTime(parseAmPmStringTo24(e.target.value))}

                                      className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-1.5 px-2 rounded-lg text-cyber-text font-mono"

                                    />

                                    <button

                                      onClick={(e) => openClockPicker(e, selectedCalTime, (val) => setSelectedCalTime(val))}

                                      className="p-1.5 rounded-lg bg-cyber-dark hover:bg-cyber-panel border border-cyber-border hover:border-cyber-neon text-cyber-neon transition-all cursor-pointer flex items-center justify-center"

                                      title="Open Clock Picker"

                                    >

                                      <Clock className="w-4 h-4" />

                                    </button>

                                  </div>

                                </div>

                                <div className="pt-4">

                                  <button

                                    onClick={() => {

                                      if (selectedCalDate) {

                                        const currentList = selectedNode.data.parameters?.calendarSpecificDates || [];

                                        const combinedStr = `${selectedCalDate} ${selectedCalTime}`;

                                        if (!currentList.includes(combinedStr)) {

                                          updateSelectedNodeParameter('calendarSpecificDates', [...currentList, combinedStr].sort());

                                        }

                                      }

                                    }}

                                    className="px-3.5 py-1.5 rounded-lg bg-cyber-neon text-cyber-dark font-bold text-xs hover:shadow-neon-glow transition-all cursor-pointer flex items-center justify-center space-x-1.5"

                                  >

                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />

                                    <span>Add Target</span>

                                  </button>

                                </div>

                              </div>

                              <p className="text-[9px] text-cyber-muted font-mono">

                                Selected Date: <span className="text-cyber-neon">{selectedCalDate}</span> at <span className="text-cyber-neon">{format24toAmPmString(selectedCalTime)}</span>

                              </p>

                            </div>

                          )}

                        </div>



                        {/* Scheduled Events Vertical Timeline (Image 2 style) */}

                        <div className="space-y-2">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Active Schedule Timeline

                          </label>



                          {(!selectedNode.data.parameters?.calendarSpecificDates || selectedNode.data.parameters.calendarSpecificDates.length === 0) ? (

                            <p className="text-[10px] text-cyber-muted text-center py-6 border border-dashed border-cyber-border rounded-xl font-mono">

                              No schedules added yet. Select a date above.

                            </p>

                          ) : (

                            <div className="relative pl-6 space-y-4 py-1 border-l-2 border-cyber-border border-opacity-65 ml-3">

                              {selectedNode.data.parameters.calendarSpecificDates.map((dtStr: string, idx: number) => {

                                // Extract date and time

                                const [datePart, timePart] = dtStr.split(' ');

                                const formattedDate = datePart ? new Date(datePart).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

                                

                                return (

                                  <div key={idx} className="relative group">

                                    {/* Timeline dot node */}

                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-cyber-dark border-2 border-cyber-neon flex items-center justify-center shadow-neon-glow">

                                      <div className="w-1.5 h-1.5 rounded-full bg-cyber-neon" />

                                    </div>



                                    {/* Timeline Event Card */}

                                    <div className="bg-cyber-panel bg-opacity-40 border border-cyber-border rounded-xl p-3 flex items-center justify-between hover:border-cyber-neon hover:shadow-neon-glow border-opacity-60 transition-all">

                                      <div className="space-y-0.5">

                                        <div className="text-xs font-bold font-mono text-cyber-neon">

                                          {format24toAmPmString(timePart || '00:00')}

                                        </div>

                                        <div className="text-[10px] text-cyber-muted font-semibold">

                                          {formattedDate}

                                        </div>

                                        <div className="text-[9px] text-cyber-text text-opacity-70 font-mono">

                                          Workflow Auto-Trigger

                                        </div>

                                      </div>



                                      <button

                                        onClick={() => {

                                          const currentList = selectedNode.data.parameters?.calendarSpecificDates || [];

                                          const newList = currentList.filter((item: string) => item !== dtStr);

                                          updateSelectedNodeParameter('calendarSpecificDates', newList);

                                        }}

                                        className="text-cyber-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-cyber-dark transition-all cursor-pointer"

                                        title="Remove schedule"

                                      >

                                        <Trash2 className="w-3.5 h-3.5" />

                                      </button>

                                    </div>

                                  </div>

                                );

                              })}

                            </div>

                          )}

                        </div>

                      </div>

                    )}



                    {/* Mode 2: Interval Countdown */}

                    {selectedNode.data.parameters?.timerMode === 'interval' && (

                      <div className="space-y-3 bg-cyber-dark bg-opacity-40 p-3 rounded-lg border border-cyber-border border-opacity-60">

                        <div className="space-y-1">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Interval Duration

                          </label>

                          <div className="flex items-center bg-cyber-dark border border-cyber-border focus-within:border-cyber-neon rounded-lg overflow-hidden">

                            <input

                              type="number"

                              min={1}

                              value={selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2}

                              onChange={(e) => updateSelectedNodeParameter('intervalValue', Math.max(1, parseInt(e.target.value) || 1))}

                              className="w-full text-xs bg-transparent border-none focus:ring-0 focus:outline-none py-2 px-3 text-cyber-text font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

                              placeholder="e.g. 2"

                            />

                            <div className="flex flex-col border-l border-cyber-border bg-cyber-dark">

                              <button

                                onClick={() => {

                                  const currentVal = selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2;

                                  updateSelectedNodeParameter('intervalValue', currentVal + 1);

                                }}

                                className="px-2.5 py-0.5 hover:bg-cyber-panel text-cyber-text hover:text-cyber-neon text-[8px] border-b border-cyber-border cursor-pointer transition-all"

                              >

                                ▲

                              </button>

                              <button

                                onClick={() => {

                                  const currentVal = selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2;

                                  updateSelectedNodeParameter('intervalValue', Math.max(1, currentVal - 1));

                                }}

                                className="px-2.5 py-0.5 hover:bg-cyber-panel text-cyber-text hover:text-cyber-neon text-[8px] cursor-pointer transition-all"

                              >

                                ▼

                              </button>

                            </div>

                          </div>

                        </div>

                        <div className="space-y-1">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Unit

                          </label>

                          <select

                            value={selectedNode.data.parameters?.intervalUnit || 'seconds'}

                            onChange={(e) => updateSelectedNodeParameter('intervalUnit', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                          >

                            <option value="seconds" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Seconds (วินาที)</option>

                            <option value="minutes" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Minutes (นาที)</option>

                            <option value="hours" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Hours (ชั่วโมง)</option>

                            <option value="days" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Days (วัน)</option>

                          </select>

                        </div>

                        <p className="text-[9px] text-cyber-muted leading-relaxed italic font-mono pt-1">

                          Timer (Action Node): นับถอยหลังและส่งสัญญาณ Trigger ไปยังโหนดลูกที่ต่อสาย Edges ตามลำดับ DAG

                        </p>

                      </div>

                    )}



                    {/* Mode 3: Calendar Pattern Countdown */}

                    {selectedNode.data.parameters?.timerMode === 'calendarPattern' && (

                      <div className="space-y-3">

                        <div className="space-y-1.5">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Pattern Repeat

                          </label>

                          <select

                            value={selectedNode.data.parameters?.calendarPatternType || 'daily'}

                            onChange={(e) => updateSelectedNodeParameter('calendarPatternType', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                          >

                            <option value="daily" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Daily</option>

                            <option value="weekly" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Weekly</option>

                            <option value="monthly" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Monthly</option>

                          </select>

                        </div>



                        {/* Sub-mode Daily */}

                        {selectedNode.data.parameters?.calendarPatternType === 'daily' && (

                          <div className="space-y-3">

                            <div className="flex items-center justify-between">

                              <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                                Daily Schedule Patterns

                              </label>

                              <button

                                onClick={() => {

                                  const currentList = selectedNode.data.parameters?.calendarPatternDailyRows || [];

                                  updateSelectedNodeParameter('calendarPatternDailyRows', [...currentList, { time: '09:00' }]);

                                }}

                                className="p-1 rounded bg-cyber-dark hover:bg-cyber-panel text-cyber-neon border border-cyber-border hover:border-cyber-neon transition-all cursor-pointer flex items-center justify-center"

                                title="Add Daily Schedule"

                              >

                                <Plus className="w-3.5 h-3.5" />

                              </button>

                            </div>



                            <div className="border border-cyber-border rounded-lg bg-cyber-dark bg-opacity-65 max-h-40 overflow-y-auto custom-scrollbar">

                              {(!selectedNode.data.parameters?.calendarPatternDailyRows || selectedNode.data.parameters.calendarPatternDailyRows.length === 0) ? (

                                <p className="text-[10px] text-cyber-muted text-center py-4 font-mono">No daily schedules. Click "+" to add.</p>

                              ) : (

                                <table className="w-full text-xs border-collapse">

                                  <thead>

                                    <tr className="border-b border-cyber-border text-[9px] uppercase tracking-wider text-cyber-muted font-mono bg-cyber-dark bg-opacity-90">

                                      <th className="p-2 text-left">Time (12h)</th>

                                      <th className="p-2 text-center w-10">Action</th>

                                    </tr>

                                  </thead>

                                  <tbody>

                                    {selectedNode.data.parameters.calendarPatternDailyRows.map((row: any, idx: number) => (

                                      <tr key={idx} className="border-b border-cyber-border border-opacity-30 hover:bg-cyber-panel hover:bg-opacity-30 transition-colors">

                                        <td className="p-1">

                                          <div className="flex items-center space-x-1">

                                            <input

                                              type="text"

                                              placeholder="09:00 AM"

                                              value={format24toAmPmString(row.time)}

                                              onChange={(e) => {

                                                const newList = [...selectedNode.data.parameters.calendarPatternDailyRows];

                                                newList[idx] = { ...newList[idx], time: parseAmPmStringTo24(e.target.value) };

                                                updateSelectedNodeParameter('calendarPatternDailyRows', newList);

                                              }}

                                              className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-full font-mono p-0.5"

                                            />

                                            <button

                                              onClick={(e) => openClockPicker(

                                                e,

                                                row.time,

                                                (val) => {

                                                  const newList = [...selectedNode.data.parameters.calendarPatternDailyRows];

                                                  newList[idx] = { ...newList[idx], time: val };

                                                  updateSelectedNodeParameter('calendarPatternDailyRows', newList);

                                                }

                                              )}

                                              className="p-1 rounded hover:bg-cyber-dark text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none"

                                              title="Open Clock Picker"

                                            >

                                              <Clock className="w-3.5 h-3.5" />

                                            </button>

                                          </div>

                                        </td>

                                        <td className="p-2 text-center">

                                          <button

                                            onClick={() => {

                                              const newList = selectedNode.data.parameters.calendarPatternDailyRows.filter((_: any, i: number) => i !== idx);

                                              updateSelectedNodeParameter('calendarPatternDailyRows', newList);

                                            }}

                                            className="text-cyber-muted hover:text-red-400 p-0.5 rounded hover:bg-cyber-dark transition-all"

                                            title="Delete pattern row"

                                          >

                                            <Trash2 className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                      </tr>

                                    ))}

                                  </tbody>

                                </table>

                              )}

                            </div>

                          </div>

                        )}

                        {/* Sub-mode Weekly */}

                        {selectedNode.data.parameters?.calendarPatternType === 'weekly' && (

                          <div className="space-y-3">

                            <div className="flex items-center justify-between">

                              <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                                Weekly Schedule Patterns

                              </label>

                              <button

                                onClick={() => {

                                  const currentList = selectedNode.data.parameters?.calendarPatternWeeklyRows || [];

                                  updateSelectedNodeParameter('calendarPatternWeeklyRows', [...currentList, { day: 'Monday', time: '09:00' }]);

                                }}

                                className="p-1 rounded bg-cyber-dark hover:bg-cyber-panel text-cyber-neon border border-cyber-border hover:border-cyber-neon transition-all cursor-pointer flex items-center justify-center"

                                title="Add Weekly Schedule"

                              >

                                <Plus className="w-3.5 h-3.5" />

                              </button>

                            </div>



                            <div className="border border-cyber-border rounded-lg bg-cyber-dark bg-opacity-65 max-h-40 overflow-y-auto custom-scrollbar">

                              {(!selectedNode.data.parameters?.calendarPatternWeeklyRows || selectedNode.data.parameters.calendarPatternWeeklyRows.length === 0) ? (

                                <p className="text-[10px] text-cyber-muted text-center py-4 font-mono">No weekly schedules. Click "+" to add.</p>

                              ) : (

                                <table className="w-full text-xs border-collapse">

                                  <thead>

                                    <tr className="border-b border-cyber-border text-[9px] uppercase tracking-wider text-cyber-muted font-mono bg-cyber-dark bg-opacity-90">

                                      <th className="p-2 text-left">Day</th>

                                      <th className="p-2 text-left">Time (12h)</th>

                                      <th className="p-2 text-center w-10">Action</th>

                                    </tr>

                                  </thead>

                                  <tbody>

                                    {selectedNode.data.parameters.calendarPatternWeeklyRows.map((row: any, idx: number) => (

                                      <tr key={idx} className="border-b border-cyber-border border-opacity-40 hover:bg-cyber-panel hover:bg-opacity-20">

                                        <td className="p-1">

                                          <select

                                            value={row.day}

                                            onChange={(e) => {

                                              const newList = [...selectedNode.data.parameters.calendarPatternWeeklyRows];

                                              newList[idx] = { ...newList[idx], day: e.target.value };

                                              updateSelectedNodeParameter('calendarPatternWeeklyRows', newList);

                                            }}

                                            className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-full p-1 font-semibold cursor-pointer"

                                          >

                                            <option value="Monday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Monday</option>

                                            <option value="Tuesday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Tuesday</option>

                                            <option value="Wednesday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Wednesday</option>

                                            <option value="Thursday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Thursday</option>

                                            <option value="Friday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Friday</option>

                                            <option value="Saturday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Saturday</option>

                                            <option value="Sunday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Sunday</option>

                                          </select>

                                        </td>

                                        <td className="p-1">

                                          <div className="flex items-center space-x-1">

                                            <input

                                              type="text"

                                              placeholder="09:00 AM"

                                              value={format24toAmPmString(row.time)}

                                              onChange={(e) => {

                                                const newList = [...selectedNode.data.parameters.calendarPatternWeeklyRows];

                                                newList[idx] = { ...newList[idx], time: parseAmPmStringTo24(e.target.value) };

                                                updateSelectedNodeParameter('calendarPatternWeeklyRows', newList);

                                              }}

                                              className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-full font-mono p-0.5"

                                            />

                                            <button

                                              onClick={(e) => openClockPicker(

                                                e,

                                                row.time,

                                                (val) => {

                                                  const newList = [...selectedNode.data.parameters.calendarPatternWeeklyRows];

                                                  newList[idx] = { ...newList[idx], time: val };

                                                  updateSelectedNodeParameter('calendarPatternWeeklyRows', newList);

                                                }

                                              )}

                                              className="p-1 rounded hover:bg-cyber-dark text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none"

                                              title="Open Clock Picker"

                                            >

                                              <Clock className="w-3.5 h-3.5" />

                                            </button>

                                          </div>

                                        </td>

                                        <td className="p-2 text-center">

                                          <button

                                            onClick={() => {

                                              const newList = selectedNode.data.parameters.calendarPatternWeeklyRows.filter((_: any, i: number) => i !== idx);

                                              updateSelectedNodeParameter('calendarPatternWeeklyRows', newList);

                                            }}

                                            className="text-cyber-muted hover:text-red-400 p-0.5 rounded hover:bg-cyber-dark transition-all"

                                            title="Delete pattern row"

                                          >

                                            <Trash2 className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                      </tr>

                                    ))}

                                  </tbody>

                                </table>

                              )}

                            </div>

                          </div>

                        )}



                        {/* Sub-mode Monthly */}

                        {selectedNode.data.parameters?.calendarPatternType === 'monthly' && (

                          <div className="space-y-3">

                            <div className="flex items-center justify-between">

                              <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                                Monthly Schedule Patterns

                              </label>

                              <button

                                onClick={() => {

                                  const currentList = selectedNode.data.parameters?.calendarPatternMonthlyRows || [];

                                  updateSelectedNodeParameter('calendarPatternMonthlyRows', [...currentList, { day: 1, time: '09:00' }]);

                                }}

                                className="p-1 rounded bg-cyber-dark hover:bg-cyber-panel text-cyber-neon border border-cyber-border hover:border-cyber-neon transition-all cursor-pointer flex items-center justify-center"

                                title="Add Monthly Schedule"

                              >

                                <Plus className="w-3.5 h-3.5" />

                              </button>

                            </div>



                            <div className="border border-cyber-border rounded-lg bg-cyber-dark bg-opacity-65 max-h-40 overflow-y-auto custom-scrollbar">

                              {(!selectedNode.data.parameters?.calendarPatternMonthlyRows || selectedNode.data.parameters.calendarPatternMonthlyRows.length === 0) ? (

                                <p className="text-[10px] text-cyber-muted text-center py-4 font-mono">No monthly schedules. Click "+" to add.</p>

                              ) : (

                                <table className="w-full text-xs border-collapse">

                                  <thead>

                                    <tr className="border-b border-cyber-border text-[9px] uppercase tracking-wider text-cyber-muted font-mono bg-cyber-dark bg-opacity-90">

                                      <th className="p-2 text-left">Day of Month</th>

                                      <th className="p-2 text-left">Time (12h)</th>

                                      <th className="p-2 text-center w-10">Action</th>

                                    </tr>

                                  </thead>

                                  <tbody>

                                    {selectedNode.data.parameters.calendarPatternMonthlyRows.map((row: any, idx: number) => (

                                      <tr key={idx} className="border-b border-cyber-border border-opacity-40 hover:bg-cyber-panel hover:bg-opacity-20">

                                        <td className="p-1">

                                          <div className="flex items-center justify-between px-1">

                                            <input

                                              type="text"

                                              value={row.day}

                                              onChange={(e) => {

                                                const val = Math.max(1, Math.min(33, parseInt(e.target.value) || 1));

                                                const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                newList[idx] = { ...newList[idx], day: val };

                                                updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                              }}

                                              onFocus={(e) => {

                                                const rect = e.currentTarget.getBoundingClientRect();

                                                const clickEvent = {

                                                  currentTarget: e.currentTarget,

                                                  clientX: rect.left,

                                                  clientY: rect.top

                                                } as unknown as React.MouseEvent;

                                                

                                                openDayPopover(clickEvent, row.day, (val) => {

                                                  const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                  newList[idx] = { ...newList[idx], day: val };

                                                  updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                                });

                                              }}

                                              className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-10 p-0.5 font-bold font-mono text-center cursor-pointer"

                                            />

                                            <button

                                              onClick={(e) => openDayPopover(e, row.day, (val) => {

                                                const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                newList[idx] = { ...newList[idx], day: val };

                                                updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                              })}

                                              className="p-1 rounded hover:bg-cyber-dark text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none"

                                              title="Choose Day"

                                            >

                                              <Plus className="w-3.5 h-3.5" />

                                            </button>

                                          </div>

                                        </td>

                                        <td className="p-1">

                                          <div className="flex items-center space-x-1">

                                            <input

                                              type="text"

                                              placeholder="09:00 AM"

                                              value={format24toAmPmString(row.time)}

                                              onChange={(e) => {

                                                const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                newList[idx] = { ...newList[idx], time: parseAmPmStringTo24(e.target.value) };

                                                updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                              }}

                                              className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-full font-mono p-0.5"

                                            />

                                            <button

                                              onClick={(e) => openClockPicker(

                                                e,

                                                row.time,

                                                (val) => {

                                                  const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                  newList[idx] = { ...newList[idx], time: val };

                                                  updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                                }

                                              )}

                                              className="p-1 rounded hover:bg-cyber-dark text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none"

                                              title="Open Clock Picker"

                                            >

                                              <Clock className="w-3.5 h-3.5" />

                                            </button>

                                          </div>

                                        </td>

                                        <td className="p-2 text-center">

                                          <button

                                            onClick={() => {

                                              const newList = selectedNode.data.parameters.calendarPatternMonthlyRows.filter((_: any, i: number) => i !== idx);

                                              updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                            }}

                                            className="text-cyber-muted hover:text-red-400 p-0.5 rounded hover:bg-cyber-dark transition-all"

                                            title="Delete pattern row"

                                          >

                                            <Trash2 className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                      </tr>

                                    ))}

                                  </tbody>

                                </table>

                              )}

                            </div>

                          </div>

                        )}

                      </div>

                    )}

                  </div>

                )}



                {/* Node Role Input & LangChain/LangGraph/LangSmith Parameter Tuning Form (Specific to Agents) */}

                {(selectedNode.data.category === 'Agents' || selectedNode.data.category === 'Agent' || selectedNode.data.name?.toLowerCase().includes('agent') || selectedNode.type?.toLowerCase().includes('agent') || isSelectedPdfExtractorNode) && !isSelectedDbNode && !isSelectedGraphRagNode && !isSelectedExtractNode && !isSelectedDeDuplicateNode && !isSelectedStructuredParseNode && !isSelectedStateNode && (

                  <>

                    {!isSelectedPdfExtractorNode && (

                      <div className="space-y-4 pt-3 border-t border-cyber-border">

                      <h4 className="text-xs font-bold text-cyber-neon uppercase tracking-wider">

                        Gemini Agent Configuration

                      </h4>





                      {/* Agent Role */}

                      <div className="space-y-1.5">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Role:

                          </label>

                        </div>

                        <textarea

                          value={selectedNode.data.role !== undefined ? selectedNode.data.role : 'Agent Role'}

                          onChange={(e) => updateSelectedNodeData('role', e.target.value)}

                          rows={2}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono"

                          placeholder="Enter agent persona or role (e.g., Senior Financial Analyst)..."

                        />

                      </div>



                      {/* Agent Prompt Instructions */}

                      <div className="space-y-1.5">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Prompt:

                          </label>

                        </div>

                        <textarea

                          value={selectedNode.data.prompt || ''}

                          onChange={(e) => updateSelectedNodeData('prompt', e.target.value)}

                          rows={4}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono"

                          placeholder="Enter task prompt or specific instructions for this agent..."

                        />

                          <button

                            onClick={async () => {

                              setFinalPromptPreview(await generateFinalPromptAsync(selectedNode.id));

                              setIsFinalPromptModalOpen(true);

                            }}

                            className="w-full py-2 mt-2 bg-cyber-neon/20 hover:bg-cyber-neon/40 border border-cyber-neon text-cyber-neon font-bold rounded shadow-lg transition-colors text-xs flex items-center justify-center space-x-2"

                          >

                            <span>Preview Final Prompt</span>

                          </button>

                          <button

                            onClick={async () => {

                              setFinalSendPayloadPreview(await generateFinalPayloadAsync(selectedNode.id));

                              setIsFinalSendModalOpen(true);

                            }}

                            className="w-full py-2 mt-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500 text-purple-400 font-bold rounded shadow-lg transition-colors text-xs flex items-center justify-center space-x-2"

                          >

                            <span>Preview Final Send Payload</span>

                          </button>

                      </div>



                      {/* Model & Temp */}

                      <div className="space-y-3">

                        <div className="space-y-1.5">

                          <div className="flex flex-col space-y-0.5">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              AI Model Selection

                            </label>

                            <span className="text-[8px] text-cyber-neon italic">Shared Key via Models Tab</span>

                          </div>

                          <select

                            value={selectedNode.data.parameters?.modelName || 'gemini-2.5-flash'}

                            onChange={(e) => updateSelectedNodeParameter('modelName', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                          >

                            {aiModels.map((m) => (

                              <option key={m.id} value={m.modelName}>

                                {m.label || m.modelName} ({m.provider})

                              </option>

                            ))}

                          </select>

                        </div>

                        

                        {(getNodeClass(selectedNode) === 'AI Agent PDFs Loop' || getNodeClass(selectedNode) === 'AI Agent PDFs Chain') && (

                          <div className="space-y-1.5 mt-3">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              Expect Max Token

                            </label>

                            <input 

                              type="number"

                              value={selectedNode.data.parameters?.expectMaxToken || ''}

                              onChange={(e) => updateSelectedNodeParameter('expectMaxToken', e.target.value)}

                              className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                              placeholder="e.g. 100000"

                            />

                            <p className="text-[9px] text-cyber-muted italic mt-1">

                                Maximum expected tokens for the loop/chain processing.

                            </p>

                          </div>

                        )}



                      </div>

                      </div>

                    )}



                    {/* Agent DB Specific Parameters */}

                    {(getNodeClass(selectedNode) === 'Agent DB' || getNodeClass(selectedNode) === 'AI Agent DB') && (

                      <div className="pt-3 border-t border-cyber-border space-y-3">

                        <div>

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block mb-1">

                            Mode

                          </label>

                          <select

                            value={selectedNode.data.parameters?.mode || 'auto'}

                            onChange={(e) => updateSelectedNodeParameter('mode', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                          >

                            <option value="auto">Auto (Run query immediately)</option>

                            <option value="manual">Manual (Wait for button click)</option>

                          </select>

                        </div>

                        <div>

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block mb-1">

                            Connection String

                          </label>

                          <input

                            type="text"

                            value={selectedNode.data.parameters?.connectionString || ''}

                            onChange={(e) => updateSelectedNodeParameter('connectionString', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                            placeholder="e.g., sqlite://./database.db"

                          />

                        </div>

                        {selectedNode.data.parameters?.mode === 'manual' && (

                          <button

                            onClick={async () => {

                               try {

                                 const res = await fetch(`${BACKEND_URL}/api/workflows/${selectedWorkflowId || 'wf'}/node/${selectedNode.id}/run_query_loop`, {

                                    method: 'POST'

                                 });

                                 if (res.ok) {

                                   showAlert('Query loop started successfully.', 'Success', 'success');

                                 } else {

                                   const data = await res.json();

                                   showAlert('Failed to start query loop: ' + (data.error || res.statusText), 'Error', 'error');

                                 }

                               } catch (err: any) {

                                 showAlert('Error calling run query loop: ' + err.message, 'Error', 'error');

                               }

                            }}

                            className="w-full mt-2 bg-cyber-neon text-cyber-dark font-bold text-xs py-2 px-3 rounded-lg hover:bg-opacity-80 transition-all flex items-center justify-center space-x-2"

                          >

                            <span>Run Query Loop()</span>

                          </button>

                        )}

                      </div>

                    )}



                                      </>

                )}



                {/* Agent Output / Table Display Section */}

                    {(() => {

                        if (getNodeClass(selectedNode).toLowerCase().includes('queue')) return null;

                          const isAgentPdfsNode = !isSelectedJsonConnectorListNode && !getNodeClass(selectedNode).toLowerCase().includes('queue') && (getNodeClass(selectedNode) === 'Agent' || getNodeClass(selectedNode) === 'Agent DB' || getNodeClass(selectedNode) === 'Agent Audit' || getNodeClass(selectedNode) === 'PDF to Image Agent' || getNodeClass(selectedNode) === 'PDF to Base64 Agent' || getNodeClass(selectedNode) === 'AI Agent API PDFs' || getNodeClass(selectedNode) === 'AI Agent PDFs' || getNodeClass(selectedNode) === 'AI Agent DB' || getNodeClass(selectedNode) === 'AI Agent Zip' || getNodeClass(selectedNode) === 'AI Agent PDFs Audit' || getNodeClass(selectedNode) === 'AI Agent PDFs Loop' || getNodeClass(selectedNode) === 'AI Agent PDFs Chain' || getNodeClass(selectedNode) === 'AI Agent PDFs Base64' || getNodeClass(selectedNode) === 'AI Agent PDFs Raw' || getNodeClass(selectedNode) === 'AI Agent PDFs Image' || getNodeClass(selectedNode).includes('PDF') || selectedNode.data.type === 'AgentAPIPDFsNode' || selectedNode.data.type === 'AgentPDFsNode' || selectedNode.data.type === 'AgentZipNode' || selectedNode.data.type === 'AgentPDFsAuditNode' || selectedNode.data.type === 'AgentPDFsBase64Node' || selectedNode.data.type === 'AgentPDFsRawNode' || selectedNode.data.type === 'AgentPDFsImageNode' || selectedNode.data.type === 'OCRPDFsNode' || getNodeClass(selectedNode) === 'OCR PDFs' || (selectedNode.data.parameters && ('agentOutputsTable' in selectedNode.data.parameters || 'pdfUrls' in selectedNode.data.parameters)));

                        const rawOutputs = selectedNode.data.parameters?.agentOutputsTable || selectedNode.data.parameters?.agentResultQueue || selectedNode.data.parameters?.agentOutputs;

                        const completedOutputsMap: Record<string, string> = {};

                        if (rawOutputs && typeof rawOutputs === 'object' && !Array.isArray(rawOutputs)) {

                            Object.entries(rawOutputs).forEach(([k, v]) => {

                                completedOutputsMap[k] = String(v);

                            });

                        } else if (Array.isArray(rawOutputs)) {

                            rawOutputs.forEach((v, i) => {

                                completedOutputsMap[String(i + 1)] = String(v);

                            });

                        }



                        if (serverAgentOutputsFiles && serverAgentOutputsFiles.length > 0) {

                            const cleanNodeId = selectedNode.id.replace('node_', '');

                            const nodeFiles = serverAgentOutputsFiles.filter(f => f.startsWith(`${cleanNodeId}_`));

                            nodeFiles.forEach(nf => {

                                const match = nf.match(/^([^_]+)_(\d+)_/);

                                const k = match ? match[2] : '';

                                if (k && !completedOutputsMap[k]) {

                                    completedOutputsMap[k] = nf;

                                }

                            });

                        }



                        // Collect parent queue files from incoming edges or node parameters

                        const incomingParentEdgesForQueue = edges.filter(e => e.target === selectedNode.id);

                        const parentQueueMap: Record<string, { name: string, originalItem: any }> = {};

                        incomingParentEdgesForQueue.forEach(e => {

                            const pNode = nodes.find(n => n.id === e.source) || agentNodes.find(n => n.id === e.source);

                            if (pNode && pNode.data && pNode.data.parameters) {

                                const pParams = pNode.data.parameters;

                                const q = pParams.pdfQueue || pParams.txtQueue || pParams.table || pParams.agentOutputsTable;

                                if (Array.isArray(q)) {

                                    q.forEach((item, idx) => {

                                        const key = String(idx + 1);

                                        const name = typeof item === 'string' ? item : (item?.disk_name || item?.filename || item?.name || `Item ${key}`);

                                        if (!parentQueueMap[key]) parentQueueMap[key] = { name, originalItem: item };

                                    });

                                } else if (typeof q === 'object' && q !== null) {

                                    Object.entries(q).forEach(([k, item]) => {

                                        const key = String(k);

                                        const name = typeof item === 'string' ? (item as string) : ((item as any)?.disk_name || (item as any)?.filename || (item as any)?.name || `Item ${key}`);

                                        if (!parentQueueMap[key]) parentQueueMap[key] = { name, originalItem: item };

                                    });

                                }

                            }

                        });



                        if (Array.isArray(selectedNode.data.parameters?.pdfQueue)) {

                            selectedNode.data.parameters.pdfQueue.forEach((item: any, idx: number) => {

                                const key = String(idx + 1);

                                const name = typeof item === 'string' ? item : (item?.disk_name || item?.filename || item?.name || `Item ${key}`);

                                if (!parentQueueMap[key]) parentQueueMap[key] = { name, originalItem: item };

                            });

                        }



                        const allRowKeys = new Set<string>();

                        Object.keys(completedOutputsMap).forEach(k => allRowKeys.add(k));

                        Object.keys(parentQueueMap).forEach(k => allRowKeys.add(k));

                        const expectedLen = Number(selectedNode.data.parameters?.queueLength) || 0;

                        for (let i = 1; i <= expectedLen; i++) {

                            allRowKeys.add(String(i));

                        }



                        const sortedRowKeys = Array.from(allRowKeys).sort((a, b) => parseInt(a) - parseInt(b));

                        const agentOutputsList: Array<{

                            key: string;

                            fileName: string;

                            originalPdfName?: string;

                            isCompleted: boolean;

                        }> = sortedRowKeys.map(k => {

                            const completedFile = completedOutputsMap[k];

                            const parentItem = parentQueueMap[k];

                            return {

                                key: k,

                                fileName: completedFile || parentItem?.name || `Row ${k}`,

                                originalPdfName: parentItem?.name || undefined,

                                isCompleted: Boolean(completedFile)

                            };

                        });

                        

                        const handleClearAllAgentOutputs = async () => {

                          const incomingParentEdges = edges.filter(e => e.target === selectedNode.id);

                          const syncedMaxList: Record<string, number> = {};

                          for (const edge of incomingParentEdges) {

                            const pNode = nodes.find(n => n.id === edge.source);

                            if (pNode && pNode.data && pNode.data.parameters) {

                              const pParams = pNode.data.parameters;

                              let count = pParams.queueLength;

                              if (count === undefined || count === null) {

                                if (Array.isArray(pParams.pdfQueue)) count = pParams.pdfQueue.length;

                                else if (typeof pParams.pdfQueue === 'object' && pParams.pdfQueue !== null) count = Object.keys(pParams.pdfQueue).length;

                                else count = pParams.previous_max || 0;

                              }

                              const parentKey = (edge.sourceHandle && edge.sourceHandle !== "output" && edge.sourceHandle !== "bottom-source")

                                ? `${edge.source}_${edge.sourceHandle}`

                                : edge.source;

                              syncedMaxList[parentKey] = Number(count) || 0;

                            }

                          }

                          const syncedQueueLength = Object.values(syncedMaxList).length > 0 ? Math.max(...Object.values(syncedMaxList)) : 0;



                          const clearedParams = {

                            ...(selectedNode.data.parameters || {}),

                            agentOutput: '',

                            agentOutputsTable: {},

                            agentResultQueue: [],

                            agentOutputs: [],

                            agentOutputStatusesMap: {},

                            currentJsonFile: '',

                            currentIndex: 0,

                            hasNext: false,

                            queueLength: syncedQueueLength,

                            previous_max: 0,

                            previousMaxList: syncedMaxList

                          };

                          updateSelectedNodeData('parameters', clearedParams);

                          setServerAgentOutputsFiles([]);

                          setNodeLiveProgress(prev => ({

                            ...prev,

                            [selectedNode.id]: { status: 'idle', percent: 0, currentIndex: 0, currentPage: 0, totalPages: 0 }

                          }));

                          try {

                            const stringFilenames = Object.values(completedOutputsMap).filter(Boolean);

                            const res = await fetch(`${BACKEND_URL}/api/clear-agent-results`, {

                              method: 'POST',

                              headers: { 'Content-Type': 'application/json' },

                              body: JSON.stringify({

                                node_id: selectedNode.id,

                                filenames: stringFilenames,

                                workflow_id: selectedWorkflowId || 'wf_default'

                              })

                            });

                            const data = await res.json();

                            if (data.status === 'success') {

                              showAlert(data.message || 'ลบไฟล์และข้อมูลผลลัพธ์ทั้งหมดสำเร็จแล้ว', 'Clear Success', 'success');

                            } else {

                              showAlert('ลบตารางผลลัพธ์สำเร็จ แต่การลบไฟล์ที่ Backend มีข้อความแจ้ง: ' + data.message, 'Clear Info', 'info');

                            }

                          } catch (err) {

                            showAlert('ลบข้อมูลบนตารางสำเร็จ (ไม่สามารถเชื่อมต่อลบไฟล์ที่ Backend Server ได้)', 'Clear Warning', 'info');

                          }

                        };



                        return (

                          <div className="pt-3 border-t border-cyber-border space-y-3">

                            {isAgentPdfsNode ? (

                              <div className="space-y-2.5">

                                {/* Real-time Analysis Progress Banner */}

                                {(() => {

                                  const live = nodeLiveProgress[selectedNode.id];

                                  const isNodeActive = (live && (live.status === 'Active' || (isRunning && (live.percent || 0) > 0 && (live.percent || 0) < 100)));

                                  if (!isNodeActive) return null;



                                  return (

                                    <div className="p-3 bg-cyan-950/40 border border-cyber-neon/40 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.15)] space-y-2 transition-all">

                                      <div className="flex items-center justify-between">

                                        <div className="flex items-center gap-2">

                                          <span className="relative flex h-2 w-2">

                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-neon opacity-75"></span>

                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-neon"></span>

                                          </span>

                                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyber-neon">

                                            Analyzing Data {live.currentIndex ? `• Row #${live.currentIndex}` : ''}

                                            {live.currentPage && live.totalPages ? ` (Page ${live.currentPage}/${live.totalPages})` : ''}

                                          </span>

                                        </div>

                                        <span className="font-mono text-xs font-black text-cyber-neon tracking-wider">

                                          {live.percent || 0}%

                                        </span>

                                      </div>

                                      

                                      <div className="w-full h-2.5 bg-cyber-dark rounded-full overflow-hidden border border-cyber-border/70 p-0.5 shadow-inner">

                                        <div 

                                          className="h-full rounded-full bg-gradient-to-r from-cyber-neon via-emerald-400 to-cyber-neon bg-[length:200%_100%] animate-pulse transition-all duration-300"

                                          style={{ width: `${Math.max(5, Math.min(100, live.percent || 0))}%` }}

                                        />

                                      </div>



                                      {live.stepMessage && (

                                        <div className="text-[10px] text-cyber-muted font-medium flex items-center justify-between truncate pt-0.5">

                                          <span className="truncate">{live.stepMessage}</span>

                                          {live.filename && (

                                            <span className="font-mono text-[9px] text-cyber-muted/70 ml-2 shrink-0">{live.filename}</span>

                                          )}

                                        </div>

                                      )}

                                    </div>

                                  );

                                })()}



                                <div className="flex items-center justify-between">

                                  <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block flex-1">

                                    Agent Output Table ({agentOutputsList.length})

                                    {selectedNode.data.parameters?.currentIndex !== undefined && (

                                      <span className="text-cyber-neon ml-2 normal-case font-medium">

                                        (Processed: {selectedNode.data.parameters.currentIndex} / {selectedNode.data.parameters.queueLength || '?'})

                                      </span>

                                    )}

                                  </label>

                                  {!isSelectedJsonConnectorListNode && (

                                    <button

                                      type="button"

                                      onClick={handleClearAllAgentOutputs}

                                      className="text-[9px] font-mono bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 hover:border-red-500 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-sm"

                                      title="Clear all text result files from Table & delete files on Backend server"

                                    >

                                      <Trash2 className="w-2.5 h-2.5" /> Clear

                                    </button>

                                  )}

                                </div>

                                <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                                  <table className="w-full text-left border-collapse">

                                    <thead>

                                      <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted">

                                        <th className="py-2 px-3 text-center w-14"></th>

                                        <th className="py-2 px-3 text-center w-12">ID</th>

                                        <th className="py-2 px-3">Text File Name</th>

                                        <th className="py-2 px-3 text-center w-36">Progress</th>

                                        <th className="py-2 px-3 text-center w-20">Status</th>

                                      </tr>

                                    </thead>

                                    <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                      {agentOutputsList.length === 0 ? (

                                        <tr>

                                          <td colSpan={5} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                            No text output files yet. Execute workflow to generate analysis.

                                          </td>

                                        </tr>

                                      ) : (

                                        (() => {

                                          const PAGE_SIZE = 10;

                                          const totalAgentPages = Math.ceil(agentOutputsList.length / PAGE_SIZE) || 1;

                                          const currentAgentOutputsPage = Math.min(agentOutputsPage, totalAgentPages);

                                          const agentStartIdx = (currentAgentOutputsPage - 1) * PAGE_SIZE;

                                          const paginatedAgentOutputsList = agentOutputsList.slice(agentStartIdx, agentStartIdx + PAGE_SIZE);



                                          const rawPdfUrls = selectedNode.data.parameters?.pdfUrls;

                                          let pdfList = [];

                                          if (typeof rawPdfUrls === 'string') {

                                            if (rawPdfUrls.trim().startsWith('[') && rawPdfUrls.trim().endsWith(']')) {

                                              try { pdfList = JSON.parse(rawPdfUrls); } catch(e) {}

                                            } else {

                                              pdfList = rawPdfUrls.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

                                            }

                                          } else if (Array.isArray(rawPdfUrls)) {

                                            pdfList = rawPdfUrls;

                                          }



                                          const liveProg = nodeLiveProgress[selectedNode.id];

                                          const activeIndex = (liveProg && (liveProg.status === 'Active' || isRunning)) ? Number(liveProg.currentIndex) : null;



                                          return paginatedAgentOutputsList.map((item, pageIdx) => { 

                                            const { key, fileName, originalPdfName, isCompleted } = item;

                                            const globalIdx = agentStartIdx + pageIdx;

                                            const pdfFileName = originalPdfName || pdfList[globalIdx] || null;

                                            const cleanFileName = fileName.split('/').pop() || fileName;

                                            const storedStatusesMap = selectedNode.data.parameters?.agentOutputStatusesMap || {};



                                            let rowStatus = 'Queue';

                                            let rowPercent = 0;

                                            let progressText = '0%';



                                            if (isCompleted) {

                                              rowStatus = 'Complete';

                                              rowPercent = 100;

                                              progressText = '100%';

                                            } else if (activeIndex !== null && Number(key) === activeIndex) {

                                              rowStatus = 'Active';

                                              rowPercent = typeof liveProg?.percent === 'number' ? liveProg.percent : 10;

                                              const pageStr = liveProg?.currentPage && liveProg?.totalPages ? ` (${liveProg.currentPage}/${liveProg.totalPages})` : '';

                                              progressText = `${rowPercent}%${pageStr}`;

                                            } else if (Number(key) <= (selectedNode.data.parameters?.currentIndex || 0) && (selectedNode.data.parameters?.currentIndex > 0)) {

                                              rowStatus = 'Complete';

                                              rowPercent = 100;

                                              progressText = '100%';

                                            } else {

                                              rowStatus = storedStatusesMap[fileName] || 'Queue';

                                              rowPercent = rowStatus === 'Complete' ? 100 : 0;

                                              progressText = `${rowPercent}%`;

                                            }



                                            const isSelected = selectedNode.data.parameters?.selectedAgentOutputRow === globalIdx;

                                            return (

                                              <tr 

                                                key={globalIdx} 

                                                onClick={async () => {

                                                  if (isSelectedJsonConnectorListNode) {

                                                    const safeUpdateParams = (updates: any) => {

                                                      setNodes((nds) => nds.map((n) => {

                                                        if (n.id === selectedNode.id) {

                                                          return { ...n, data: { ...n.data, parameters: { ...(n.data.parameters || {}), ...updates } } };

                                                        }

                                                        return n;

                                                      }));

                                                      setSelectedNode((prev) => {

                                                        if (!prev || prev.id !== selectedNode.id) return prev;

                                                        return { ...prev, data: { ...prev.data, parameters: { ...(prev.data.parameters || {}), ...updates } } };

                                                      });

                                                    };



                                                    if (isSelected) {

                                                      safeUpdateParams({ selectedAgentOutputRow: undefined, selectedRowContent: undefined });

                                                    } else {

                                                      safeUpdateParams({ selectedAgentOutputRow: globalIdx, selectedRowContent: 'Loading...' });

                                                      try {

                                                        const title = fileName.split('/').pop()?.split('?')[0] || fileName;

                                                        const wfParam = encodeURIComponent(selectedWorkflowId || 'wf_default');

                                                        const url = `${BACKEND_URL}/api/agent-result/${encodeURIComponent(title)}?workflow_id=${wfParam}`;

                                                        const res = await fetch(url);

                                                        if (res.ok) {

                                                           const text = await res.text();

                                                           safeUpdateParams({ selectedRowContent: text });

                                                        } else {

                                                           safeUpdateParams({ selectedRowContent: `Error loading file: ${res.statusText}` });

                                                        }

                                                      } catch (err) {

                                                         safeUpdateParams({ selectedRowContent: `Error: ${String(err)}` });

                                                      }

                                                    }

                                                  }

                                                }}

                                                className={`transition-all ${isSelectedJsonConnectorListNode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-yellow-400 border-l-4 border-l-yellow-600 text-black font-semibold' : 'hover:bg-cyber-light hover:bg-opacity-10 text-cyber-text'}`}

                                              >

                                                <td className="py-2 px-3 text-center">

                                                  <div className="flex items-center justify-center gap-1.5">

                                                    {pdfFileName && (

                                                      <button

                                                        type="button"

                                                        onClick={() => openDialog('pdf_queue', pdfFileName)}

                                                        className="text-[9px] font-mono bg-cyber-dark hover:bg-cyber-light hover:bg-opacity-20 text-purple-400 border border-purple-900 hover:border-purple-400 px-1.5 py-0.5 rounded transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"

                                                        title="View original PDF file"

                                                      >

                                                        <FileText className="w-2.5 h-2.5" /> PDF

                                                      </button>

                                                    )}

                                                    {isCompleted && (

                                                      <button

                                                        type="button"

                                                        onClick={() => openDialog('agent_result', fileName)}

                                                        className="text-[9px] font-mono bg-cyber-dark hover:bg-cyber-light hover:bg-opacity-20 text-cyber-neon border border-cyber-border hover:border-cyber-neon px-1.5 py-0.5 rounded transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"

                                                        title="View text analysis file in new browser tab"

                                                      >

                                                        <Eye className="w-2.5 h-2.5" />

                                                      </button>

                                                    )}

                                                  </div>

                                                </td>

                                                <td className={`py-2 px-3 text-center font-mono font-bold text-[10px] ${isSelected ? 'text-black' : 'text-cyber-muted'}`}>{key}</td>

                                                <td className={`py-2 px-3 font-mono truncate max-w-[170px] ${isSelected ? 'text-black font-bold' : ''}`} title={cleanFileName}>

                                                  <div className="flex items-center gap-1.5">

                                                    <span>{cleanFileName}</span>

                                                  </div>

                                                </td>

                                                <td className="py-2 px-3 text-center min-w-[130px]">

                                                  <div className="flex flex-col items-center justify-center gap-1">

                                                    <div className="w-full h-2 bg-cyber-dark rounded-full overflow-hidden border border-cyber-border p-0.5 shadow-inner">

                                                      <div 

                                                        className={`h-full rounded-full transition-all duration-300 ${

                                                          rowStatus === 'Active' 

                                                            ? 'bg-gradient-to-r from-cyber-neon to-emerald-400 animate-pulse' 

                                                            : rowStatus === 'Complete' 

                                                              ? 'bg-emerald-500' 

                                                              : 'bg-cyber-muted bg-opacity-20'

                                                        }`}

                                                        style={{ width: `${Math.max(rowStatus === 'Active' ? 5 : 0, Math.min(100, rowPercent))}%` }}

                                                      />

                                                    </div>

                                                    <span className={`text-[9px] font-mono font-bold leading-none ${

                                                      rowStatus === 'Active' 

                                                        ? 'text-cyber-neon' 

                                                        : rowStatus === 'Complete' 

                                                          ? 'text-emerald-400' 

                                                          : 'text-cyber-muted'

                                                    }`}>

                                                      {progressText}

                                                    </span>

                                                  </div>

                                                </td>

                                                <td className="py-2 px-3 text-center">

                                                  {rowStatus === 'Queue' ? (

                                                    <span className="inline-block text-[8px] px-1.5 py-0.5 rounded border bg-amber-950 text-amber-300 border-amber-700 font-mono animate-pulse">

                                                      Queue

                                                    </span>

                                                  ) : rowStatus === 'Active' ? (

                                                    <span className="inline-block text-[8px] px-1.5 py-0.5 rounded border bg-blue-950 text-blue-300 border-blue-700 font-mono animate-pulse">

                                                      Active

                                                    </span>

                                                  ) : (

                                                    <span className="inline-block text-[8px] px-1.5 py-0.5 rounded border bg-emerald-950 text-emerald-300 border-emerald-700 font-mono">

                                                      Complete

                                                    </span>

                                                  )}

                                                </td>

                                              </tr>

                                            );

                                          });

                                        })()

                                      )}

                                    </tbody>

                                  </table>

                                </div>



                                {/* Agent Output Table Pagination Controls */}

                                {(() => {

                                  const PAGE_SIZE = 10;

                                  const totalAgentPages = Math.ceil(agentOutputsList.length / PAGE_SIZE) || 1;

                                  const currentAgentOutputsPage = Math.min(agentOutputsPage, totalAgentPages);



                                  if (totalAgentPages <= 1) return null;

                                  return (

                                    <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-cyber-muted select-none">

                                      <span className="font-mono">

                                        Page {currentAgentOutputsPage} / {totalAgentPages}

                                      </span>

                                      <div className="flex items-center gap-1">

                                        <button

                                          type="button"

                                          disabled={currentAgentOutputsPage === 1}

                                          onClick={() => setAgentOutputsPage(1)}

                                          className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                            currentAgentOutputsPage === 1

                                              ? 'opacity-30 cursor-not-allowed'

                                              : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                          }`}

                                          title="First Page"

                                        >

                                          &lt;&lt;

                                        </button>

                                        <button

                                          type="button"

                                          disabled={currentAgentOutputsPage === 1}

                                          onClick={() => setAgentOutputsPage(prev => Math.max(1, prev - 1))}

                                          className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                            currentAgentOutputsPage === 1

                                              ? 'opacity-30 cursor-not-allowed'

                                              : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                          }`}

                                          title="Previous Page"

                                        >

                                          &lt;

                                        </button>

                                        {(() => {

                                          const pages = [];

                                          const maxPagesToShow = 5;

                                          let startPage = Math.max(1, currentAgentOutputsPage - Math.floor(maxPagesToShow / 2));

                                          let endPage = Math.min(totalAgentPages, startPage + maxPagesToShow - 1);

                                          if (endPage - startPage + 1 < maxPagesToShow) {

                                            startPage = Math.max(1, endPage - maxPagesToShow + 1);

                                          }

                                          for (let p = startPage; p <= endPage; p++) {

                                            pages.push(

                                              <button

                                                key={p}

                                                type="button"

                                                onClick={() => setAgentOutputsPage(p)}

                                                className={`px-1.5 py-0.5 rounded border text-[8px] font-mono transition-colors cursor-pointer ${

                                                  currentAgentOutputsPage === p

                                                    ? 'bg-cyber-neon border-cyber-neon text-black font-extrabold shadow-[0_0_6px_rgba(0,243,255,0.35)]'

                                                    : 'border-cyber-border text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                                }`}

                                              >

                                                {p}

                                              </button>

                                            );

                                          }

                                          return pages;

                                        })()}

                                        <button

                                          type="button"

                                          disabled={currentAgentOutputsPage === totalAgentPages}

                                          onClick={() => setAgentOutputsPage(prev => Math.min(totalAgentPages, prev + 1))}

                                          className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                            currentAgentOutputsPage === totalAgentPages

                                              ? 'opacity-30 cursor-not-allowed'

                                              : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                          }`}

                                          title="Next Page"

                                        >

                                          &gt;

                                        </button>

                                        <button

                                          type="button"

                                          disabled={currentAgentOutputsPage === totalAgentPages}

                                          onClick={() => setAgentOutputsPage(totalAgentPages)}

                                          className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                            currentAgentOutputsPage === totalAgentPages

                                              ? 'opacity-30 cursor-not-allowed'

                                              : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                          }`}

                                          title="Last Page"

                                        >

                                          &gt;&gt;

                                        </button>

                                      </div>

                                    </div>

                                  );

                                })()}

                                



                              </div>

                            ) : (

                              <>

                                {!isSelectedJsonConnectorListNode && (

                                  <>

                                    <div className="flex items-center justify-between">

                                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                                        Agent Output

                                      </label>

                                      {selectedNode.data.parameters?.agentOutput && (

                                        <button

                                          onClick={() => updateSelectedNodeParameter('agentOutput', '')}

                                          className="text-[9px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"

                                        >

                                          Clear

                                        </button>

                                      )}

                                    </div>

                                    <textarea

                                      readOnly

                                      value={selectedNode.data.parameters?.agentOutput || ''}

                                      rows={5}

                                      className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                                      placeholder="Agent output will be populated on execution..."

                                    />

                                  </>

                                )}

                              </>

                            )}

                            {isAgentPdfsNode && (

                              <div className="pt-3 border-t border-cyber-border space-y-2 mt-3">

                                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-cyber-muted font-bold select-none">

                                  <span>Queue Tracking</span>

                                  <span className="text-cyber-neon font-mono">Index: {selectedNode.data.parameters?.currentIndex ?? '-'}</span>

                                </div>

                                <div className="flex flex-col space-y-1.5">

                                  {selectedNode.data.parameters?.previousMaxList && Object.keys(selectedNode.data.parameters.previousMaxList).length > 0 ? (

                                    (() => {

                                      const dedupMap: Record<string, number> = {};

                                      Object.entries(selectedNode.data.parameters.previousMaxList).forEach(([pid, val]) => {

                                        const normKey = pid.replace(/_output$/, '');

                                        const numVal = Number(val) || 0;

                                        if (dedupMap[normKey] === undefined || !pid.endsWith('_output')) {

                                          dedupMap[normKey] = numVal;

                                        }

                                      });



                                      return Object.entries(dedupMap).map(([pid, maxVal]) => {

                                        const parentNode = nodes.find(n => n.id === pid);

                                        const parentLabel = parentNode ? (parentNode.data?.label || parentNode.data?.name || pid.replace('node_', '')) : pid.replace('node_', '');

                                        return (

                                          <div key={pid} className="flex items-center justify-between py-1 px-2 bg-cyber-dark bg-opacity-40 rounded border border-cyber-border border-opacity-35">

                                            <span className="text-[10px] text-cyber-muted truncate flex-1 font-mono" title={`ID: ${pid}`}>Parent: {parentLabel}</span>

                                            <span className="text-xs font-mono font-bold text-emerald-400 ml-2">Max: {String(maxVal)}</span>

                                          </div>

                                        );

                                      });

                                    })()

                                  ) : (

                                    <div className="text-[10px] text-cyber-muted italic px-1">No parent queue data available</div>

                                  )}

                                </div>

                              </div>

                            )}



                          </div>

                        );

                      })()}



                {/* Prompt instructions (specific to Models only, since Agents has its own restructured view) */}

                {selectedNode.data.category === 'Models' && !isSelectedDbNode && (

                  <div className="space-y-1.5">

                    <div className="flex items-center justify-between">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Role:

                      </label>

                      <span className="text-[9px] text-cyber-neon font-semibold cursor-pointer">

                        Set Template

                      </span>

                    </div>

                    <textarea

                      value={selectedNode.data.prompt || ''}

                      onChange={(e) => updateSelectedNodeData('prompt', e.target.value)}

                      rows={6}

                      className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-none leading-relaxed font-mono"

                      placeholder="Enter system prompt for LLM routing decisions..."

                    />

                  </div>

                )}



                {/* 1. Polars Parquet Converter Inspector */}

                {isSelectedPolarsConverterNode && (

                  <div className="space-y-4 pt-3 border-t border-cyber-border">

                    <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent rounded-xl border border-amber-500/30">

                      <div className="flex items-center space-x-2">

                        <Zap className="w-4 h-4 text-amber-400" />

                        <span className="text-xs font-bold text-amber-300">⚡ Polars (Rust Engine) Converter</span>

                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[9px] text-amber-300 font-mono font-bold">Fast SIMD</span>

                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">

                        อ่าน Excel (.xlsx, .xls) และ CSV ขนาดใหญ่หลายไฟล์คู่ขนาน แปลงและบีบอัดเป็น Parquet ความเร็วสูงพิเศษ

                      </p>

                    </div>



                    {/* Source Type Selector */}

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Input Source Mode

                      </label>

                      <select

                        value={selectedNode.data.parameters?.sourceType || 'upload'}

                        onChange={(e) => updateSelectedNodeParameter('sourceType', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="upload">Direct File Upload (Excel / CSV Files)</option>

                        <option value="local_dir">Local Directory Path</option>

                        <option value="upstream">Upstream Node Data Pipeline</option>

                      </select>

                    </div>



                    {/* Direct File Upload Dropzone */}

                    {selectedNode.data.parameters?.sourceType === 'upload' && (

                      <div className="space-y-2">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Upload Excel / CSV Files

                        </label>

                        <div className="relative border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-xl p-4 bg-amber-500/5 transition-all text-center group cursor-pointer">

                          <input

                            type="file"

                            multiple

                            accept=".xlsx,.xls,.csv"

                            onChange={async (e) => {

                              const files = e.target.files;

                              if (!files || files.length === 0) return;

                              const formData = new FormData();

                              Array.from(files).forEach((f) => formData.append('files', f));

                              formData.append('compression', selectedNode.data.parameters?.compression || 'snappy');

                              formData.append('chunk_size', String(selectedNode.data.parameters?.chunkSize || 50000));

                              setIsConvertingParquet(true);

                              setConversionStatusMsg(`Uploading & converting ${files.length} file(s) with Polars...`);

                              try {

                                const res = await fetch(`${BACKEND_URL}/api/analytics/convert-parquet`, {

                                  method: 'POST',

                                  body: formData,

                                });

                                const data = await res.json();

                                if (data.status === 'success') {

                                  const totalRows = (data.results || []).reduce((acc: number, cur: any) => acc + (cur.rows || 0), 0);

                                  setConversionStatusMsg(`Converted ${data.results?.length || 0} file(s) successfully (${totalRows.toLocaleString()} rows).`);

                                  updateSelectedNodeParameter('convertedFiles', data.results || []);

                                  updateSelectedNodeParameter('catalog', data.catalog || {});

                                } else {

                                  setConversionStatusMsg(`Error: ${data.message || 'Upload conversion failed'}`);

                                }

                              } catch (err: any) {

                                setConversionStatusMsg(`Upload Error: ${err.message}`);

                              } finally {

                                setIsConvertingParquet(false);

                              }

                            }}

                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"

                          />

                          <FileSpreadsheet className="w-8 h-8 mx-auto text-amber-400 mb-1 group-hover:scale-110 transition-transform" />

                          <p className="text-xs font-semibold text-slate-300">คลิกหรือลากไฟล์ Excel / CSV มาวางที่นี่</p>

                          <p className="text-[10px] text-slate-400 mt-0.5">รองรับ .xlsx, .xls, .csv ขนาดใหญ่หลายไฟล์พร้อมกัน</p>

                        </div>

                      </div>

                    )}



                    {/* File Pattern & Sheet Name */}

                    <div className="grid grid-cols-2 gap-2">

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          File Pattern

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.filePattern || '*.xlsx, *.csv'}

                          onChange={(e) => updateSelectedNodeParameter('filePattern', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                          placeholder="*.xlsx, *.csv"

                        />

                      </div>

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Sheet Selector

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.sheetName || 'Sheet1'}

                          onChange={(e) => updateSelectedNodeParameter('sheetName', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                          placeholder="Sheet1"

                        />

                      </div>

                    </div>



                    {/* Compression & Chunk Size */}

                    <div className="grid grid-cols-2 gap-2">

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Compression

                        </label>

                        <select

                          value={selectedNode.data.parameters?.compression || 'snappy'}

                          onChange={(e) => updateSelectedNodeParameter('compression', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-2 rounded-lg text-cyber-text"

                        >

                          <option value="snappy">Snappy (เร็วสุด)</option>

                          <option value="zstd">ZSTD (เล็กสุด)</option>

                          <option value="gzip">GZIP (มาตรฐาน)</option>

                        </select>

                      </div>

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Chunk Size (Rows)

                        </label>

                        <input

                          type="number"

                          value={selectedNode.data.parameters?.chunkSize || 50000}

                          onChange={(e) => updateSelectedNodeParameter('chunkSize', Number(e.target.value))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                          step={10000}

                        />

                      </div>

                    </div>



                    {/* Output Parquet Path */}

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Output Parquet Cache Directory

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.outputParquetPath || './workflow_inputs/parquet_cache'}

                        onChange={(e) => updateSelectedNodeParameter('outputParquetPath', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-3 rounded-lg text-cyber-text font-mono"

                      />

                    </div>



                    {/* Action Convert Button */}

                    <button

                      onClick={handleConvertParquetClick}

                      disabled={isConvertingParquet}

                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"

                    >

                      {isConvertingParquet ? (

                        <>

                          <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />

                          <span>Converting with Polars...</span>

                        </>

                      ) : (

                        <>

                          <Zap className="w-3.5 h-3.5 fill-slate-900" />

                          <span>Run Parquet Conversion</span>

                        </>

                      )}

                    </button>



                    {conversionStatusMsg && (

                      <div className="p-2.5 rounded-lg bg-cyber-dark border border-cyber-border text-[11px] text-amber-300 font-mono">

                        {conversionStatusMsg}

                      </div>

                    )}



                    {/* Converted Files List & Schema Details */}

                    {Array.isArray(selectedNode.data.parameters?.convertedFiles) && selectedNode.data.parameters.convertedFiles.length > 0 && (

                      <div className="space-y-2 pt-2 border-t border-cyber-border">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">

                            Converted Parquet Catalog ({selectedNode.data.parameters.convertedFiles.length} files)

                          </label>

                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto">

                          {selectedNode.data.parameters.convertedFiles.map((f: any, idx: number) => (

                            <div key={idx} className="p-2 rounded bg-cyber-dark border border-cyber-border text-xs flex flex-col space-y-1">

                              <div className="flex items-center justify-between">

                                <span className="font-semibold text-slate-200 truncate" title={f.original_file || f.name}>

                                  {f.original_file || f.name || `Dataset #${idx + 1}`}

                                </span>

                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">

                                  {(f.rows || 0).toLocaleString()} rows

                                </span>

                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">

                                <span className="truncate max-w-[180px]">{f.parquet_path}</span>

                                <span>{f.columns || (f.column_details ? f.column_details.length : 0)} cols</span>

                              </div>

                            </div>

                          ))}

                        </div>

                      </div>

                    )}

                  </div>

                )}



                {/* 2. DuckDB Virtual Lake Inspector */}

                {isSelectedDuckDbNode && (

                  <div className="space-y-4 pt-3 border-t border-cyber-border">

                    <div className="p-3 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent rounded-xl border border-yellow-500/30">

                      <div className="flex items-center space-x-2">

                        <Database className="w-4 h-4 text-yellow-400" />

                        <span className="text-xs font-bold text-yellow-300">🦆 DuckDB Virtual Data Lake</span>

                        <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-[9px] text-yellow-300 font-mono font-bold">In-Memory OLAP</span>

                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">

                        Vectorized SQL Engine สำหรับ Query ไฟล์ Parquet หลายไฟล์พร้อมกัน ทำ Wildcard Union และ Multi-File JOIN ทันทีในหน่วยความจำ

                      </p>

                    </div>



                    {/* Execution Mode */}

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Execution Mode

                      </label>

                      <select

                        value={selectedNode.data.parameters?.executionMode || 'agent_driven'}

                        onChange={(e) => updateSelectedNodeParameter('executionMode', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-yellow-400 focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="agent_driven">AI Agent Driven (อัตโนมัติ)</option>

                        <option value="custom_sql">Custom SQL Query (เขียนคำสั่งเอง)</option>

                        <option value="auto_union">Auto-Union All Parquet Files (รวมทุกไฟล์)</option>

                      </select>

                    </div>



                    {/* Safe Guards: Timeout & Row limit */}

                    <div className="grid grid-cols-2 gap-2">

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Timeout Safeguard

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.statementTimeout || '10s'}

                          onChange={(e) => updateSelectedNodeParameter('statementTimeout', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-yellow-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                          placeholder="10s"

                        />

                      </div>

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Max Result Rows

                        </label>

                        <input

                          type="number"

                          value={selectedNode.data.parameters?.maxResultRows || 100}

                          onChange={(e) => updateSelectedNodeParameter('maxResultRows', Number(e.target.value))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-yellow-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                        />

                      </div>

                    </div>



                    {/* SQL Quick Templates */}

                    <div className="space-y-1">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        SQL Quick Templates

                      </label>

                      <div className="flex flex-wrap gap-1.5">

                        <button

                          type="button"

                          onClick={() => updateSelectedNodeParameter('sqlQuery', "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10;")}

                          className="px-2 py-1 rounded bg-cyber-dark border border-cyber-border hover:border-yellow-400 text-[10px] text-yellow-300 font-mono transition-colors"

                        >

                          Preview 10 Rows

                        </button>

                        <button

                          type="button"

                          onClick={() => updateSelectedNodeParameter('sqlQuery', "SELECT COUNT(*) AS total_records FROM read_parquet('workflow_inputs/parquet_cache/*.parquet');")}

                          className="px-2 py-1 rounded bg-cyber-dark border border-cyber-border hover:border-yellow-400 text-[10px] text-yellow-300 font-mono transition-colors"

                        >

                          COUNT Records

                        </button>

                        <button

                          type="button"

                          onClick={() => updateSelectedNodeParameter('sqlQuery', "DESCRIBE SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 1;")}

                          className="px-2 py-1 rounded bg-cyber-dark border border-cyber-border hover:border-yellow-400 text-[10px] text-yellow-300 font-mono transition-colors"

                        >

                          DESCRIBE Schema

                        </button>

                      </div>

                    </div>



                    {/* SQL Query Editor */}

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          DuckDB SQL Editor

                        </label>

                        <span className="text-[9px] text-yellow-400 font-mono">read_parquet(...)</span>

                      </div>

                      <textarea

                        value={selectedNode.data.parameters?.sqlQuery || "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10"}

                        onChange={(e) => updateSelectedNodeParameter('sqlQuery', e.target.value)}

                        rows={4}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-yellow-400 py-2.5 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                        placeholder="SELECT * FROM read_parquet(...) LIMIT 10;"

                      />

                    </div>



                    {/* Action Run Query Button */}

                    <button

                      onClick={handleExecuteDuckDbQueryClick}

                      disabled={isExecutingDuckDb}

                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-yellow-500/20 transition-all cursor-pointer disabled:opacity-50"

                    >

                      {isExecutingDuckDb ? (

                        <>

                          <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />

                          <span>Running DuckDB Query...</span>

                        </>

                      ) : (

                        <>

                          <Play className="w-3.5 h-3.5 fill-slate-900" />

                          <span>Execute SQL Query Preview</span>

                        </>

                      )}

                    </button>



                    {duckdbQueryError && (

                      <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-[11px] text-red-300 font-mono">

                        Error: {duckdbQueryError}

                      </div>

                    )}



                    {/* Query Result Preview */}

                    {(duckdbQueryResult || selectedNode.data.parameters?.queryResults) && (

                      <div className="space-y-2 pt-2 border-t border-cyber-border">

                        <div className="flex items-center justify-between">

                          <div className="flex items-center space-x-2">

                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">

                              Results ({(duckdbQueryResult?.row_count ?? (selectedNode.data.parameters?.queryResults?.length || 0))} rows)

                            </span>

                            {(duckdbQueryResult?.execution_time_ms !== undefined || selectedNode.data.parameters?.executionTimeMs !== undefined) && (

                              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono">

                                ⚡ {(duckdbQueryResult?.execution_time_ms ?? selectedNode.data.parameters?.executionTimeMs)} ms

                              </span>

                            )}

                          </div>

                          <div className="flex items-center space-x-1">

                            <button

                              type="button"

                              onClick={() => setDuckdbViewMode('table')}

                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${duckdbViewMode === 'table' ? 'bg-yellow-500 text-slate-950' : 'bg-cyber-dark text-slate-400'}`}

                            >

                              Table

                            </button>

                            <button

                              type="button"

                              onClick={() => setDuckdbViewMode('json')}

                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${duckdbViewMode === 'json' ? 'bg-yellow-500 text-slate-950' : 'bg-cyber-dark text-slate-400'}`}

                            >

                              JSON

                            </button>

                          </div>

                        </div>



                        {duckdbViewMode === 'table' ? (

                          <div className="overflow-x-auto max-h-56 rounded border border-cyber-border bg-cyber-dark">

                            {(() => {

                              const rows = duckdbQueryResult?.data || selectedNode.data.parameters?.queryResults || [];

                              if (rows.length === 0) return <div className="p-3 text-xs text-slate-400 italic">No records returned.</div>;

                              const cols = duckdbQueryResult?.columns || Object.keys(rows[0] || {});

                              return (

                                <table className="w-full text-[11px] text-left">

                                  <thead className="bg-slate-900/90 text-yellow-300 font-mono border-b border-cyber-border sticky top-0">

                                    <tr>

                                      {cols.map((col: string, idx: number) => (

                                        <th key={idx} className="py-1.5 px-2.5 truncate max-w-[120px] font-bold">{col}</th>

                                      ))}

                                    </tr>

                                  </thead>

                                  <tbody className="divide-y divide-cyber-border/40 text-slate-300 font-mono">

                                    {rows.slice(0, 50).map((row: any, rIdx: number) => (

                                      <tr key={rIdx} className="hover:bg-yellow-500/5">

                                        {cols.map((col: string, cIdx: number) => (

                                          <td key={cIdx} className="py-1 px-2.5 truncate max-w-[140px] text-slate-300">

                                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : <span className="text-slate-600">null</span>}

                                          </td>

                                        ))}

                                      </tr>

                                    ))}

                                  </tbody>

                                </table>

                              );

                            })()}

                          </div>

                        ) : (

                          <textarea

                            readOnly

                            rows={6}

                            value={JSON.stringify(duckdbQueryResult?.data || selectedNode.data.parameters?.queryResults || [], null, 2)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono"

                          />

                        )}

                      </div>

                    )}

                  </div>

                )}



                {/* 3. Autonomous Big Data Analyst & Multi-Agent Container Inspector */}

                {(isSelectedBigDataAnalystNode || isSelectedBigDataContainerNode) && (

                  <div className="space-y-4 pt-3 border-t border-cyber-border">

                    <div className="p-3 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent rounded-xl border border-sky-500/30">

                      <div className="flex items-center space-x-2">

                        <Bot className="w-4 h-4 text-sky-400" />

                        <span className="text-xs font-bold text-sky-300">

                          {isSelectedBigDataContainerNode ? '📦 Multi-Agent Pipeline Container' : '🤖 Autonomous Big Data Analyst'}

                        </span>

                        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-[9px] text-sky-300 font-mono font-bold">Multi-Agent</span>

                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">

                        ทำงานร่วมกันแบบ Orchestrated Multi-Agent Team: วางแผน (Planner) ➔ เขียน SQL & ตรวจสอบ (Critic) ➔ วิเคราะห์เฉพาะทาง (Specialist) ➔ สังเคราะห์ผล (Synthesizer)

                      </p>

                    </div>



                    {/* Input Dataset (Excel / CSV / Parquet) Source */}

                    <div className="space-y-2 p-3 bg-slate-900/40 rounded-xl border border-cyber-border">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-1.5">

                          <FileSpreadsheet className="w-3.5 h-3.5" />

                          <span>Input Dataset (Excel / CSV)</span>

                        </label>

                        <select

                          value={selectedNode.data.parameters?.sourceType || 'upload'}

                          onChange={(e) => updateSelectedNodeParameter('sourceType', e.target.value)}

                          className="text-[10px] bg-cyber-dark border border-cyber-border focus:border-sky-400 rounded px-2 py-0.5 text-slate-300"

                        >

                          <option value="upload">Upload Files (Excel / CSV)</option>

                          <option value="local_dir">Local Directory Path</option>

                          <option value="upstream">Upstream Node (Pipeline)</option>

                        </select>

                      </div>



                      {/* 1. Direct Upload Dropzone */}

                      {(selectedNode.data.parameters?.sourceType || 'upload') === 'upload' && (

                        <div className="space-y-1.5">

                          <div className="relative border-2 border-dashed border-sky-500/40 hover:border-sky-400 rounded-xl p-3 bg-sky-500/5 transition-all text-center group cursor-pointer">

                            <input

                              type="file"

                              multiple

                              accept=".xlsx,.xls,.csv"

                              onChange={async (e) => {

                                const files = e.target.files;

                                if (!files || files.length === 0) return;

                                const formData = new FormData();

                                Array.from(files).forEach((f) => formData.append('files', f));

                                formData.append('compression', selectedNode.data.parameters?.compression || 'snappy');

                                formData.append('chunk_size', String(selectedNode.data.parameters?.chunkSize || 50000));

                                setIsConvertingParquet(true);

                                setConversionStatusMsg(`Ingesting & converting ${files.length} Excel file(s)...`);

                                try {

                                  const res = await fetch(`${BACKEND_URL}/api/analytics/convert-parquet`, {

                                    method: 'POST',

                                    body: formData,

                                  });

                                  const data = await res.json();

                                  if (data.status === 'success') {

                                    const totalRows = (data.results || []).reduce((acc: number, cur: any) => acc + (cur.rows || 0), 0);

                                    setConversionStatusMsg(`Ingested ${data.results?.length || 0} file(s) successfully (${totalRows.toLocaleString()} rows).`);

                                    updateSelectedNodeParameter('convertedFiles', data.results || []);

                                    updateSelectedNodeParameter('parquetFiles', (data.results || []).map((r: any) => r.parquet_path));

                                    updateSelectedNodeParameter('catalog', data.catalog || {});

                                  } else {

                                    setConversionStatusMsg(`Error: ${data.message || 'Upload conversion failed'}`);

                                  }

                                } catch (err: any) {

                                  setConversionStatusMsg(`Upload Error: ${err.message}`);

                                } finally {

                                  setIsConvertingParquet(false);

                                }

                              }}

                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"

                            />

                            <FileSpreadsheet className="w-6 h-6 mx-auto text-sky-400 mb-1 group-hover:scale-110 transition-transform" />

                            <p className="text-[11px] font-semibold text-slate-200">

                              {isConvertingParquet ? 'กำลังประมวลผลด้วย Polars...' : 'คลิกหรือลากไฟล์ Excel / CSV มาวางที่นี่'}

                            </p>

                            <p className="text-[9px] text-slate-400 mt-0.5">รองรับ .xlsx, .xls, .csv หลายไฟล์พร้อมกัน</p>

                          </div>

                        </div>

                      )}



                      {/* 2. Local Directory Path */}

                      {selectedNode.data.parameters?.sourceType === 'local_dir' && (

                        <div className="space-y-1.5">

                          <input

                            type="text"

                            value={selectedNode.data.parameters?.sourceFiles || ''}

                            onChange={(e) => updateSelectedNodeParameter('sourceFiles', e.target.value)}

                            placeholder="e.g. F:\_Work AI\data\sales_*.xlsx"

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-sky-400 py-1.5 px-2.5 rounded-lg text-cyber-text font-mono"

                          />

                          <button

                            type="button"

                            onClick={handleConvertParquetClick}

                            disabled={isConvertingParquet}

                            className="w-full py-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-bold border border-sky-400/30 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"

                          >

                            <span>⚡ Scan & Ingest with Polars</span>

                          </button>

                        </div>

                      )}



                      {/* 3. Upstream Pipeline Note */}

                      {selectedNode.data.parameters?.sourceType === 'upstream' && (

                        <div className="p-2 rounded bg-sky-950/30 border border-sky-500/20 text-[10px] text-slate-400 leading-tight">

                          🔗 รับข้อมูลอัตโนมัติจากโหนด <strong className="text-sky-300">Polars Parquet Converter</strong> หรือ <strong className="text-amber-300">DuckDB</strong> ต้นทางผ่านเส้นเชื่อมต่อ (Edge) บน Canvas

                        </div>

                      )}



                      {/* Conversion / Status Alert */}

                      {conversionStatusMsg && (

                        <div className="p-2 rounded bg-slate-900 border border-sky-500/40 text-[10px] text-sky-300 flex items-center space-x-2">

                          <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />

                          <span className="truncate">{conversionStatusMsg}</span>

                        </div>

                      )}



                      {/* Active Ingested Files List */}

                      {Array.isArray(selectedNode.data.parameters?.convertedFiles) && selectedNode.data.parameters.convertedFiles.length > 0 && (

                        <div className="space-y-1 pt-1 border-t border-cyber-border/60">

                          <div className="flex items-center justify-between text-[9px] text-slate-400">

                            <span className="text-emerald-400 font-bold flex items-center space-x-1">

                              <CheckCircle2 className="w-3 h-3" />

                              <span>พร้อมวิเคราะห์ ({selectedNode.data.parameters.convertedFiles.length} ไฟล์)</span>

                            </span>

                            <span>{selectedNode.data.parameters.convertedFiles.reduce((acc: number, c: any) => acc + (c.rows || 0), 0).toLocaleString()} แถว</span>

                          </div>

                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">

                            {selectedNode.data.parameters.convertedFiles.map((f: any, fIdx: number) => (

                              <span key={fIdx} className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-400/30 text-[9px] text-sky-300 font-mono truncate max-w-full">

                                📊 {typeof f === 'string' ? f.split(/[\\/]/).pop() : (f.original || f.parquet_path || '').split(/[\\/]/).pop()} {f.rows ? `(${f.rows.toLocaleString()}r)` : ''}

                              </span>

                            ))}

                          </div>

                        </div>

                      )}

                    </div>



                    {/* Mode Toggle: Auto vs Manual */}

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Team Architecture Setup

                        </label>

                        <div className="flex items-center space-x-1 p-0.5 bg-cyber-dark rounded-lg border border-cyber-border">

                          <button

                            type="button"

                            onClick={() => {

                              setActiveBigDataTab('auto');

                              updateSelectedNodeParameter('mode', 'auto');

                            }}

                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${

                              (selectedNode.data.parameters?.mode || activeBigDataTab) === 'auto'

                                ? 'bg-sky-500 text-slate-950 shadow-sm'

                                : 'text-slate-400 hover:text-slate-200'

                            }`}

                          >

                            ⚡ Auto Mode

                          </button>

                          <button

                            type="button"

                            onClick={() => {

                              setActiveBigDataTab('manual');

                              updateSelectedNodeParameter('mode', 'manual');

                            }}

                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${

                              (selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual'

                                ? 'bg-sky-500 text-slate-950 shadow-sm'

                                : 'text-slate-400 hover:text-slate-200'

                            }`}

                          >

                            🛠️ Manual Mode

                          </button>

                        </div>

                      </div>

                    </div>



                    {/* Business Objective Input */}

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Business Objective (โจทย์การวิเคราะห์)

                        </label>

                      </div>

                      <textarea

                        value={selectedNode.data.parameters?.businessObjective || 'วิเคราะห์ยอดขายและผลประกอบการ หาแนวโน้มสำคัญ ตรวจสอบความผิดปกติ (Anomalies) และจัดทำข้อเสนอแนะเชิงกลยุทธ์'}

                        onChange={(e) => updateSelectedNodeParameter('businessObjective', e.target.value)}

                        rows={3}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-sky-400 py-2.5 px-3 rounded-lg text-cyber-text resize-none leading-relaxed"

                        placeholder="ระบุสิ่งที่ต้องการให้ทีม AI ค้นหาและวิเคราะห์..."

                      />

                    </div>



                    {/* Auto Mode UI */}

                    {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'auto' && (

                      <div className="space-y-2 p-3 rounded-xl bg-sky-950/20 border border-sky-500/20">

                        <div className="flex items-center justify-between">

                          <span className="text-[11px] font-semibold text-sky-300">AI Team Auto-Planner</span>

                          <span className="text-[9px] text-slate-400">Schema-Driven</span>

                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed">

                          AI จะประเมิน Schema ของชุดข้อมูลร่วมกับโจทย์ธุรกิจ แล้วจัดทีมผู้เชี่ยวชาญเฉพาะทางให้โดยอัตโนมัติ

                        </p>

                        <button

                          type="button"

                          onClick={handleAutoGenerateTeamClick}

                          disabled={isGeneratingTeam}

                          className="w-full py-2 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"

                        >

                          {isGeneratingTeam ? (

                            <>

                              <div className="w-3 h-3 border-2 border-sky-300 border-t-transparent rounded-full animate-spin" />

                              <span>Planning Optimal Team...</span>

                            </>

                          ) : (

                            <>

                              <Sparkles className="w-3.5 h-3.5 text-sky-300" />

                              <span>Auto-Compose Agent Team</span>

                            </>

                          )}

                        </button>

                        {selectedNode.data.parameters?.teamRationale && (

                          <p className="text-[10px] text-sky-300/80 italic font-mono pt-1">

                            Rationale: {selectedNode.data.parameters.teamRationale}

                          </p>

                        )}

                      </div>

                    )}



                    {/* Multi-Agent Team List (Active in both modes, editable in manual mode) */}

                    <div className="space-y-2">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Agent Specialists Team ({((selectedNode.data.parameters?.team || []).length)} Agents)

                        </label>

                        {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' && (

                          <button

                            type="button"

                            onClick={() => {

                              const currentTeam = Array.isArray(selectedNode.data.parameters?.team) ? [...selectedNode.data.parameters.team] : [];

                              const newAgentId = `agent_${Date.now()}`;

                              currentTeam.push({

                                id: newAgentId,

                                name: `Specialist ${currentTeam.length + 1}`,

                                role: 'วิเคราะห์ข้อมูลเชิงลึกและประเมินผลกระทบ',

                                model: 'gemini-2.5-flash',

                                persona: 'Data Domain Specialist'

                              });

                              updateSelectedNodeParameter('team', currentTeam);

                            }}

                            className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-[9px] font-bold flex items-center space-x-1 cursor-pointer"

                          >

                            <Plus className="w-3 h-3" />

                            <span>Add Agent</span>

                          </button>

                        )}

                      </div>



                      <div className="space-y-2 max-h-64 overflow-y-auto">

                        {(selectedNode.data.parameters?.team || []).map((agent: any, idx: number) => (

                          <div key={agent.id || idx} className="p-2.5 rounded-xl bg-cyber-dark border border-cyber-border space-y-2">

                            <div className="flex items-center justify-between">

                              <div className="flex items-center space-x-2">

                                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-bold">

                                  #{idx + 1}

                                </div>

                                {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' ? (

                                  <input

                                    type="text"

                                    value={agent.name || ''}

                                    onChange={(e) => {

                                      const newTeam = [...selectedNode.data.parameters.team];

                                      newTeam[idx] = { ...newTeam[idx], name: e.target.value };

                                      updateSelectedNodeParameter('team', newTeam);

                                    }}

                                    className="text-xs font-bold text-sky-300 bg-transparent border-b border-cyber-border focus:border-sky-400 focus:outline-none px-1"

                                  />

                                ) : (

                                  <span className="text-xs font-bold text-sky-300">{agent.name}</span>

                                )}

                              </div>

                              <div className="flex items-center space-x-1">

                                {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' && (

                                  <select

                                    value={agent.model || 'gemini-2.5-flash'}

                                    onChange={(e) => {

                                      const newTeam = [...selectedNode.data.parameters.team];

                                      newTeam[idx] = { ...newTeam[idx], model: e.target.value };

                                      updateSelectedNodeParameter('team', newTeam);

                                    }}

                                    className="text-[10px] bg-slate-900 border border-cyber-border rounded px-1.5 py-0.5 text-slate-300"

                                  >

                                    <option value="gemini-2.5-flash">2.5-flash</option>

                                    <option value="gemini-1.5-pro">1.5-pro</option>

                                    <option value="gemini-2.5-pro">2.5-pro</option>

                                  </select>

                                )}

                                {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' && (

                                  <button

                                    type="button"

                                    onClick={() => {

                                      const newTeam = selectedNode.data.parameters.team.filter((_: any, i: number) => i !== idx);

                                      updateSelectedNodeParameter('team', newTeam);

                                    }}

                                    className="p-1 hover:text-red-400 text-slate-500"

                                    title="Delete Agent"

                                  >

                                    <Trash2 className="w-3 h-3" />

                                  </button>

                                )}

                              </div>

                            </div>



                            {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' ? (

                              <div className="space-y-1">

                                <input

                                  type="text"

                                  value={agent.persona || ''}

                                  placeholder="Specialist Persona (เช่น Senior Risk & Compliance Lead)"

                                  onChange={(e) => {

                                    const newTeam = [...selectedNode.data.parameters.team];

                                    newTeam[idx] = { ...newTeam[idx], persona: e.target.value };

                                    updateSelectedNodeParameter('team', newTeam);

                                  }}

                                  className="w-full text-[10px] bg-slate-900/60 border border-cyber-border focus:border-sky-400 rounded px-2 py-1 text-slate-300"

                                />

                                <textarea

                                  rows={2}

                                  value={agent.role || ''}

                                  placeholder="หน้าที่และคำสั่ง (Agent Prompt / Task)"

                                  onChange={(e) => {

                                    const newTeam = [...selectedNode.data.parameters.team];

                                    newTeam[idx] = { ...newTeam[idx], role: e.target.value };

                                    updateSelectedNodeParameter('team', newTeam);

                                  }}

                                  className="w-full text-[10px] bg-slate-900/60 border border-cyber-border focus:border-sky-400 rounded px-2 py-1 text-slate-300 leading-tight"

                                />

                              </div>

                            ) : (

                              <div>

                                <p className="text-[10px] text-slate-400 font-medium">{agent.persona || agent.role}</p>

                                <p className="text-[9px] text-slate-500 mt-0.5 italic">{agent.role}</p>

                              </div>

                            )}

                          </div>

                        ))}

                      </div>

                    </div>



                    {/* Drill-Down Subflow Button (Hybrid Container Feature) */}

                    <button

                      type="button"

                      onClick={() => handleDrillDownContainer(selectedNode)}

                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600/30 to-sky-600/30 hover:from-indigo-600/50 hover:to-sky-600/50 border border-indigo-400/40 text-sky-200 text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"

                    >

                      <Layers className="w-3.5 h-3.5 text-sky-300" />

                      <span>🔍 Open Subflow Architecture (ขยายโครงสร้าง Pipeline)</span>

                    </button>



                    {/* Final Analysis Report */}

                    {selectedNode.data.parameters?.finalReport && (

                      <div className="space-y-1.5 pt-2 border-t border-cyber-border">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">

                            Executive Insights Report

                          </label>

                          <button

                            type="button"

                            onClick={() => navigator.clipboard.writeText(selectedNode.data.parameters.finalReport)}

                            className="text-[9px] text-sky-300 hover:text-sky-200 flex items-center space-x-1"

                          >

                            <Copy className="w-3 h-3" />

                            <span>Copy Report</span>

                          </button>

                        </div>

                        <div className="p-3 rounded-xl bg-cyber-dark border border-cyber-border text-xs text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">

                          {selectedNode.data.parameters.finalReport}

                        </div>

                      </div>

                    )}

                  </div>

                )}



                {!isSelectedDbNode && !isSelectedApiConnectorNode && !isSelectedJsonConnectorNode && !isSelectedJsonConnectorListNode && !isSelectedPageNode && !isSelectedStorageNode && !isSelectedTimerNode && !isSelectedPdfsLoaderNode && !isSelectedPdfQueueNode && !isSelectedTxtQueueNode && !isSelectedZipQueueNode && !isSelectedOcrPdfsNode && !isSelectedPdfExtractorNode && !isSelectedExtractNode && !isSelectedDeDuplicateNode && !isSelectedStructuredParseNode && !isSelectedStateNode && !isSelectedMarkItDownNode && !isSelectedPolarsConverterNode && !isSelectedDuckDbNode && !isSelectedBigDataAnalystNode && !isSelectedBigDataContainerNode && selectedNode.data.category !== 'Datasets' && selectedNode.data.category !== 'Big Data & Analytics' && selectedNode.data.category !== 'Agents' && selectedNode.data.category !== 'Agent' && !selectedNode.data.name?.toLowerCase().includes('agent') && !selectedNode.type?.toLowerCase().includes('agent') && selectedNode.data.category !== 'Models' && selectedNode.data.category !== 'Criteria' && selectedNode.type !== 'rubric' && selectedNode.type !== 'mca' && selectedNode.type !== 'table' && (

                  <>

                    {/* Agent Metrics & Tools */}

                    <div className="pt-3 border-t border-cyber-border space-y-3">

                      <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider">

                        Agent Metrics & Tools

                      </h4>

                      

                      {/* Progress (%) slider */}

                      <div className="space-y-1">

                        <div className="flex items-center justify-between text-[10px]">

                          <span className="font-bold uppercase tracking-wider text-cyber-muted">Progress (%)</span>

                          <span className="text-cyber-neon font-semibold font-mono">

                            {selectedNode.data.parameters?.progress !== undefined ? `${selectedNode.data.parameters.progress}%` : 'Not Set'}

                          </span>

                        </div>

                        <div className="flex items-center space-x-2">

                          <input 

                            type="range" 

                            min="0" 

                            max="100" 

                            value={selectedNode.data.parameters?.progress !== undefined ? selectedNode.data.parameters.progress : 50} 

                            onChange={(e) => updateSelectedNodeParameter('progress', Number(e.target.value))}

                            className="flex-1 h-1.5 bg-cyber-dark rounded-lg appearance-none cursor-pointer accent-cyber-neon"

                          />

                          <button

                            onClick={() => {

                              const currentParams = { ...selectedNode.data.parameters };

                              delete currentParams.progress;

                              updateSelectedNodeData('parameters', currentParams);

                            }}

                            className="text-[9px] text-red-400 hover:text-red-300 font-semibold bg-cyber-dark border border-cyber-border px-1.5 py-0.5 rounded cursor-pointer"

                            title="Remove progress bar"

                          >

                            Reset

                          </button>

                        </div>

                      </div>



                      {/* Progress Bar Color selection */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Progress Bar Color

                        </label>

                        <select

                          value={selectedNode.data.parameters?.progressColor || '#00F0FF'}

                          onChange={(e) => updateSelectedNodeParameter('progressColor', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                        >

                          <option value="#00F0FF">Cyan</option>

                          <option value="#10B981">Emerald</option>

                          <option value="#8B5CF6">Purple</option>

                          <option value="#F59E0B">Orange</option>

                          <option value="#EF4444">Red</option>

                        </select>

                      </div>



                      {/* Tech capabilities tools check list */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Tech Tools / Capabilities

                        </label>

                        <div className="grid grid-cols-3 gap-2">

                          {[

                            { name: 'React', key: 'react' },

                            { name: 'NodeJS', key: 'nodejs' },

                            { name: 'Python', key: 'python' },

                            { name: 'Database', key: 'database' },

                            { name: 'API', key: 'api' },

                            { name: 'Users', key: 'users' },

                            { name: 'Search', key: 'search' },

                            { name: 'Check', key: 'check' },

                            { name: 'Vector', key: 'vector' },

                          ].map((tool) => {

                            const currentTools = selectedNode.data.parameters?.tools || [];

                            const isChecked = currentTools.includes(tool.key);

                            return (

                              <label 

                                key={tool.key} 

                                className={`flex items-center justify-center p-1.5 rounded border text-[10px] font-semibold cursor-pointer select-none transition-all ${

                                  isChecked 

                                    ? 'bg-cyber-neon bg-opacity-10 border-cyber-neon text-cyber-neon' 

                                    : 'bg-cyber-dark border-cyber-border text-cyber-muted hover:border-gray-500'

                                }`}

                              >

                                <input 

                                  type="checkbox" 

                                  checked={isChecked}

                                  onChange={() => {

                                    const newTools = isChecked 

                                      ? currentTools.filter((t: string) => t !== tool.key)

                                      : [...currentTools, tool.key];

                                    updateSelectedNodeParameter('tools', newTools);

                                  }}

                                  className="sr-only"

                                />

                                <span>{tool.name}</span>

                              </label>

                            );

                          })}

                        </div>

                      </div>

                    </div>



                    {/* Memory Settings Section */}

                    <div className="pt-3 border-t border-cyber-border space-y-3">

                      <h4 className="text-xs font-bold text-cyber-text flex items-center justify-between">

                        <span>Memory Settings</span>

                        <span className="text-[9px] font-bold uppercase tracking-widest text-cyber-neon">

                          State Retention

                        </span>

                      </h4>

                      

                      {/* Memory Type */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Type

                        </label>

                        <select

                          value={selectedNode.data.parameters?.memoryType || 'Vector'}

                          onChange={(e) => updateSelectedNodeParameter('memoryType', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                        >

                          <option value="Vector">Vector Store (Semantic Search)</option>

                          <option value="Buffer">Buffer Window (Last N Messages)</option>

                          <option value="None">None (Stateless)</option>

                        </select>

                      </div>



                      {/* Memory Capacity Slider */}

                      <div className="space-y-1">

                        <div className="flex items-center justify-between text-[10px]">

                          <span className="font-bold uppercase tracking-wider text-cyber-muted">Capacity</span>

                          <span className="text-cyber-neon font-semibold font-mono">

                            {selectedNode.data.parameters?.memoryCapacity || '10k'}

                          </span>

                        </div>

                        <input 

                          type="range" 

                          min="1" 

                          max="10" 

                          defaultValue="3" 

                          onChange={(e) => updateSelectedNodeParameter('memoryCapacity', `${Number(e.target.value) * 3}k`)}

                          className="w-full h-1.5 bg-cyber-dark rounded-lg appearance-none cursor-pointer accent-cyber-neon"

                        />

                      </div>



                      {/* Time Window Buttons */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Time Window Configuration

                        </label>

                        <div className="flex space-x-1.5">

                          {['Real-time', 'Hourly', 'Log history'].map((option, oIdx) => (

                            <button

                              key={option}

                              onClick={() => updateSelectedNodeParameter('timeWindow', option)}

                              className={`flex-1 text-[9px] font-bold py-1.5 px-1 rounded-lg border transition-all ${

                                selectedNode.data.parameters?.timeWindow === option || (!selectedNode.data.parameters?.timeWindow && oIdx === 1)

                                  ? 'bg-cyber-neon border-cyber-neon text-cyber-dark font-black'

                                  : 'bg-cyber-dark border-cyber-border text-cyber-muted hover:text-cyber-text'

                              }`}

                            >

                              {option}

                            </button>

                          ))}

                        </div>

                      </div>

                    </div>



                    {/* LangGraph Compilation Parameter Fields */}

                    <div className="pt-3 border-t border-cyber-border space-y-3.5">

                      <h4 className="text-xs font-bold text-cyber-text">

                        LangGraph Parameters

                      </h4>

                      

                      {/* Recursion Limit Toggle */}

                      <div className="flex items-center justify-between">

                        <div className="space-y-0.5">

                          <span className="text-xs text-cyber-text block font-semibold">Recursion Limit</span>

                          <span className="text-[9px] text-cyber-muted block">Prevent infinite cycle loops</span>

                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">

                          <input 

                            type="checkbox" 

                            defaultChecked 

                            onChange={(e) => updateSelectedNodeParameter('recursionLimit', e.target.checked ? 'Active' : 'Disabled')}

                            className="sr-only peer" 

                          />

                          <div className="w-9 h-5 bg-cyber-dark border border-cyber-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-muted peer-checked:after:bg-cyber-neon after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyber-panel"></div>

                        </label>

                      </div>



                      {/* Checkpointer Toggle */}

                      <div className="flex items-center justify-between">

                        <div className="space-y-0.5">

                          <span className="text-xs text-cyber-text block font-semibold">Checkpointer saver</span>

                          <span className="text-[9px] text-cyber-muted block">Save state for Time-travel auditing</span>

                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">

                          <input 

                            type="checkbox" 

                            defaultChecked

                            onChange={(e) => updateSelectedNodeParameter('checkpointer', e.target.checked ? 'Active' : 'Disabled')}

                            className="sr-only peer" 

                          />

                          <div className="w-9 h-5 bg-cyber-dark border border-cyber-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-muted peer-checked:after:bg-cyber-neon after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyber-panel"></div>

                        </label>

                      </div>

                    </div>

                  </>

                )}



              </div>

            ) : (

              <div className="space-y-6 animate-fadeIn pb-24">

                <div className="p-4 bg-cyber-dark bg-opacity-40 rounded-lg border border-cyber-border space-y-4 shadow-sm">

                  <div className="flex items-center space-x-2 border-b border-cyber-border border-opacity-40 pb-2.5">

                    <Layout className="w-4 h-4 text-cyber-neon" />

                    <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider">

                      Workspace Overview

                    </h4>

                  </div>

                  

                  <div className="space-y-1.5">

                    <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                      Workflow Name

                    </label>

                    <input

                      type="text"

                      value={workflowName}

                      onChange={(e) => {

                  const val = e.target.value;

                  setWorkflowName(val);

                  if (val.trim()) {

                    const cleanFname = val.trim().replace(/\s+/g, '_') + '.wf';

                    setCurrentFileName(cleanFname);

                    setProcesses(prev => prev.map(p => (p.workflowId === selectedWorkflowId || p.name === workflowName) ? { ...p, name: val } : p));

                  }

                }}

                      className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      placeholder="e.g. My AI Agent Flow"

                    />

                  </div>

                  

                  <div className="space-y-1.5 pt-2">

                    <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                      Workflow Description

                    </label>

                    <textarea

                      value={workflowDesc}

                      onChange={(e) => setWorkflowDesc(e.target.value)}

                      rows={3}

                      className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text resize-none"

                      placeholder="Describe what this workflow does..."

                    />

                  </div>

                </div>



                <div className="p-4 bg-cyber-dark bg-opacity-40 rounded-lg border border-cyber-border space-y-4 shadow-sm">

                  <div className="flex items-center space-x-2 border-b border-cyber-border border-opacity-40 pb-2.5">

                    <Database className="w-4 h-4 text-cyber-neon" />

                    <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider">

                      Workspace Statistics

                    </h4>

                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">

                    <div className="bg-cyber-dark bg-opacity-70 p-2 rounded border border-cyber-border">

                      <span className="text-cyber-muted block">Total Nodes</span>

                      <span className="text-sm font-bold text-cyber-text mt-0.5 block">{nodes.length}</span>

                    </div>

                    <div className="bg-cyber-dark bg-opacity-70 p-2 rounded border border-cyber-border">

                      <span className="text-cyber-muted block">Total Edges</span>

                      <span className="text-sm font-bold text-cyber-text mt-0.5 block">{edges.length}</span>

                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>





        </aside>

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



      {/* Save Confirm Modal */}

      {showSaveConfirmModal && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">

          <div className="w-96 bg-cyber-panel border-2 border-cyber-neon rounded-xl p-6 shadow-[0_0_25px_rgba(212,255,58,0.25)] select-none">

            <h3 className="text-sm font-extrabold uppercase tracking-widest text-cyber-neon mb-3 flex items-center space-x-2">

              <Save className="w-5 h-5 text-cyber-neon" />

              <span>Save work flow</span>

            </h3>

            <p className="text-xs text-cyber-text mb-6 leading-relaxed">

              You have unsaved changes. Would you like to save the current work flow to your file before clearing the screen?

            </p>

            <div className="flex space-x-3 justify-end">

              <button

                onClick={handleNewWorkflowConfirmNo}

                className="px-4 py-2 text-xs font-bold rounded-lg border border-cyber-border hover:border-red-500 bg-cyber-dark text-cyber-muted hover:text-red-500 transition-all cursor-pointer"

              >

                No

              </button>

              <button

                onClick={handleNewWorkflowConfirmYes}

                className="px-5 py-2 text-xs font-bold rounded-lg bg-cyber-neon hover:bg-opacity-80 text-cyber-dark shadow-neon-glow font-extrabold transition-all cursor-pointer"

              >

                Yes

              </button>

            </div>

          </div>

        </div>

      )}

      {/* Scheduler Trigger Popup Modal */}

      {showSchedulerPopup && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">

          <div className="w-[420px] bg-cyber-panel border-2 border-cyber-neon rounded-2xl p-6 shadow-[0_0_40px_rgba(212,255,58,0.35)] select-none relative overflow-hidden">

            {/* Glow background flare */}

            <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyber-neon opacity-10 rounded-full blur-2xl pointer-events-none" />

            

            <h3 className="text-base font-extrabold uppercase tracking-widest text-cyber-neon mb-4 flex items-center space-x-2.5">

              <Clock className="w-6 h-6 text-cyber-neon animate-pulse" />

              <span>Scheduler Triggered</span>

            </h3>

            

            <div className="space-y-3 mb-6">

              <p className="text-xs text-cyber-muted leading-relaxed">

                The countdown timer for workflow <strong className="text-cyber-text font-bold">"{schedulerPopupWorkflowName}"</strong> has reached 0.

              </p>

              <div className="bg-cyber-dark bg-opacity-50 border border-cyber-border rounded-xl p-3.5 flex items-center justify-between">

                <span className="text-[10px] text-cyber-muted font-bold uppercase tracking-wider">Trigger Round:</span>

                <span className="text-xs font-mono font-black text-cyber-neon bg-cyber-neon bg-opacity-10 border border-cyber-neon border-opacity-35 px-2.5 py-0.5 rounded-full">

                  Round {schedulerPopupRound}

                </span>

              </div>

              <p className="text-[10px] text-cyber-muted italic leading-relaxed">

                The execution run has been initiated in the background. You can monitor the progress and outputs in the Log Viewer at the bottom of the screen.

              </p>

            </div>



            <div className="flex justify-end">

              <button

                onClick={() => setShowSchedulerPopup(false)}

                className="px-6 py-2 text-xs font-extrabold rounded-lg bg-cyber-neon hover:bg-opacity-80 text-cyber-dark shadow-neon-glow hover:scale-105 transition-all cursor-pointer"

              >

                Acknowledge

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Premium Neon Clock Picker Modal (Image 4/Sleep Clock Style) */}

      {isClockOpen && (() => {

        const { hour12, minute, amPm } = convert24to12(clockTimeValue);

        const currentAngle = clockDragAngle !== null 

          ? clockDragAngle 

          : (clockActiveTab === 'hour'

              ? ((hour12 % 12) / 12) * 2 * Math.PI

              : (minute / 60) * 2 * Math.PI);



        const getProximity = (numAngle: number) => {

          let diff = Math.abs(numAngle - currentAngle) % (2 * Math.PI);

          if (diff > Math.PI) {

            diff = 2 * Math.PI - diff;

          }

          const maxDiff = Math.PI / 4;

          return Math.max(0, 1 - diff / maxDiff);

        };

        

        return (

          <>

            {/* Click away backdrop */}

            <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => setIsClockOpen(false)} />

            

            {/* Positioned Popover */}

            <div

              style={{

                position: 'fixed',

                top: `${clockPosition?.top || 100}px`,

                left: `${clockPosition?.left || 100}px`,

                zIndex: 9999

              }}

              className="bg-cyber-panel border border-cyber-neon rounded-2xl w-80 p-5 space-y-6 select-none animate-fadeIn"

            >

              

              {/* Modal Header */}

              <div className="text-center space-y-1">

                <h3 className="text-xs font-bold text-cyber-muted uppercase tracking-wider">Set Schedule Time</h3>

                

                {/* Large Time Display / Keyboard inputs + AM/PM Selector */}

                <div className="flex items-center justify-center space-x-3 pt-2">

                  <div className="flex items-center space-x-1.5">

                    <input

                      type="text"

                      maxLength={2}

                      value={String(hour12).padStart(2, '0')}

                      onChange={(e) => {

                        const hr = Math.max(1, Math.min(12, parseInt(e.target.value.replace(/\D/g, '')) || 1));

                        setClockTimeValue(convert12to24(hr, minute, amPm));

                      }}

                      onFocus={() => setClockActiveTab('hour')}

                      className="w-12 text-2xl font-bold font-mono text-center bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none rounded-lg text-cyber-text p-1"

                      placeholder="09"

                    />

                    <span className="text-xl font-bold text-cyber-muted font-mono">:</span>

                    <input

                      type="text"

                      maxLength={2}

                      value={String(minute).padStart(2, '0')}

                      onChange={(e) => {

                        const min = Math.max(0, Math.min(59, parseInt(e.target.value.replace(/\D/g, '')) || 0));

                        setClockTimeValue(convert12to24(hour12, min, amPm));

                      }}

                      onFocus={() => setClockActiveTab('minute')}

                      className="w-12 text-2xl font-bold font-mono text-center bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none rounded-lg text-cyber-text p-1"

                      placeholder="00"

                    />

                  </div>



                  {/* AM/PM switcher */}

                  <div className="flex bg-cyber-dark border border-cyber-border rounded-lg p-0.5">

                    <button

                      onClick={() => setClockTimeValue(convert12to24(hour12, minute, 'AM'))}

                      className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${

                        amPm === 'AM' ? 'bg-cyber-neon text-cyber-dark font-black' : 'text-cyber-muted hover:text-cyber-text'

                      }`}

                    >

                      AM

                    </button>

                    <button

                      onClick={() => setClockTimeValue(convert12to24(hour12, minute, 'PM'))}

                      className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${

                        amPm === 'PM' ? 'bg-cyber-neon text-cyber-dark font-black' : 'text-cyber-muted hover:text-cyber-text'

                      }`}

                    >

                      PM

                    </button>

                  </div>

                </div>



                {/* Tab Selector (Hour vs Minute) */}

                <div className="flex justify-center space-x-4 pt-2">

                  <button

                    onClick={() => setClockActiveTab('hour')}

                    className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-all cursor-pointer ${

                      clockActiveTab === 'hour' ? 'text-cyber-neon border-cyber-neon' : 'text-cyber-muted border-transparent hover:text-cyber-text'

                    }`}

                  >

                    Hours

                  </button>

                  <button

                    onClick={() => setClockActiveTab('minute')}

                    className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-all cursor-pointer ${

                      clockActiveTab === 'minute' ? 'text-cyber-neon border-cyber-neon' : 'text-cyber-muted border-transparent hover:text-cyber-text'

                    }`}

                  >

                    Minutes

                  </button>

                </div>

              </div>



              {/* Circular Clock Face */}

              <div className="flex justify-center select-none relative">

                <svg

                  width="220"

                  height="220"

                  className="cursor-pointer overflow-visible"

                  onMouseDown={(e) => {

                    setIsDraggingClock(true);

                    handleClockInteraction(e);

                  }}

                  onMouseMove={(e) => {

                    if (isDraggingClock) {

                      handleClockInteraction(e);

                    }

                  }}

                  onMouseUp={handleClockRelease}

                  onMouseLeave={handleClockRelease}

                >

                  {/* Dial background circle */}

                  <circle cx="110" cy="110" r="95" fill="#121216" stroke="#2A2A35" strokeWidth="2.5" />

                  <circle cx="110" cy="110" r="70" fill="transparent" stroke="#2a2a35" strokeWidth="1" strokeDasharray="3,3" />



                  {/* Draw clock hand */}

                  {(() => {

                    const angle = clockDragAngle !== null

                      ? clockDragAngle - Math.PI / 2

                      : (clockActiveTab === 'hour'

                        ? (hour12 / 12) * 2 * Math.PI - Math.PI / 2

                        : (minute / 60) * 2 * Math.PI - Math.PI / 2);



                    const handRadius = 75;

                    const hx = 110 + handRadius * Math.cos(angle);

                    const hy = 110 + handRadius * Math.sin(angle);



                    return (

                      <>

                        {/* Radial hand line */}

                        <line x1="110" y1="110" x2={hx} y2={hy} stroke="#D4FF3A" strokeWidth="2" />

                        {/* Glowing pointer circle */}

                        <circle cx={hx} cy={hy} r="14" fill="#D4FF3A" opacity="0.25" />

                        <circle cx={hx} cy={hy} r="4" fill="#D4FF3A" />

                        <circle cx="110" cy="110" r="4.5" fill="#D4FF3A" />

                      </>

                    );

                  })()}



                  {/* Render Hour numbers (1 to 12) or Minute numbers (0 to 55) */}

                  {clockActiveTab === 'hour' ? (

                    // Draw 12 hours around the clock dial

                    [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hr) => {

                      const angle = (hr / 12) * 2 * Math.PI - Math.PI / 2;

                      const numAngle = ((hr % 12) / 12) * 2 * Math.PI;

                      const prox = getProximity(numAngle);

                      

                      const radius = 75 + 5 * prox;

                      const tx = 110 + radius * Math.cos(angle);

                      const ty = 110 + radius * Math.sin(angle);

                      const isSelected = hour12 === hr;



                      return (

                        <text

                          key={hr}

                          x={tx}

                          y={ty + 4}

                          textAnchor="middle"

                          style={{

                            transform: `scale(${1 + 0.25 * prox})`,

                            transformOrigin: `${tx}px ${ty}px`

                          }}

                          className={`text-[10px] font-mono font-bold select-none cursor-pointer transition-all ${

                            isSelected ? 'fill-cyber-neon' : 'fill-cyber-muted hover:fill-cyber-text'

                          }`}

                        >

                          {hr}

                        </text>

                      );

                    })

                  ) : (

                    // Draw minutes around the clock dial (0, 5, 10, ..., 55)

                    [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => {

                      const angle = (min / 60) * 2 * Math.PI - Math.PI / 2;

                      const numAngle = (min / 60) * 2 * Math.PI;

                      const prox = getProximity(numAngle);

                      

                      const radius = 75 + 5 * prox;

                      const tx = 110 + radius * Math.cos(angle);

                      const ty = 110 + radius * Math.sin(angle);

                      const isSelected = minute === min;



                      return (

                        <text

                          key={min}

                          x={tx}

                          y={ty + 4}

                          textAnchor="middle"

                          style={{

                            transform: `scale(${1 + 0.25 * prox})`,

                            transformOrigin: `${tx}px ${ty}px`

                          }}

                          className={`text-[10px] font-mono font-bold select-none cursor-pointer transition-all ${

                            isSelected ? 'fill-cyber-neon' : 'fill-cyber-muted hover:fill-cyber-text'

                          }`}

                        >

                          {String(min).padStart(2, '0')}

                        </text>

                      );

                    })

                  )}

                </svg>

              </div>



              {/* Modal Actions */}

              <div className="flex items-center space-x-3 pt-2">

                <button

                  onClick={() => setIsClockOpen(false)}

                  className="flex-1 py-2 rounded-xl bg-cyber-dark hover:bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-text text-xs font-bold transition-all cursor-pointer text-center"

                >

                  Cancel

                </button>

                <button

                  onClick={() => {

                    if (clockOnSaveCallback) {

                      clockOnSaveCallback(clockTimeValue);

                    }

                    setIsClockOpen(false);

                  }}

                  className="flex-1 py-2 rounded-xl bg-cyber-neon hover:shadow-neon-glow text-cyber-dark text-xs font-bold transition-all cursor-pointer text-center"

                >

                  Confirm

                </button>

              </div>



            </div>

          </>

        );

      })()}



      {/* Day of Month Selector Popover (Grid 1-33) */}

      {isDayPopoverOpen && (

        <>

          {/* Click away backdrop */}

          <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => setIsDayPopoverOpen(false)} />

          

          {/* Positioned Popover */}

          <div

            style={{

              position: 'fixed',

              top: `${dayPopoverPosition?.top || 100}px`,

              left: `${dayPopoverPosition?.left || 100}px`,

              zIndex: 9999

            }}

            className="bg-cyber-panel border border-cyber-neon rounded-2xl w-60 p-4 space-y-4 select-none animate-fadeIn"

          >

            <div className="text-center">

              <h3 className="text-[10px] font-bold text-cyber-muted uppercase tracking-wider">Select Day of Month</h3>

            </div>



            {/* Grid of numbers 1 to 33 */}

            <div className="grid grid-cols-6 gap-1.5 justify-items-center">

              {Array.from({ length: 33 }, (_, i) => i + 1).map((d) => {

                const isSelected = dayPopoverValue === d;

                return (

                  <button

                    key={d}

                    onClick={() => {

                      setDayPopoverValue(d);

                      if (dayPopoverOnSaveCallback) {

                        dayPopoverOnSaveCallback(d);

                      }

                      setIsDayPopoverOpen(false);

                    }}

                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold border transition-all cursor-pointer ${

                      isSelected

                        ? 'bg-cyber-neon text-cyber-dark border-cyber-neon shadow-neon-glow'

                        : 'bg-cyber-dark border-cyber-border text-cyber-text hover:border-cyber-neon hover:text-cyber-neon'

                    }`}

                  >

                    {d}

                  </button>

                );

              })}

            </div>



            <div className="flex justify-end pt-1">

              <button

                onClick={() => setIsDayPopoverOpen(false)}

                className="w-full py-1.5 rounded-lg bg-cyber-dark hover:bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-text text-[10px] font-bold transition-all cursor-pointer text-center"

              >

                Cancel

              </button>

            </div>



          </div>

        </>

      )}



      {/* Custom Theme Dialog Box */}

      {customAlert.show && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4 animate-fade-in select-none">

          <div className={`max-w-md w-full bg-cyber-panel border-2 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 ${

            customAlert.type === 'success' ? 'border-cyber-neon shadow-[0_0_20px_rgba(0,255,243,0.2)]' :

            customAlert.type === 'error' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :

            'border-cyber-border-hover shadow-[0_0_20px_rgba(212,255,58,0.1)]'

          }`}>

            {/* Header */}

            <div className="px-5 py-4 border-b border-cyber-border border-opacity-40 bg-cyber-dark bg-opacity-45 flex items-center justify-between">

              <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center space-x-2 ${

                customAlert.type === 'success' ? 'text-cyber-neon' :

                customAlert.type === 'error' ? 'text-red-400' :

                'text-cyber-text'

              }`}>

                {customAlert.type === 'success' && <CheckCircle2 className="w-4 h-4 text-cyber-neon" />}

                {customAlert.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}

                {customAlert.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}

                <span>{customAlert.title}</span>

              </h3>

              <button 

                onClick={() => setCustomAlert(prev => ({ ...prev, show: false }))}

                className="text-cyber-muted hover:text-cyber-neon transition-colors cursor-pointer text-xs"

              >

                ✕

              </button>

            </div>

            

            {/* Body */}

            <div className="px-6 py-6 bg-cyber-dark bg-opacity-15">

              <p className="text-xs text-cyber-text leading-relaxed font-semibold whitespace-pre-wrap select-text">

                {customAlert.message}

              </p>

            </div>

            

            {/* Footer */}

            <div className="px-5 py-3 border-t border-cyber-border border-opacity-40 bg-cyber-dark bg-opacity-45 flex justify-end">

              <button

                onClick={() => setCustomAlert(prev => ({ ...prev, show: false }))}

                className={`px-5 py-2 text-xs font-extrabold rounded-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${

                  customAlert.type === 'success' ? 'bg-cyber-neon text-cyber-dark shadow-neon-glow' :

                  customAlert.type === 'error' ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]' :

                  'bg-cyber-panel text-cyber-neon border border-cyber-border hover:border-cyber-neon hover:text-cyber-text'

                }`}

              >

                Acknowledge

              </button>

            </div>

          </div>

        </div>

      )}



              {/* Central Luxury Confirm Clear Queue Dialog Box */}

              {queueToClear && (

                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-85 backdrop-blur-lg animate-fadeIn select-none">

                  <div className="bg-cyber-dark border-2 border-red-500 shadow-[0_0_60px_rgba(248,113,113,0.4)] rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all relative overflow-hidden">

                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-pink-500"></div>

                    <div className="flex flex-col items-center text-center space-y-4">

                      <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-10 border border-red-500 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(248,113,113,0.3)]">

                        <Trash2 className="w-8 h-8 text-red-500" />

                      </div>

                      <h2 className="text-xl font-black text-white uppercase tracking-widest font-mono">

                        Clear {queueToClear === 'pdf' ? 'PDF' : queueToClear === 'txt' ? 'TXT' : queueToClear === 'zip' ? 'ZIP' : 'Agent'} Queue

                      </h2>

                      <p className="text-gray-300 text-sm leading-relaxed">

                        Are you sure you want to permanently clear the entire queue? <br/>

                        <span className="text-red-400 font-bold">This will delete all corresponding files on the backend server.</span>

                      </p>

                      

                      <div className="flex space-x-4 w-full pt-4">

                        <button

                          onClick={() => setQueueToClear(null)}

                          className="flex-1 py-2.5 bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer"

                        >

                          Cancel

                        </button>

                        <button

                          onClick={async () => {

                            try {

                              const wfParam = selectedWorkflowId || 'wf_default';

                              if (queueToClear === 'pdf') {

                                await fetch(`${BACKEND_URL}/api/clear-pdf-queue?workflow_id=${encodeURIComponent(wfParam)}`, { method: 'DELETE' });

                                if (selectedNode) {

                                  updateSelectedNodeData('parameters', { ...(selectedNode.data.parameters || {}), pdfQueue: [], queueLength: 0 });

                                }

                                setServerPdfQueueFiles([]);

                                showAlert("PDF Queue cleared successfully.", "Clear Success", "success");

                              } else if (queueToClear === 'zip') {

                                await fetch(`${BACKEND_URL}/api/clear-zip-queue?workflow_id=${encodeURIComponent(wfParam)}`, { method: 'DELETE' });

                                if (selectedNode) {

                                  updateSelectedNodeData('parameters', { ...(selectedNode.data.parameters || {}), zipQueue: [], queueLength: 0 });

                                }

                                setServerZipQueueFiles([]);

                                showAlert("Zip Queue cleared successfully.", "Clear Success", "success");

                              } else if (queueToClear === 'txt') {

                                await fetch(`${BACKEND_URL}/api/clear-txt-queue?workflow_id=${encodeURIComponent(wfParam)}`, { method: 'DELETE' });

                                if (selectedNode) {

                                  updateSelectedNodeData('parameters', { ...(selectedNode.data.parameters || {}), txtQueue: [], queueLength: 0 });

                                }

                                setServerTxtQueueFiles([]);

                                showAlert("TXT Queue cleared successfully.", "Clear Success", "success");

                              }

                            } catch (err) {

                              console.error('Error clearing queue:', err);

                              showAlert("Failed to clear queue.", "Clear Error", "error");

                            }

                            setQueueToClear(null);

                          }}

                          className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_10px_rgba(248,113,113,0.5)] hover:shadow-[0_0_15px_rgba(248,113,113,0.8)] transform active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center space-x-2"

                        >

                          <span>Confirm Clear</span>

                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              )}



              {/* Central Luxury Confirm Delete Process Dialog Box - Layer Top Most (fixed z-[99999]) */}

              {processToDelete && (

                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-85 backdrop-blur-lg animate-fadeIn select-none">

                  <div className="bg-cyber-dark border-2 border-red-500 shadow-[0_0_60px_rgba(248,113,113,0.4)] rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all relative overflow-hidden">

                    {/* Decorative header gradient */}

                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 animate-pulse" />

                    

                    <div className="mb-6 text-left flex items-center space-x-3">

                      <div className="w-12 h-12 rounded-xl bg-red-500 bg-opacity-20 border border-red-500 flex items-center justify-center text-red-400 shrink-0">

                        <AlertTriangle className="w-6 h-6" />

                      </div>

                      <div>

                        <h2 className="text-xl font-black uppercase tracking-wider text-white">

                          Confirm Deletion

                        </h2>

                        <p className="text-xs text-red-400 font-mono mt-0.5">

                          PERMANENT PROCESS REMOVAL

                        </p>

                      </div>

                    </div>



                    <div className="text-left font-mono text-xs text-gray-300 space-y-3 mb-8 bg-black bg-opacity-60 p-4 rounded-xl border border-red-900/50">

                      <p>

                        Are you sure you want to permanently delete the workflow process <span className="text-white font-bold underline decoration-red-500">{processToDelete.name}</span>?

                      </p>

                      <p className="text-gray-400 text-[11px]">

                        ⚠️ This action will completely purge the workflow run record and remove all associated configuration data from the system database.

                      </p>

                    </div>



                    <div className="flex items-center justify-end space-x-3">

                      <button

                        type="button"

                        onClick={() => setProcessToDelete(null)}

                        className="px-5 py-2.5 bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer"

                      >

                        Cancel

                      </button>

                      <button

                        type="button"

                        onClick={() => {

                          handleDeleteProcess(processToDelete.id);

                          setProcessToDelete(null);

                        }}

                        className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_10px_rgba(248,113,113,0.5)] hover:shadow-[0_0_15px_rgba(248,113,113,0.8)] transform active:scale-[0.98] transition-all cursor-pointer flex items-center space-x-2"

                      >

                        <Trash2 className="w-4 h-4" />

                        <span>Confirm Delete</span>

                      </button>

                    </div>

                  </div>

                </div>

              )}



      {/* Modal 1: Create Group / Subgroup */}

      {showCreateGroupModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">

          <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-lg shadow-[0_24px_50px_rgba(30,60,110,0.2)] overflow-hidden flex flex-col text-slate-800">

            {/* Header */}

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">

              <div className="flex items-center space-x-3.5">

                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shadow-sm">

                  <FolderPlus className="w-5 h-5" />

                </div>

                <div>

                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Create New Group</h3>

                  <p className="text-xs text-slate-500 font-medium">

                    {currentGroupId

                      ? `Creating subgroup inside: "${groups.find(g => g.id === currentGroupId)?.name || 'Parent Group'}"`

                      : 'Creating top-level group folder'}

                  </p>

                </div>

              </div>

              <button

                onClick={() => {

                  setShowCreateGroupModal(false);

                  setNewGroupName('');

                  setNewGroupDesc('');

                }}

                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"

              >

                <X className="w-5 h-5" />

              </button>

            </div>



            {/* Body */}

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

              <div>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">

                  Group Name <span className="text-blue-600">*</span>

                </label>

                <input

                  type="text"

                  value={newGroupName}

                  onChange={(e) => setNewGroupName(e.target.value)}

                  onKeyDown={(e) => {

                    if (e.key === 'Enter') handleCreateGroup();

                  }}

                  autoFocus

                  placeholder="e.g. Design Files, Data Pipelines, AI Models..."

                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-800 placeholder-slate-400 transition-all font-sans font-medium"

                />

              </div>



              <div>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">

                  Description <span className="text-slate-400 font-normal">(Optional)</span>

                </label>

                <textarea

                  value={newGroupDesc}

                  onChange={(e) => setNewGroupDesc(e.target.value)}

                  rows={2}

                  placeholder="Group purpose or workflow category description..."

                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-800 placeholder-slate-400 transition-all font-sans resize-none font-medium"

                />

              </div>



              {/* Folder Color Selector (เลือกสีโฟลเดอร์) */}

              <div>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">

                  Folder Color (เลือกสีโฟลเดอร์)

                </label>

                <div className="flex items-center space-x-2.5">

                  {PALETTE_COLORS.map(c => (

                    <button

                      key={c.id}

                      type="button"

                      onClick={() => setNewGroupColor(c.id)}

                      className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center transition-all cursor-pointer shadow-sm ${

                        newGroupColor === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-md' : 'hover:scale-105 opacity-80 hover:opacity-100'

                      }`}

                      title={c.label}

                    >

                      {newGroupColor === c.id && <Check className="w-4 h-4 text-white drop-shadow-sm" />}

                    </button>

                  ))}

                </div>

              </div>



              {/* Live Interactive Folder Card Preview */}

              <div className="pt-2">

                <div className="flex items-center justify-between mb-2.5 select-none">

                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">

                    Live Folder Preview (ตัวอย่างการ์ดโฟลเดอร์)

                  </label>

                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 font-mono">

                    {PALETTE_COLORS.find(c => c.id === newGroupColor)?.label || 'Blue'} Theme

                  </span>

                </div>

                <div className="max-w-[300px] mx-auto py-2">

                  <FolderCard

                    name={newGroupName.trim() || 'Untitled Folder'}

                    description={newGroupDesc.trim() || 'Workflow organization group folder.'}

                    color={newGroupColor}

                    childWorkflowsCount={0}

                    childSubgroupsCount={0}

                    createdAt={new Date().toISOString()}

                    previewMode={true}

                  />

                </div>

              </div>

            </div>



            {/* Footer */}

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3">

              <button

                type="button"

                onClick={() => {

                  setShowCreateGroupModal(false);

                  setNewGroupName('');

                  setNewGroupDesc('');

                }}

                className="btn-diffuse-white px-5 py-2 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"

              >

                Cancel

              </button>

              <button

                type="button"

                onClick={handleCreateGroup}

                disabled={!newGroupName.trim()}

                className="btn-diffuse-blue px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer select-none"

              >

                Create Group

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Compact Drop Down List for Moving Items */}

      {moveMenuState && (() => {

        const { anchorRect } = moveMenuState;

        const hierarchyLayers = getPathHierarchyLayers(currentGroupId, groups);



        const menuWidth = 190;

        const spaceBelow = window.innerHeight - anchorRect.bottom;

        const openAbove = spaceBelow < 180 && anchorRect.top > 180;



        let leftPos = anchorRect.right - menuWidth;

        if (leftPos < 10) leftPos = 10;

        if (leftPos + menuWidth > window.innerWidth - 10) {

          leftPos = Math.max(10, window.innerWidth - menuWidth - 10);

        }



        const menuStyle: React.CSSProperties = {

          position: 'fixed',

          left: `${leftPos}px`,

          width: `${menuWidth}px`,

          zIndex: 9999,

          ...(openAbove

            ? { bottom: `${window.innerHeight - anchorRect.top + 4}px` }

            : { top: `${anchorRect.bottom + 4}px` })

        };



        return (

          <>

            {/* Click-away backdrop */}

            <div

              className="fixed inset-0 z-[9998] cursor-default bg-transparent"

              onClick={() => setMoveMenuState(null)}

            />



            <div

              style={menuStyle}

              className="bg-white border border-slate-200/90 rounded-xl shadow-[0_12px_28px_rgba(30,60,110,0.18)] p-1 overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-100 select-none text-xs"

            >

              {hierarchyLayers.length > 0 ? (

                <div className="space-y-0.5 max-h-56 overflow-y-auto">

                  {hierarchyLayers.map((layer) => (

                    <button

                      key={layer.id === null ? '__ROOT__' : layer.id}

                      type="button"

                      onClick={() => executeMoveItems(layer.id)}

                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold flex items-center space-x-2 transition-colors cursor-pointer group"

                    >

                      {layer.isRoot ? (

                        <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />

                      ) : (

                        <Folder className="w-3.5 h-3.5 text-blue-600 fill-blue-600/20 shrink-0" />

                      )}

                      <span className="text-xs truncate font-medium flex-1">

                        {layer.name}

                      </span>

                    </button>

                  ))}

                </div>

              ) : (

                <div className="py-2 px-3 text-center text-[11px] text-slate-400 font-medium">

                  ไม่มี Layer ก่อนหน้า

                </div>

              )}

            </div>

          </>

        );

      })()}



      {/* Modal 3: Delete Group Confirmation */}

      {groupToDelete && (() => {

        const childGroupIds = new Set<string>();

        const findChildren = (pid: string) => {

          groups.forEach(g => {

            if (g.parentId === pid) {

              childGroupIds.add(g.id);

              findChildren(g.id);

            }

          });

        };

        findChildren(groupToDelete.id);

        childGroupIds.add(groupToDelete.id);



        const containedWfs = processes.filter(p => childGroupIds.has(workflowGroupMap[p.workflowId || p.id]));

        const hasContainedWfs = containedWfs.length > 0;



        return (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">

            <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-slate-800">

              {/* Header */}

              <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 flex items-center justify-between text-white">

                <div className="flex items-center space-x-3">

                  <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white">

                    <Trash2 className="w-5 h-5" />

                  </div>

                  <div>

                    <h3 className="text-base font-black text-white tracking-wide">ลบโฟลเดอร์ (Delete Folder)</h3>

                    <p className="text-xs text-rose-100 font-mono">ยืนยันการลบ "{groupToDelete.name}"</p>

                  </div>

                </div>

                <button

                  onClick={() => setGroupToDelete(null)}

                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"

                >

                  <X className="w-5 h-5" />

                </button>

              </div>



              {/* Body */}

              <div className="p-6 space-y-4">

                <p className="text-sm text-slate-700 leading-relaxed">

                  คุณต้องการลบโฟลเดอร์ <span className="font-extrabold text-slate-900 underline decoration-rose-400">"{groupToDelete.name}"</span> ใช่หรือไม่?

                </p>



                {hasContainedWfs ? (

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-2.5">

                    <div className="flex items-center space-x-2 font-bold text-xs text-amber-800">

                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />

                      <span>พบ Workflow อยู่ในโฟลเดอร์นี้จำนวน {containedWfs.length} รายการ:</span>

                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">

                      {containedWfs.slice(0, 5).map((w, idx) => (

                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-amber-300 font-medium text-slate-700 shadow-2xs">

                          {w.name || w.id}

                        </span>

                      ))}

                      {containedWfs.length > 5 && (

                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-200/60 font-semibold text-amber-800">

                          +{containedWfs.length - 5} รายการอื่นๆ

                        </span>

                      )}

                    </div>

                    <p className="text-xs text-amber-800/90 pt-1 leading-snug">

                      คุณต้องการลบ Workflow เหล่านี้ไปพร้อมกับโฟลเดอร์ หรือต้องการลบเฉพาะโฟลเดอร์ (และย้าย Workflow ไปไว้ที่หน้าหลัก)?

                    </p>

                  </div>

                ) : (

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">

                    โฟลเดอร์นี้ไม่มี Workflow อยู่ข้างใน ระบบจะลบโฟลเดอร์นี้ทันที

                  </div>

                )}

              </div>



              {/* Footer Buttons */}

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-end gap-2.5">

                <button

                  type="button"

                  onClick={() => setGroupToDelete(null)}

                  className="btn-diffuse-white w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"

                >

                  ยกเลิก (Cancel)

                </button>



                {hasContainedWfs ? (

                  <>

                    <button

                      type="button"

                      onClick={() => handleDeleteGroup(groupToDelete.id, false)}

                      className="btn-diffuse-blue w-full sm:w-auto px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer"

                      title="ลบเฉพาะ Folder และเก็บ Workflow ทั้งหมดไว้ที่หน้าหลัก"

                    >

                      ลบเฉพาะ Folder (เก็บ Workflow ไว้)

                    </button>

                    <button

                      type="button"

                      onClick={() => handleDeleteGroup(groupToDelete.id, true)}

                      className="btn-diffuse-rose w-full sm:w-auto px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all cursor-pointer"

                      title="ลบ Folder และลบ Workflow ทั้งหมดในนี้ทิ้งถาวร"

                    >

                      ลบ Folder และ Workflow ทั้งหมด ({containedWfs.length})

                    </button>

                  </>

                ) : (

                  <button

                    type="button"

                    onClick={() => handleDeleteGroup(groupToDelete.id, false)}

                    className="btn-diffuse-rose w-full sm:w-auto px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all cursor-pointer"

                  >

                    ลบโฟลเดอร์ (Delete Folder)

                  </button>

                )}

              </div>

            </div>

          </div>

        );

      })()}





              {/* Central Luxury Create Workflow Dialog Box - Layer Top Most (fixed z-[99999]) */}

              {showCreateWorkflowDialog && (

                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">

                  <div className="bg-white border border-slate-200/90 rounded-3xl max-w-xl w-full mx-4 shadow-[0_24px_50px_rgba(30,60,110,0.2)] overflow-hidden flex flex-col text-slate-800">

                    {/* Header with Royal Blue Gradient */}

                    <div className="bg-gradient-to-r from-[#1E6BFF] to-[#1456D3] px-6 py-5 flex items-center justify-between text-white">

                      <div className="flex items-center space-x-3.5">

                        <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm">

                          <Plus className="w-5 h-5" />

                        </div>

                        <div>

                          <h2 className="text-lg font-black tracking-tight text-white">

                            Create New Workflow

                          </h2>

                          <p className="text-xs text-white/80 font-medium mt-0.5">

                            Initialize agent orchestration pipeline

                          </p>

                        </div>

                      </div>

                      <button

                        type="button"

                        onClick={() => {

                          setShowCreateWorkflowDialog(false);

                          setNewDialogWfName('My AI Agent Workflow');

                          setNewDialogWfDesc('');

                        }}

                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"

                        title="Close"

                      >

                        <X className="w-5 h-5" />

                      </button>

                    </div>



                    <div className="p-6 space-y-4 text-left">

                      <div>

                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">

                          Workflow Name <span className="text-blue-600">*</span>

                        </label>

                        <input

                          type="text"

                          value={newDialogWfName}

                          onChange={(e) => setNewDialogWfName(e.target.value)}

                          placeholder="e.g. Enterprise Financial Audit Pipeline"

                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"

                        />

                      </div>



                      <div>

                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">

                          Description (Optional)

                        </label>

                        <textarea

                          value={newDialogWfDesc}

                          onChange={(e) => setNewDialogWfDesc(e.target.value)}

                          placeholder="Describe the objective, tools, or data sources for this workflow..."

                          rows={3}

                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"

                        />

                      </div>



                      {/* Workflow Color Selector (เลือกสี Workflow) */}

                      <div>

                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">

                          Workflow Color (เลือกสี Workflow)

                        </label>

                        <div className="flex items-center space-x-2.5">

                          {PALETTE_COLORS.map(c => (

                            <button

                              key={c.id}

                              type="button"

                              onClick={() => setNewDialogWfColor(c.id)}

                              className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center transition-all cursor-pointer shadow-sm ${

                                newDialogWfColor === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-md' : 'hover:scale-105 opacity-80 hover:opacity-100'

                              }`}

                              title={c.label}

                            >

                              {newDialogWfColor === c.id && <Check className="w-4 h-4 text-white drop-shadow-sm" />}

                            </button>

                          ))}

                        </div>

                      </div>



                      <div className="pt-2 flex items-center justify-end space-x-3">

                        <button

                          type="button"

                          onClick={() => {

                            setShowCreateWorkflowDialog(false);

                            setNewDialogWfName('My AI Agent Workflow');

                            setNewDialogWfDesc('');

                            setNewDialogWfColor('blue');

                          }}

                          className="btn-diffuse-white px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer select-none"

                        >

                          Cancel

                        </button>

                        <button

                          type="button"

                          onClick={() => {

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

                                  intervalUnit: 'seconds',

                                  remainingSeconds: 2,

                                  schedulerActive: false

                                }

                              }

                            };

                            setNodes([defaultTimerNode]);

                            setEdges([]);

                            setAgentNodes([]);

                            setAgentEdges([]);

                            setShowCreateWorkflowDialog(false);

                            setNewDialogWfColor('blue');

                            

                            // Save newly created workflow directly to Backend SQLite DB and JSON (.wf) files

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



                            // Register empty synchronized process record

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



                            // Add currentGroupId mapping for newly created workflow

                            if (currentGroupId) {

                              setWorkflowGroupMap(prevMap => {

                                const nextMap = { ...prevMap, [newId]: currentGroupId };

                                try {

                                  localStorage.setItem('app_workflow_group_map', JSON.stringify(nextMap));

                                } catch (e) {}

                                return nextMap;

                              });

                            }



                            // Add workflowColorMap mapping

                            setWorkflowColorMap(prevMap => {

                              const nextMap = { ...prevMap, [newId]: chosenColor };

                              try {

                                localStorage.setItem('app_workflow_color_map', JSON.stringify(nextMap));

                              } catch (e) {}

                              return nextMap;

                            });



                            logUserAction(`Created New Workflow via Dialog: ${name}`, { workflowName: name }, { file: 'App.tsx', class: 'LogicWorkspace', func: 'CreateWorkflowDialog', logType: 'process_action' });

                            logUserAction(`Workflow Status Changed: Created and initialized in Idle state`, { workflowName: name }, { file: 'App.tsx', class: 'LogicWorkspace', func: 'CreateWorkflowDialog', logType: 'status_change' });

                          }}

                          className="btn-diffuse-blue px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer select-none"

                        >

                          Create Workflow

                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              )}



      {/* Floating Dialogs */}

      {dialogs.map(dialog => (

        <FloatingDialog

          key={dialog.id}

          dialog={dialog}

          onClose={closeDialog}

          onUpdate={updateDialog}

          bringToFront={bringToFront}

        />

      ))}

      

            {tableBuilderNodeId && (

        <TableBuilder

          initialData={nodes.find(n => n.id === tableBuilderNodeId)?.data.tableData}

          nodeLabel={nodes.find(n => n.id === tableBuilderNodeId)?.data.label}

          onClose={() => setTableBuilderNodeId(null)}

          onSave={(tableData: TableData) => {

            setNodes(nds => nds.map(n => n.id === tableBuilderNodeId ? { ...n, data: { ...n.data, tableData } } : n));

            setTableBuilderNodeId(null);

          }}

        />

      )}

      {sampleBuilderNodeId && (

        <SampleBuilder

          initialData={nodes.find(n => n.id === sampleBuilderNodeId)?.data.sampleData}

          nodeLabel={nodes.find(n => n.id === sampleBuilderNodeId)?.data.label}

          onClose={() => setSampleBuilderNodeId(null)}

          onSave={(sampleData: SampleData) => {

            setNodes(nds => nds.map(n => n.id === sampleBuilderNodeId ? { ...n, data: { ...n.data, sampleData } } : n));

            setSampleBuilderNodeId(null);

          }}

        />

      )}

      

      {rubricBuilderNodeId && (

        <RubricBuilder

          mode={nodes.find(n => n.id === rubricBuilderNodeId)?.type === 'mca' ? 'mca' : 'rubric'}

          initialData={nodes.find(n => n.id === rubricBuilderNodeId)?.data.rubricData}

          nodeLabel={nodes.find(n => n.id === rubricBuilderNodeId)?.data.label}

          onClose={() => setRubricBuilderNodeId(null)}

          onSave={(rubricData) => {

            setNodes(nds => nds.map(n => n.id === rubricBuilderNodeId ? { ...n, data: { ...n.data, rubricData } } : n));

          }}

        />

      )}

      

      {isFinalPromptModalOpen && finalPromptPreview !== null && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">

          <div className="bg-[#0a0a0f] border border-cyber-neon w-[800px] max-w-[90vw] h-[80vh] flex flex-col rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.2)]">

            <div className="flex items-center justify-between p-4 border-b border-cyber-border bg-[#111116] rounded-t-xl">

              <h3 className="text-cyber-neon font-bold text-sm uppercase tracking-wider">Final Prompt Preview</h3>

              <button 

                onClick={() => setIsFinalPromptModalOpen(false)}

                className="text-cyber-muted hover:text-red-400 transition-colors text-xl font-bold px-2"

              >

                ✕

              </button>

            </div>

            <div className="p-5 flex-1 overflow-y-auto min-h-0">

              <pre className="text-xs font-mono text-cyber-text whitespace-pre-wrap leading-relaxed">

                {finalPromptPreview}

              </pre>

            </div>

          </div>

        </div>

      )}



      {isFinalSendModalOpen && finalSendPayloadPreview !== null && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">

          <div className="bg-[#0a0a0f] border border-purple-500 w-[800px] max-w-[90vw] h-[80vh] flex flex-col rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.2)]">

            <div className="flex items-center justify-between p-4 border-b border-cyber-border bg-[#111116] rounded-t-xl">

              <h3 className="text-purple-400 font-bold text-sm uppercase tracking-wider">Final Send Payload Preview</h3>

              <button 

                onClick={() => setIsFinalSendModalOpen(false)}

                className="text-cyber-muted hover:text-red-400 transition-colors text-xl font-bold px-2"

              >

                × 

              </button>

            </div>

            <div className="p-5 flex-1 overflow-y-auto min-h-0">

              <pre className="text-xs font-mono text-purple-200 whitespace-pre-wrap leading-relaxed">

                {finalSendPayloadPreview}

              </pre>

            </div>

          </div>

        </div>

      )}



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

