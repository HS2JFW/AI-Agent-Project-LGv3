import { Layers, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import RailFooter from './RailFooter';

export interface CanvasNavRailProps {
  activeTab: string;
  isSubflowModeActive: boolean;
  isMiniSidebar: boolean;
  onToggleMiniSidebar: () => void;
  nodes: any[];
  selectedProcessNodeIds: string[];
  onSelectAllNodes: () => void;
  onDeselectAllNodes: () => void;
  onToggleNodeSelect: (nodeId: string, currentChecked: boolean) => void;
  onReturnToDashboard: () => void;
  groupMenus: any[];
  hoveredGroup: string | null;
  onGroupMouseEnter: (groupId: string) => void;
  onGroupMouseLeave: () => void;
  currentUser: any;
  isUserManagementOpen: boolean;
  onOpenUserManagement: () => void;
  isUnifiedSettingsOpen: boolean;
  onOpenUnifiedSettings: () => void;
  onLogout: () => void;
}

export default function CanvasNavRail({
  activeTab,
  isSubflowModeActive,
  isMiniSidebar,
  onToggleMiniSidebar,
  nodes,
  selectedProcessNodeIds,
  onSelectAllNodes,
  onDeselectAllNodes,
  onToggleNodeSelect,
  onReturnToDashboard,
  groupMenus,
  hoveredGroup,
  onGroupMouseEnter,
  onGroupMouseLeave,
  currentUser,
  isUserManagementOpen,
  onOpenUserManagement,
  isUnifiedSettingsOpen,
  onOpenUnifiedSettings,
  onLogout,
}: CanvasNavRailProps) {
  if (activeTab !== 'logic') return null;

  return (
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
                onClick={onToggleMiniSidebar}
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
                      onClick={onSelectAllNodes}
                      className="text-[9px] text-cyber-neon hover:underline cursor-pointer"
                    >
                      All
                    </button>
                    <span className="text-[9px] text-cyber-muted">|</span>
                    <button
                      onClick={onDeselectAllNodes}
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
                          onChange={() => onToggleNodeSelect(n.id, isChecked)}
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
                      onClick={() => onToggleNodeSelect(n.id, isChecked)}
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
                onClick={onReturnToDashboard}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm hover:scale-105" 
                title="Return to Dashboard (กลับหน้า Dashboard)"
              >
                <Home className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Group Menu Icon List */}
            <div className="py-2.5 px-1.5 flex flex-col items-center space-y-2 overflow-y-auto overflow-x-hidden">
              {groupMenus.map((group) => {
                const isHovered = hoveredGroup === group.id;
                const IconComponent = group.icon;
                return (
                  <div
                    key={group.id}
                    onMouseEnter={() => onGroupMouseEnter(group.id)}
                    onMouseLeave={onGroupMouseLeave}
                    className="w-full flex justify-center"
                  >
                    <button
                      onClick={() => onGroupMouseEnter(group.id)}
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

          <RailFooter
            currentUser={currentUser}
            isUserManagementOpen={isUserManagementOpen}
            onOpenUserManagement={onOpenUserManagement}
            isUnifiedSettingsOpen={isUnifiedSettingsOpen}
            onOpenUnifiedSettings={onOpenUnifiedSettings}
            onLogout={onLogout}
            withTopBorder
          />
        </div>
      )}
    </aside>
  );
}

