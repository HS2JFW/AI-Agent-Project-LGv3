import { 
  Clock, 
  ChevronDown, 
  ShieldCheck, 
  Play, 
  Pause, 
  Square 
} from 'lucide-react';

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
}

export default function CanvasHeader({
  isAutoSaving,
  workflowName,
  onWorkflowNameChange,
  currentFileName,
  isRunning,
  selectedWorkflowId,
  isPropertiesInspectorOpen,
  currentUser,
  onOpenProfile,
  onOpenUserManagement,
  currentTime,
  selectedNodesCount,
  isSubRunning,
  onStartSubWorkFlowClick,
  isFullRunning,
  onStartWorkFlowClick,
}: CanvasHeaderProps) {
  const isWorkflowActive = isFullRunning || isRunning;

  return (
    <>
      {/* Floating Workflow Info on Top-Left of Screen */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none flex items-center space-x-3.5 select-none">
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
              onChange={(e) => onWorkflowNameChange(e.target.value)}
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

      {/* Floating Execution Action Buttons on Top-Right of Screen */}
      {!isPropertiesInspectorOpen && (
        <div className="absolute top-5 right-6 z-20 pointer-events-auto flex items-center space-x-3 select-none">
          {/* User Profile Capsule Pill */}
          <div 
            onClick={onOpenProfile}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white/90 hover:bg-white backdrop-blur-md border border-slate-200/90 rounded-full shadow-[0_4px_16px_rgba(30,60,110,0.06)] select-none cursor-pointer transition-all"
            title={`Logged in as ${currentUser?.username || 'user01'} (${currentUser?.role || 'user'})`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white text-[10px] font-bold flex items-center justify-center shadow-sm uppercase">
              {(currentUser?.username || 'US').substring(0, 2)}
            </div>

            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-800">
                {currentUser?.full_name || currentUser?.username || 'user01'}
              </span>
              <span className="text-[9px] font-mono font-bold text-blue-600 uppercase">
                {currentUser?.role || 'superadmin'}
              </span>
            </div>

            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" title="Online" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* RBAC Admin Pill Button */}
          {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
            <button
              onClick={onOpenUserManagement}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 hover:from-cyan-500/20 hover:to-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-600 text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Manage Users & RBAC Permissions"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>RBAC Admin</span>
            </button>
          )}

          {/* Real-time Clock Capsule Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-full shadow-[0_4px_16px_rgba(30,60,110,0.06)] select-none text-slate-600 text-xs font-bold font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>{currentTime}</span>
          </div>

          {/* Start / Stop Sub Work Flow (Visible when nodes selected or subflow running) */}
          {(selectedNodesCount > 0 || isSubRunning) && (
            <button
              onClick={onStartSubWorkFlowClick}
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
                  : selectedNodesCount > 1
                  ? `Start Sub Work Flow (${selectedNodesCount})`
                  : 'Start Sub Work Flow'}
              </span>
            </button>
          )}

          {/* Start / Pause Work Flow (Full Run) */}
          <button
            onClick={onStartWorkFlowClick}
            className={`flex items-center space-x-2 px-5 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer select-none shadow-md border border-transparent ${
              isWorkflowActive
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_10px_rgba(16,185,129,0.45)] scale-102 animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-[0_4px_10px_rgba(26,106,255,0.35)] hover:scale-102 active:scale-95'
            }`}
            title={isWorkflowActive ? 'Pause Work Flow' : 'Start Work Flow'}
          >
            {isWorkflowActive ? (
              <Pause className="w-4 h-4 fill-white text-white" />
            ) : (
              <Play className="w-4 h-4 fill-white text-white" />
            )}
            <span>{isWorkflowActive ? 'Pause Work Flow' : 'Start Work Flow'}</span>
          </button>
        </div>
      )}
    </>
  );
}
