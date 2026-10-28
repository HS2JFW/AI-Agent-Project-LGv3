import {
  BarChart3,
  Bot,
  Database,
  FileSearch,
  FileSpreadsheet,
  Layers,
  LayoutPanelTop,
  Mail,
  Users,
  Zap
} from 'lucide-react';

// Sidebar Draggable Node Templates

export const DRAGGABLE_TEMPLATES = [

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

export const GROUP_MENUS = [

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

export const GROUP_COLOR_THEMES: Record<string, {

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



export const getGroupTheme = (color?: string) => {

  const c = (color || 'cyan').toLowerCase();

  return GROUP_COLOR_THEMES[c] || GROUP_COLOR_THEMES.cyan;

};


