import React from 'react';
import {
  Database,
  Cpu,
  Bot,
  Zap,
  Mail,
  MessageSquare,
  Globe,
  FileText,
  FileSearch,
  Layers,
  User,
  ShieldCheck,
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
  Sparkles,
} from 'lucide-react';

/**
 * Helper to get sidebar icons matching node designs
 */
export const getSidebarIcon = (category: string, name: string): React.ReactElement => {
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

