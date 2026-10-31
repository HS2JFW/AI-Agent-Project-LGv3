import React from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  FolderPlus, 
  Folder, 
  Home, 
  Plus, 
  Check, 
  X 
} from 'lucide-react';
import FolderCard, { PALETTE_COLORS } from '../FolderCard';

export interface WorkflowManagementModalsProps {
  // Modal 1: Delete Workflow Confirmation
  processToDelete: any | null;
  setProcessToDelete: (proc: any | null) => void;
  handleDeleteProcess: (processId: string) => void;

  // Modal 2: Create Group Modal
  showCreateGroupModal: boolean;
  setShowCreateGroupModal: (show: boolean) => void;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  newGroupDesc: string;
  setNewGroupDesc: (desc: string) => void;
  newGroupColor: string;
  setNewGroupColor: (color: string) => void;
  currentGroupId: string | null;
  handleCreateGroup: () => void;

  // Modal 3: Move Items Menu Dropdown
  moveMenuState: any | null;
  setMoveMenuState: (state: any | null) => void;
  groups: any[];
  workflowGroupMap: Record<string, string | null>;
  executeMoveItems: (targetGroupId: string | null) => void;
  getPathHierarchyLayers: (targetGrpId: string | null, allGroups: any[]) => any[];

  // Modal 4: Delete Group Confirmation
  groupToDelete: any | null;
  setGroupToDelete: (group: any | null) => void;
  processes: any[];
  handleDeleteGroup: (groupId: string, deleteContainedWorkflows: boolean) => void;

  // Modal 5: Create Workflow Dialog
  showCreateWorkflowDialog: boolean;
  setShowCreateWorkflowDialog: (show: boolean) => void;
  newDialogWfName: string;
  setNewDialogWfName: (name: string) => void;
  newDialogWfDesc: string;
  setNewDialogWfDesc: (desc: string) => void;
  newDialogWfColor: string;
  setNewDialogWfColor: (color: string) => void;
  onCreateWorkflowSubmit: () => void;
}

