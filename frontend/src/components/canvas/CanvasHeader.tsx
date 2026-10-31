import { 
  Clock, 
  ChevronDown, 
  ShieldCheck, 
  Play, 
  Pause, 
  Square,
  Sun,
  Moon,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export interface CanvasHeaderProps {
  isAutoSaving: boolean;
  workflowName: string;
  onWorkflowNameChange: (val: string) => void;
  currentFileName?: string | null;
  isRunning: boolean;
  selectedWorkflowId: string | null;
  isPropertiesInspectorOpen: boolean;
  currentUser: any;
  onOpenProfile: () => void;
  onOpenUserManagement: () => void;
  currentTime: string;
  selectedNodesCount: number;
  isSubRunning: boolean;
  onStartSubWorkFlowClick: () => void;
  isFullRunning: boolean;
  onStartWorkFlowClick: () => void;
  canEdit?: boolean;
  canExecute?: boolean;
}

export default function CanvasHeader({
  isAutoSaving,
  workflowName,
  onWorkflowNameChange,
  currentFileName,
  isRunning,
  selectedWorkflowId,
  isPropertiesInspectorOpen: _isPropertiesInspectorOpen,
  currentUser,
  onOpenProfile,
  onOpenUserManagement,
  currentTime,
  selectedNodesCount,
  isSubRunning,
  onStartSubWorkFlowClick,
  isFullRunning,
  onStartWorkFlowClick,
  canEdit = true,
  canExecute = true,
}: CanvasHeaderProps) {
  const { toggleTheme, isDark } = useTheme();
  const isWorkflowActive = isFullRunning || isRunning;

  return (
    <header className="absolute top-0 left-0 right-0 h-14 border-b border-zinc-200 dark:border-zinc-800/90 bg-white/90 dark:bg-[#121215]/90 backdrop-blur-md flex items-center justify-between px-4 z-20 select-none transition-colors duration-200">
      {/* Left: Brand & Contextual Breadcrumbs */}
      <div className="flex items-center space-x-3 min-w-0">
        {/* Brand Capsule */}
        <div className="flex items-center space-x-2 pr-3.5 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
            AI Builder <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">v3.0</span>
          </span>
        </div>

        {/* Breadcrumb Path & Editable Workflow Name */}
        <div className="flex items-center space-x-1.5 text-xs min-w-0">
          <span className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer hidden sm:inline">
            Pipelines
          </span>
          <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 hidden sm:inline shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400 font-medium hidden md:inline truncate max-w-[120px]">
            Workflows
          </span>
          <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 hidden md:inline shrink-0" />

          {/* Inline Editable Workflow Name */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => canEdit && onWorkflowNameChange(e.target.value)}
              disabled={!canEdit}
              style={{ width: `${Math.max(12, (workflowName || 'Workflow Name').length + 2)}ch` }}
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none py-1 px-2 rounded-md transition-all max-w-[240px] truncate"
              placeholder="Workflow Name"
              title={canEdit ? "Click to rename workflow" : "Workflow Name (Read-only)"}
            />
          </div>

          {currentFileName && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-mono select-none whitespace-nowrap hidden lg:inline">
              {currentFileName}
            </span>
          )}

          {selectedWorkflowId && (
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 hidden xl:inline" title={`Workflow ID: ${selectedWorkflowId}`}>
              ID: {selectedWorkflowId}
            </span>
          )}

          {/* Auto-save Status Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
              isAutoSaving
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
            title={isAutoSaving ? 'Saving changes to database...' : 'All changes auto-saved'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAutoSaving ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span>{isAutoSaving ? 'Saving...' : 'Saved'}</span>
          </span>

          {/* Workflow Status Badge */}
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider hidden sm:inline-flex items-center gap-1 ${
              isRunning
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {isRunning && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />}
            <span>{isRunning ? 'RUNNING' : 'IDLE'}</span>
          </span>
        </div>
      </div>

      {/* Right: Actions Bar (Controls, Run, RBAC, Clock, and Minimal ModeToggle) */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 text-xs font-mono font-medium">
          <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <span>{currentTime}</span>
        </div>

        {/* RBAC Admin Pill Button (for admins) */}
        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
          <button
            onClick={onOpenUserManagement}
            className="hidden md:flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="Manage Users & RBAC Permissions"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>RBAC</span>
          </button>
        )}

        {/* User Profile Pill */}
        <button
          onClick={onOpenProfile}
          className="flex items-center space-x-2 px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md transition-all cursor-pointer shadow-xs"
          title={`Logged in as ${currentUser?.username || 'user01'} (${currentUser?.role || 'user'})`}
        >
          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center uppercase shadow-xs">
            {(currentUser?.username || 'U1').substring(0, 2)}
          </div>
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 hidden lg:inline max-w-[80px] truncate">
            {currentUser?.username || 'user01'}
          </span>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>

        {/* Start / Stop Sub Work Flow (Visible when nodes selected or subflow running) */}
        {canExecute && (selectedNodesCount > 0 || isSubRunning) && (
          <button
            onClick={onStartSubWorkFlowClick}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-xs ${
              isSubRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
            title={isSubRunning ? 'Stop Sub Work Flow' : 'Start Sub Work Flow (รันเฉพาะ Node ที่เลือก)'}
          >
            {isSubRunning ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span className="hidden sm:inline">
              {isSubRunning ? 'Stop Sub' : `Run Sub (${selectedNodesCount})`}
            </span>
          </button>
        )}

        {/* Start / Pause Full Pipeline */}
        <button
          onClick={onStartWorkFlowClick}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-xs ${
            isWorkflowActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
          title={isWorkflowActive ? 'Pause Workflow' : 'Run Pipeline'}
        >
          {isWorkflowActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isWorkflowActive ? 'Pause' : 'Run Pipeline'}</span>
        </button>

        {/* 1px Vertical Divider */}
        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* Minimalist Theme Toggle Button (LiteLLM ModeToggle Style: Far Right) */}
        <button
          id="themeToggleBtn"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center transition-all shadow-xs relative group focus:outline-none cursor-pointer"
          title={isDark ? 'Switch to Light mode (Ctrl+J)' : 'Switch to Dark mode (Ctrl+J)'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-zinc-300 group-hover:text-amber-400 group-hover:rotate-45 transition-transform duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700 group-hover:text-indigo-600 group-hover:-rotate-12 transition-transform duration-200" />
          )}
        </button>
      </div>
    </header>
  );
}
