import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Zap,
  Clock,
  Key,
  X,
  Sparkles,
  Cpu,
  Layers,
  Award,
  Database,
  ArrowUpRight,
  Sliders,
  Bot,
  Trash2,
  Edit,
  Plus,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Activity,
  HardDrive
} from 'lucide-react';

export interface AiModelItem {
  id: string;
  provider: string;
  endpoint?: string;
  modelName: string;
  apiKey: string;
  label?: string;
  intelligenceMode?: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
}

interface UnifiedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'profile' | 'ai' | 'canvas';
  onTabChange?: (tab: 'profile' | 'ai' | 'canvas') => void;
  username?: string;
  // AI Models
  aiModels: AiModelItem[];
  setAiModels: React.Dispatch<React.SetStateAction<AiModelItem[]>>;
  showAlert?: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
  // Canvas Settings
  historyLimit: number;
  setHistoryLimit: (limit: number) => void;
  pastCount: number;
  futureCount: number;
  undo: () => void;
  redo: () => void;
  onClearHistory?: () => void;
}

export default function UnifiedSettingsModal({
  isOpen,
  onClose,
  activeTab = 'profile',
  onTabChange,
  username = 'user01',
  aiModels,
  setAiModels,
  showAlert,
  historyLimit,
  setHistoryLimit,
  pastCount,
  futureCount,
  undo,
  redo,
  onClearHistory
}: UnifiedSettingsModalProps) {
  const [currentTab, setCurrentTab] = useState<'profile' | 'ai' | 'canvas'>(activeTab);

  // Sync tab if parent prop changes
  React.useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const handleSelectTab = (tab: 'profile' | 'ai' | 'canvas') => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // --- AI Model Form State ---
  const [newModelProvider, setNewModelProvider] = useState<string>('Google');
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelLabel, setNewModelLabel] = useState<string>('');
  const [newModelApiKey, setNewModelApiKey] = useState<string>('');
  const [newModelEndpoint, setNewModelEndpoint] = useState<string>('');
  const [newModelIntelligenceMode, setNewModelIntelligenceMode] = useState<string>('Standard / Balanced (Default)');
  const [newModelTemperature, setNewModelTemperature] = useState<number>(0.0);
  const [newModelMaxTokens, setNewModelMaxTokens] = useState<string>('');
  const [newModelContextWindow, setNewModelContextWindow] = useState<string>('');
  const [showNewApiKey, setShowNewApiKey] = useState<boolean>(false);

  // Edit AI Model State
  const [editingAiModelId, setEditingAiModelId] = useState<string | null>(null);
  const [editAiModel, setEditAiModel] = useState<Partial<AiModelItem>>({});
  const [showEditApiKey, setShowEditApiKey] = useState<boolean>(false);

  const handleEditAiModelStart = (m: AiModelItem) => {
    setEditingAiModelId(m.id || m.modelName);
    setEditAiModel({ ...m });
    setShowEditApiKey(false);
  };

  const handleEditAiModelSave = () => {
    if (!editAiModel.modelName?.trim()) {
      if (showAlert) showAlert('Model Name cannot be empty', 'Save Error', 'error');
      return;
    }
    setAiModels((prev) =>
      prev.map((m) =>
        (m.id === editAiModel.id || m.modelName === editAiModel.id)
          ? ({ ...m, ...editAiModel, id: m.id } as AiModelItem)
          : m
      )
    );
    setEditingAiModelId(null);
  };

  const handleAddAiModel = () => {
    if (!newModelName.trim()) {
      if (showAlert) showAlert('กรุณาระบุชื่อ Model Name', 'Add Model Error', 'error');
      else alert('กรุณาระบุชื่อ Model Name');
      return;
    }
    const id = `${newModelProvider.toLowerCase()}-${newModelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: AiModelItem = {
      id,
      provider: newModelProvider,
      modelName: newModelName.trim(),
      apiKey: newModelApiKey.trim(),
      endpoint: newModelEndpoint.trim(),
      label: newModelLabel.trim() || `${newModelProvider} - ${newModelName.trim()}`,
      intelligenceMode: newModelIntelligenceMode,
      temperature: newModelTemperature,
      maxTokens: newModelMaxTokens ? Number(newModelMaxTokens) : undefined,
      contextWindow: newModelContextWindow ? Number(newModelContextWindow) : undefined
    };
    setAiModels((prev) => [...prev, newEntry]);
    setNewModelName('');
    setNewModelLabel('');
    setNewModelApiKey('');
    setNewModelEndpoint('');
    setNewModelIntelligenceMode('Standard / Balanced (Default)');
    setNewModelTemperature(0.0);
    setNewModelMaxTokens('');
    setNewModelContextWindow('');
  };

  const handleDeleteAiModel = (idOrModelName: string) => {
    setAiModels((prev) => prev.filter((m) => m.id !== idOrModelName && m.modelName !== idOrModelName));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent Line */}
        <div className="h-1 w-full bg-zinc-900 dark:bg-zinc-100" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 select-none">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
              {currentTab === 'profile' && <User className="w-5 h-5" />}
              {currentTab === 'ai' && <Bot className="w-5 h-5" />}
              {currentTab === 'canvas' && <Sliders className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-wide font-mono">
                  {currentTab === 'profile' && 'User Account & Profile Settings'}
                  {currentTab === 'ai' && 'AI Models & Provider Settings'}
                  {currentTab === 'canvas' && 'Canvas & System Configuration'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  Settings Hub
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                {currentTab === 'profile' && `Account ID: ACC-2026-USR01 • @${username}`}
                {currentTab === 'ai' && `Global AI Model Credentials & Intelligence Parameters (${aiModels.length} Registered)`}
                {currentTab === 'canvas' && 'Workspace Undo/Redo Engine & Execution Environment'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body: 2-Column Split (Left Tabs Sidebar + Right Content Area) */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left Vertical Tabs Rail */}
          <aside className="w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 flex flex-col justify-between select-none">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400/80 px-2.5 py-1 block">
                Preferences
              </span>

              {/* Tab 1: Profile */}
              <button
                type="button"
                onClick={() => handleSelectTab('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  currentTab === 'profile'
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                    : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg border ${
                  currentTab === 'profile' ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold">Profile</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400/80 truncate font-mono">User & Subscription</div>
                </div>
              </button>

              {/* Tab 2: AI */}
              <button
                type="button"
                onClick={() => handleSelectTab('ai')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  currentTab === 'ai'
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                    : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg border ${
                  currentTab === 'ai' ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold">AI Models</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400/80 truncate font-mono">Keys & Intelligence</div>
                </div>
              </button>

              {/* Tab 3: Canvas */}
              <button
                type="button"
                onClick={() => handleSelectTab('canvas')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  currentTab === 'canvas'
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                    : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg border ${
                  currentTab === 'canvas' ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
                }`}>
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold">Canvas</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400/80 truncate font-mono">History & System</div>
                </div>
              </button>
            </div>

            {/* Left Rail Footer System Info */}
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono space-y-1.5 text-zinc-500 dark:text-zinc-400 shadow-2xs">
              <div className="flex items-center justify-between">
                <span>Cluster:</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">SG-NORTH-01</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Uptime SLA:</span>
                <span className="text-emerald-400">99.98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active Engine:</span>
                <span className="text-cyan-400">Node v22.18</span>
              </div>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 min-h-0 overflow-y-auto p-6 bg-zinc-50/30 dark:bg-[#0c0c0e]/30">
            {/* ======================================================== */}
            {/* TAB 1: PROFILE                                           */}
            {/* ======================================================== */}
            {currentTab === 'profile' && (
              <div className="space-y-6 max-w-4xl">
                {/* User Account Info Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold block">Full Name</span>
                    <p className="text-zinc-900 dark:text-zinc-100 font-medium text-sm flex items-center space-x-1.5">
                      <span>Enterprise User (Admin)</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold block">Username</span>
                    <p className="text-zinc-900 dark:text-zinc-100 font-mono font-medium text-sm">@{username}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold block">Account Email</span>
                    <p className="text-zinc-600 dark:text-zinc-400 font-mono text-xs truncate">user01@enterprise-agent.io</p>
                  </div>
                </div>

                {/* Package Details Section */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-5 shadow-xs relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-cyber-neon/5 pointer-events-none">
                    <Award className="w-36 h-36" />
                  </div>

                  <div className="flex items-start justify-between relative z-10 mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-900 dark:text-zinc-100">Current Subscription Package</span>
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 tracking-tight">
                        AI Agent Enterprise Pro Package
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        แพ็กเกจระดับองค์กร • สิทธิ์การใช้งานระบบประมวลผล AI Agent และ Pipeline อัตโนมัติเต็มรูปแบบ
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active • ชำระเงินแล้ว</span>
                      </span>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-1">รอบบิล: รายปี (Annual Plan)</p>
                    </div>
                  </div>

                  {/* Package Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 relative z-10">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/40">
                      <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Start Date</span>
                      </div>
                      <p className="text-xs font-mono font-medium text-white">15 Jan 2026</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/40">
                      <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Expiry Date</span>
                      </div>
                      <p className="text-xs font-mono font-medium text-amber-400">15 Jan 2027</p>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">(เหลืออีก 108 วัน)</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/40">
                      <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Amount Paid</span>
                      </div>
                      <p className="text-xs font-mono font-bold text-white">฿ 48,000 / ปี</p>
                      <span className="text-[9px] text-emerald-400 font-mono">Invoice #INV-9821</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/40">
                      <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                        <Key className="w-3.5 h-3.5 text-purple-400" />
                        <span>License Key</span>
                      </div>
                      <p className="text-[11px] font-mono font-semibold text-cyber-neon truncate" title="LIC-LG3-9984-ENT">
                        LIC-LG3-9984-ENT
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quota and Usage Limits */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-cyber-neon" />
                    <span>Package Quota & Resources (โควตาสิทธิการใช้งาน)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Workflows Quota */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Workflows Creation</span>
                        </span>
                        <span className="font-mono font-bold text-cyber-neon">Unlimited (ไม่จำกัด)</span>
                      </div>
                      <div className="w-full bg-white dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800/40">
                        <div className="bg-cyber-neon h-full w-full" />
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">สร้างและจัดเก็บ Workflow ได้ไม่จำกัดจำนวนโปรเจกต์</p>
                    </div>

                    {/* Monthly AI Executions */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>AI Execution Runs / Month</span>
                        </span>
                        <span className="font-mono font-bold text-white">8,450 / 50,000</span>
                      </div>
                      <div className="w-full bg-white dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800/40">
                        <div className="bg-gradient-to-r from-cyber-neon to-cyan-400 h-full w-[17%]" />
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">เหลือโควตา 41,550 รัน สำหรับรอบเดือนนี้</p>
                    </div>

                    {/* Concurrency */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Concurrent Pipelines</span>
                        </span>
                        <span className="font-mono font-bold text-white">10 Simultaneous</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">รันประมวลผลหลาย Workflow ขนานกันได้สูงสุด 10 สายงาน</p>
                    </div>

                    {/* AI Models Access */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5">
                          <Database className="w-3.5 h-3.5 text-purple-400" />
                          <span>Unlocked AI Models</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-400">All Tiers (GPT-4o, Claude 3.5, Gemini Pro)</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">ปลดล็อกทุกโมเดลระดับสูงและ Local LLMs</p>
                    </div>
                  </div>
                </div>

                {/* Profile Actions */}
                <div className="flex items-center justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800/50">
                  <button
                    onClick={() => {
                      alert('ระบบต่ออายุแพ็กเกจกำลังเชื่อมต่อไปยัง Payment Gateway...');
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Manage Subscription</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: AI MODELS                                         */}
            {/* ======================================================== */}
            {currentTab === 'ai' && (
              <div className="space-y-6">
                {/* Add New AI Model Form */}
                <div className="p-5 bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800/40 pb-2.5">
                    <Key className="w-4 h-4 text-cyber-neon" />
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Add New AI Model API Connection
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                        AI Provider
                      </label>
                      <select
                        value={newModelProvider}
                        onChange={(e) => setNewModelProvider(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                      >
                        <option value="Google">Google (Gemini)</option>
                        <option value="OpenAI">OpenAI (ChatGPT / GPT-4)</option>
                        <option value="Anthropic">Anthropic (Claude)</option>
                        <option value="DeepSeek">DeepSeek AI</option>
                        <option value="OpenRouter.ai">OpenRouter.ai (Multi-Provider AI)</option>
                        <option value="Custom">Custom / Local LLM</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                        Intelligence Mode / Reasoning
                      </label>
                      <select
                        value={newModelIntelligenceMode}
                        onChange={(e) => setNewModelIntelligenceMode(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                      >
                        <option value="Standard / Balanced (Default)">Standard / Balanced (Default)</option>
                        <option value="High Intelligence / Advanced Reasoning">High Intelligence / Advanced Reasoning</option>
                        <option value="Thinking Mode (Chain-of-Thought)">Thinking Mode (Chain-of-Thought)</option>
                        <option value="Fast / Low Latency">Fast / Low Latency</option>
                        <option value="Coding & Math Specialized">Coding & Math Specialized</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                        Model Name (e.g., gemini-2.5-flash, gpt-4o)
                      </label>
                      <input
                        type="text"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="e.g., gemini-2.5-flash, gpt-4o, claude-3-5-sonnet"
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                        Display Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={newModelLabel}
                        onChange={(e) => setNewModelLabel(e.target.value)}
                        placeholder="e.g. Gemini 3.1 Pro (High Intelligence)"
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                        API Key / Secret Token
                      </label>
                      <div className="relative">
                        <input
                          type={showNewApiKey ? 'text' : 'password'}
                          value={newModelApiKey}
                          onChange={(e) => setNewModelApiKey(e.target.value)}
                          placeholder="AIxaSy... (leave blank to use system ENV)"
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 pr-9 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewApiKey(!showNewApiKey)}
                          className="absolute right-2.5 top-2 text-zinc-500 dark:text-zinc-400 hover:text-cyber-neon cursor-pointer"
                        >
                          {showNewApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                        API Endpoint (Optional)
                      </label>
                      <input
                        type="text"
                        value={newModelEndpoint}
                        onChange={(e) => setNewModelEndpoint(e.target.value)}
                        placeholder="https://... (leave blank for default)"
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                        Context Window (Tokens)
                      </label>
                      <input
                        type="number"
                        value={newModelContextWindow}
                        onChange={(e) => setNewModelContextWindow(e.target.value)}
                        placeholder="e.g. 1000000 or 2000000"
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddAiModel}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 py-2 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add AI Model</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Models Table List */}
                <div className="p-5 bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/40 pb-2.5">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center space-x-2">
                      <Database className="w-4 h-4 text-cyber-neon" />
                      <span>Registered AI Models ({aiModels.length})</span>
                    </h4>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                      Shared automatically across all Agent Nodes
                    </span>
                  </div>

                  {aiModels.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                      No AI Models registered. Fill out the form above to connect a provider.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800/40">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-[#121215]/40 text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                            <th className="py-2.5 px-3 font-bold text-center w-20">Actions</th>
                            <th className="py-2.5 px-3 font-bold">Provider</th>
                            <th className="py-2.5 px-3 font-bold">Model / Label</th>
                            <th className="py-2.5 px-3 font-bold">Intelligence Mode</th>
                            <th className="py-2.5 px-3 font-bold">API Key</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyber-border/30 text-xs">
                          {aiModels.map((m, idx) => (
                            <React.Fragment key={m.id || idx}>
                              <tr className="hover:bg-white dark:bg-[#121215]/20 transition-colors">
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <button
                                    onClick={() => handleEditAiModelStart(m)}
                                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer mr-1.5 inline-block"
                                    title="Edit AI Model"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAiModel(m.id || m.modelName)}
                                    className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer inline-block"
                                    title="Delete AI Model"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                                      m.provider === 'Google'
                                        ? 'bg-blue-900/40 text-blue-300 border border-blue-700/60'
                                        : m.provider === 'OpenAI'
                                          ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/60'
                                          : m.provider === 'Anthropic'
                                            ? 'bg-purple-900/40 text-purple-300 border border-purple-700/60'
                                            : m.provider === 'OpenRouter.ai'
                                              ? 'bg-pink-900/40 text-pink-300 border border-pink-700/60'
                                              : 'bg-gray-800 text-gray-300 border border-gray-600'
                                    }`}
                                  >
                                    {m.provider}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{m.label || m.modelName}</div>
                                  <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{m.modelName}</div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded-full border ${
                                      m.intelligenceMode?.includes('High') || m.intelligenceMode?.includes('Thinking')
                                        ? 'bg-amber-900/30 text-amber-300 border-amber-700/50'
                                        : m.intelligenceMode?.includes('Fast')
                                          ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50'
                                          : 'bg-blue-900/30 text-blue-300 border-blue-700/50'
                                    }`}
                                  >
                                    {m.intelligenceMode || 'Standard / Balanced (Default)'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {m.apiKey ? (
                                    <span className="inline-flex items-center space-x-1 text-cyber-neon text-[10px] bg-white dark:bg-[#121215]/40 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 font-mono">
                                      <Key className="w-3 h-3" />
                                      <span>••••{m.apiKey.slice(-4)}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-400 italic bg-amber-900/20 px-2 py-0.5 rounded border border-amber-800/40 font-mono">
                                      Use ENV / Empty
                                    </span>
                                  )}
                                </td>
                              </tr>

                              {/* Inline Edit Form when selected */}
                              {editingAiModelId === (m.id || m.modelName) && (
                                <tr className="bg-white dark:bg-zinc-900/95">
                                  <td colSpan={5} className="p-4 border-t border-b border-cyber-neon/40">
                                    <div className="space-y-3 bg-white dark:bg-[#121215]/30 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
                                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/40 pb-2">
                                        <span className="text-xs font-bold text-cyber-neon uppercase tracking-wider flex items-center space-x-1.5">
                                          <Edit className="w-3.5 h-3.5" />
                                          <span>Edit Model: {m.modelName}</span>
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">Provider</label>
                                          <select
                                            value={editAiModel.provider || 'Google'}
                                            onChange={(e) => setEditAiModel({ ...editAiModel, provider: e.target.value })}
                                            className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                                          >
                                            <option value="Google">Google (Gemini)</option>
                                            <option value="OpenAI">OpenAI</option>
                                            <option value="Anthropic">Anthropic</option>
                                            <option value="OpenRouter.ai">OpenRouter.ai</option>
                                            <option value="Custom">Custom / Local LLM</option>
                                          </select>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">Intelligence Mode</label>
                                          <select
                                            value={editAiModel.intelligenceMode || 'Standard / Balanced (Default)'}
                                            onChange={(e) => setEditAiModel({ ...editAiModel, intelligenceMode: e.target.value })}
                                            className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                                          >
                                            <option value="Standard / Balanced (Default)">Standard / Balanced (Default)</option>
                                            <option value="Fast / Low Latency">Fast / Low Latency</option>
                                            <option value="High Intelligence / Advanced Reasoning">High Intelligence / Advanced Reasoning</option>
                                            <option value="Thinking Mode (Chain-of-Thought)">Thinking Mode (Chain-of-Thought)</option>
                                          </select>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">Model Name</label>
                                          <input
                                            type="text"
                                            value={editAiModel.modelName || ''}
                                            onChange={(e) => setEditAiModel({ ...editAiModel, modelName: e.target.value })}
                                            className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">Display Label</label>
                                          <input
                                            type="text"
                                            value={editAiModel.label || ''}
                                            onChange={(e) => setEditAiModel({ ...editAiModel, label: e.target.value })}
                                            className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">API Endpoint</label>
                                          <input
                                            type="text"
                                            value={editAiModel.endpoint || ''}
                                            onChange={(e) => setEditAiModel({ ...editAiModel, endpoint: e.target.value })}
                                            placeholder="e.g. https://api.openai.com/v1"
                                            className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">Context Window (Tokens)</label>
                                          <input
                                            type="number"
                                            value={editAiModel.contextWindow || ''}
                                            onChange={(e) =>
                                              setEditAiModel({
                                                ...editAiModel,
                                                contextWindow: e.target.value ? Number(e.target.value) : undefined
                                              })
                                            }
                                            placeholder="e.g. 1000000"
                                            className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">Temperature</label>
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="range"
                                              min="0"
                                              max="2"
                                              step="0.1"
                                              value={editAiModel.temperature !== undefined ? editAiModel.temperature : 0.0}
                                              onChange={(e) => setEditAiModel({ ...editAiModel, temperature: Number(e.target.value) })}
                                              className="w-full h-1.5 bg-white dark:bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-cyber-neon"
                                            />
                                            <span className="text-cyber-neon text-xs font-mono w-6">
                                              {editAiModel.temperature !== undefined ? editAiModel.temperature : 0.0}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">API Key / Token</label>
                                          <div className="relative">
                                            <input
                                              type={showEditApiKey ? 'text' : 'password'}
                                              value={editAiModel.apiKey || ''}
                                              onChange={(e) => setEditAiModel({ ...editAiModel, apiKey: e.target.value })}
                                              className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 pr-8 font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => setShowEditApiKey(!showEditApiKey)}
                                              className="absolute right-2 top-1.5 text-zinc-500 dark:text-zinc-400 hover:text-cyber-neon"
                                            >
                                              {showEditApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/40">
                                        <button
                                          onClick={() => setEditingAiModelId(null)}
                                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-xs"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={handleEditAiModelSave}
                                          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs transition-colors cursor-pointer"
                                        >
                                          Save Changes
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: CANVAS & SYSTEM SETTINGS                           */}
            {/* ======================================================== */}
            {currentTab === 'canvas' && (
              <div className="space-y-6 max-w-4xl">
                {/* Undo / Redo History Card */}
                <div className="p-5 bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800/40 pb-2.5">
                    <Sliders className="w-4 h-4 text-cyber-neon" />
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Undo / Redo History & State Memory
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block">
                      History Limits (Maximum Steps)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min={5}
                        max={200}
                        value={historyLimit}
                        onChange={(e) => {
                          const val = Math.max(5, Math.min(200, Number(e.target.value) || 50));
                          setHistoryLimit(val);
                        }}
                        className="w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                      />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Range: 5 - 200 steps (Current default: 50)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Determines how many graph changes and node states are retained in the undo stack. Higher limits require slightly more browser memory.
                    </p>
                  </div>

                  {/* Manual Controls & Stack Status */}
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/40 space-y-3">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block">
                      History Stack Status
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-white dark:bg-zinc-900/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400 text-xs block">Undo Steps</span>
                        <span className="text-base font-bold text-cyber-neon mt-1 block font-mono">
                          {pastCount} available
                        </span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400 text-xs block">Redo Steps</span>
                        <span className="text-base font-bold text-cyan-400 mt-1 block font-mono">
                          {futureCount} available
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-1">
                      <button
                        type="button"
                        onClick={undo}
                        disabled={pastCount === 0}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center space-x-2 transition-all ${
                          pastCount > 0
                            ? 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800 hover:border-cyber-neon text-zinc-900 dark:text-zinc-100 hover:text-cyber-neon cursor-pointer shadow-sm'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/40 text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Undo Step</span>
                        <span className="text-[9px] font-normal opacity-60">(Ctrl+Z)</span>
                      </button>
                      <button
                        type="button"
                        onClick={redo}
                        disabled={futureCount === 0}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center space-x-2 transition-all ${
                          futureCount > 0
                            ? 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800 hover:border-cyber-neon text-zinc-900 dark:text-zinc-100 hover:text-cyber-neon cursor-pointer shadow-sm'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/40 text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                        <span>Redo Step</span>
                        <span className="text-[9px] font-normal opacity-60">(Ctrl+Y)</span>
                      </button>
                      {onClearHistory && (
                        <button
                          type="button"
                          onClick={onClearHistory}
                          disabled={pastCount === 0 && futureCount === 0}
                          className="py-2 px-3 rounded-lg text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-900/20 hover:border-red-500/60 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Purge Undo & Redo History Stacks"
                        >
                          Clear Stack
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Canvas Navigation & Shortcuts Info Card */}
                <div className="p-5 bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800/40 pb-2.5">
                    <Activity className="w-4 h-4 text-cyber-neon" />
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Canvas Controls & Shortcuts Guide
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/40 space-y-1">
                      <span className="text-white font-semibold block">Pan / Navigate Canvas</span>
                      <p className="text-[11px]">Hold Right-Click / Scroll Wheel or Drag background to pan around nodes.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/40 space-y-1">
                      <span className="text-white font-semibold block">Zoom Range</span>
                      <p className="text-[11px]">Mouse wheel zooms from 0.25x up to 2.0x scale with crisp vector rendering.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/40 space-y-1">
                      <span className="text-white font-semibold block">Multi-Selection</span>
                      <p className="text-[11px]">Click and drag a marquee selection box across nodes to select and move multiple nodes.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/40 space-y-1">
                      <span className="text-white font-semibold block">Lock Canvas Position</span>
                      <p className="text-[11px]">Use the Lock icon in the bottom-left controls to freeze node positions while editing.</p>
                    </div>
                  </div>
                </div>

                {/* Storage & Auto-save Status */}
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>Real-Time Sync Engine:</span>
                    <span className="text-cyber-neon font-bold">Auto-Save Active (Disk + Browser Cache)</span>
                  </div>
                  <span className="text-[10px] text-gray-500">FORMAT: .WF JSON</span>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 select-none">
          <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-cyber-neon animate-pulse" />
            <span>AI Studio Engine v3.0 • Status: Operational</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-900 hover:bg-white dark:bg-[#121215] text-zinc-500 dark:text-zinc-400 hover:text-white border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