export default function WorkflowManagementModals({
  processToDelete,
  setProcessToDelete,
  handleDeleteProcess,
  showCreateGroupModal,
  setShowCreateGroupModal,
  newGroupName,
  setNewGroupName,
  newGroupDesc,
  setNewGroupDesc,
  newGroupColor,
  setNewGroupColor,
  currentGroupId,
  handleCreateGroup,
  moveMenuState,
  setMoveMenuState,
  groups,
  workflowGroupMap,
  executeMoveItems,
  getPathHierarchyLayers,
  groupToDelete,
  setGroupToDelete,
  processes,
  handleDeleteGroup,
  showCreateWorkflowDialog,
  setShowCreateWorkflowDialog,
  newDialogWfName,
  setNewDialogWfName,
  newDialogWfDesc,
  setNewDialogWfDesc,
  newDialogWfColor,
  setNewDialogWfColor,
  onCreateWorkflowSubmit,
}: WorkflowManagementModalsProps) {
  return (
    <>
      {/* Modal 1: Delete Workflow Confirmation */}
      {processToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl p-6 max-w-md w-full mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide font-mono">
                  Confirm Deletion
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Permanent workflow process removal</p>
              </div>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-2 mb-6 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <p>
                Are you sure you want to delete workflow <span className="text-zinc-900 dark:text-zinc-100 font-bold">"{processToDelete.name}"</span>?
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                This will remove the workflow run records and associated configurations from the system database.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setProcessToDelete(null)}
                className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteProcess(processToDelete.id);
                  setProcessToDelete(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Create Group / Subgroup */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">Create New Group</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
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
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono">
                  Group Name <span className="text-red-500">*</span>
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono">
                  Description <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  rows={2}
                  placeholder="Group purpose or workflow category description..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-xs transition-colors resize-none"
                />
              </div>

              {/* Folder Color Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
                  Folder Color
                </label>
                <div className="flex items-center space-x-2">
                  {PALETTE_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewGroupColor(c.id)}
                      className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center transition-all cursor-pointer shadow-xs border border-zinc-200 dark:border-zinc-700 ${
                        newGroupColor === c.id ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {newGroupColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Interactive Folder Card Preview */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 select-none">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                    Live Folder Preview
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                    {PALETTE_COLORS.find(c => c.id === newGroupColor)?.label || 'Blue'} Theme
                  </span>
                </div>
                <div className="max-w-[280px] mx-auto py-1">
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
            <div className="px-6 py-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setNewGroupName('');
                  setNewGroupDesc('');
                }}
                className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Move Items Menu Dropdown */}
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
            <div
              className="fixed inset-0 z-[9998] cursor-default bg-transparent"
              onClick={() => setMoveMenuState(null)}
            />
            <div
              style={menuStyle}
              className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100 animate-in fade-in duration-100 select-none text-xs"
            >
              {hierarchyLayers.length > 0 ? (
                <div className="space-y-0.5 max-h-56 overflow-y-auto">
                  {hierarchyLayers.map((layer) => (
                    <button
                      key={layer.id === null ? '__ROOT__' : layer.id}
                      type="button"
                      onClick={() => executeMoveItems(layer.id)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      {layer.isRoot ? (
                        <Home className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      ) : (
                        <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      )}
                      <span className="text-xs truncate flex-1">{layer.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-2 px-3 text-center text-[11px] text-zinc-400 font-medium">
                  ไม่มี Layer ก่อนหน้า
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* Modal 4: Delete Group Confirmation */}
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

        const containedWfs = processes.filter(p => {
          const gId = workflowGroupMap[p.workflowId || p.id];
          return gId ? childGroupIds.has(gId) : false;
        });
        const hasContainedWfs = containedWfs.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-zinc-900 dark:text-zinc-100">
              <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-500 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-wide font-mono">Delete Folder</h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Confirm deletion of "{groupToDelete.name}"</p>
                  </div>
                </div>

                <button
                  onClick={() => setGroupToDelete(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Are you sure you want to delete folder <span className="font-bold text-zinc-900 dark:text-zinc-100">"{groupToDelete.name}"</span>?
                </p>

                {hasContainedWfs ? (
                  <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Contains {containedWfs.length} workflow(s):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {containedWfs.slice(0, 5).map((w, idx) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 font-medium text-zinc-800 dark:text-zinc-200">
                          {w.name || w.id}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                    This folder has no workflows inside. It will be removed immediately.
                  </div>
                )}
              </div>

              <div className="px-6 py-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setGroupToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                {hasContainedWfs && (
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(groupToDelete.id, false)}
                    className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer shadow-xs"
                  >
                    Delete Folder Only
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(groupToDelete.id, true)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Delete {hasContainedWfs ? 'All' : ''}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 5: Create Workflow Dialog */}
      {showCreateWorkflowDialog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">
                    Create New Workflow
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Define name, description, and accent color for the pipeline
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowCreateWorkflowDialog(false);
                  setNewDialogWfName('My AI Agent Workflow');
                  setNewDialogWfDesc('');
                }}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono">
                  Workflow Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDialogWfName}
                  onChange={(e) => setNewDialogWfName(e.target.value)}
                  placeholder="e.g. Enterprise Financial Audit Pipeline"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono">
                  Description <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={newDialogWfDesc}
                  onChange={(e) => setNewDialogWfDesc(e.target.value)}
                  placeholder="Describe the objective, tools, or data sources for this workflow..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-xs transition-colors resize-none"
                />
              </div>

              {/* Workflow Color Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
                  Workflow Color
                </label>
                <div className="flex items-center space-x-2">
                  {PALETTE_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewDialogWfColor(c.id)}
                      className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center transition-all cursor-pointer shadow-xs border border-zinc-200 dark:border-zinc-700 ${
                        newDialogWfColor === c.id ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {newDialogWfColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateWorkflowDialog(false);
                    setNewDialogWfName('My AI Agent Workflow');
                    setNewDialogWfDesc('');
                  }}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onCreateWorkflowSubmit}
                  className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs transition-colors cursor-pointer shadow-xs select-none"
                >
                  Create Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
