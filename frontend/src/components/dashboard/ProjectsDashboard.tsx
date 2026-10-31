import React from 'react';
import { 
  Sun,
  Moon,
  ArrowLeft, 
  CornerUpLeft, 
  Plus, 
  FolderPlus, 
  FolderOpen, 
  FolderKanban, 
  Play, 
  Square,
  Trash2, 
  ExternalLink, 
  Check,
  X
} from 'lucide-react';
import FolderCard, { getPaletteHex } from '../FolderCard';
import { getGroupTheme } from '../../constants/sidebarMenus';
import { useTheme } from '../../hooks/useTheme';
import {
  canCreateWorkflow,
  canCreateGroup,
  canDeleteWorkflow,
  canDeleteGroup,
  canMoveItems,
  canExecuteWorkflow,
  isReadOnlyUser
} from '../../utils/rbacPermissions';

export interface ProjectsDashboardProps {
  currentUser?: any;
  currentGroupId: string | null;
  setCurrentGroupId: (id: string | null) => void;
  groups: any[];
  processes: any[];
  selectedWorkflowIds: string[];
  setSelectedWorkflowIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedGroupIds: string[];
  setSelectedGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
  workflowGroupMap: Record<string, string | null>;
  workflowColorMap: Record<string, string>;
  marqueeBox: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  } | null;
  dragOverCrumbId: string | null | undefined;
  setDragOverCrumbId: (id: string | null) => void;
  dragOverGroupId: string | null | undefined;
  setDragOverGroupId: (id: string | null) => void;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
  handleBackGroup: () => void;
  handleContainerMouseDown: (e: React.MouseEvent) => void;
  handleDropWorkflowsOnFolder: (folderIdOrEvent: any, eventOrFolderId?: any) => void;
  handleGroupDragStart: (e: React.DragEvent, groupId: string) => void;
  handleGroupSelectToggle: (e: React.MouseEvent, groupId: string) => void;
  handleInspectProcess: (procId: string, tab: 'logic') => void;
  handleMoveToPreviousLayer: (id: string, type: 'workflow' | 'folder') => void;
  handleNewWorkflowClick: () => void;
  handlePlayProcess: (proc: any) => void;
  handleStopProcess: (proc: any) => void;
  handleWorkflowCardClick: (e: React.MouseEvent, wfId: string, index: number, allWfs: any[]) => void;
  handleWorkflowDragStart: (e: React.DragEvent, procId: string) => void;
  setGroupToDelete: (grp: any) => void;
  setMoveMenuState: (state: any) => void;
  setNewGroupDesc: (desc: string) => void;
  setNewGroupName: (name: string) => void;
  setProcessToDelete: (proc: any) => void;
  setShowCreateGroupModal: (show: boolean) => void;
}

export default function ProjectsDashboard({
  currentUser,
  currentGroupId,
  setCurrentGroupId,
  groups,
  processes,
  selectedWorkflowIds,
  setSelectedWorkflowIds,
  selectedGroupIds,
  setSelectedGroupIds,
  workflowGroupMap,
  workflowColorMap,
  marqueeBox,
  dragOverCrumbId,
  setDragOverCrumbId,
  dragOverGroupId,
  setDragOverGroupId,
  gridContainerRef,
  handleBackGroup,
  handleContainerMouseDown,
  handleDropWorkflowsOnFolder,
  handleGroupDragStart,
  handleGroupSelectToggle,
  handleInspectProcess,
  handleMoveToPreviousLayer,
  handleNewWorkflowClick,
  handlePlayProcess,
  handleStopProcess,
  handleWorkflowCardClick,
  handleWorkflowDragStart,
  setGroupToDelete,
  setMoveMenuState,
  setNewGroupDesc,
  setNewGroupName,
  setProcessToDelete,
  setShowCreateGroupModal,
}: ProjectsDashboardProps) {
  const { isDark, toggleTheme } = useTheme();
  const userCanCreateGroup = canCreateGroup(currentUser);
  const userCanCreateWorkflow = canCreateWorkflow(currentUser);
  const userCanMove = canMoveItems(currentUser);
  const userCanExecute = canExecuteWorkflow(currentUser);
  const isViewer = isReadOnlyUser(currentUser);
  return (
            <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-zinc-50 dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100">

              {/* Projects Page Top Action & Summary Bar */}

              <div className="px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md flex items-center justify-between select-none shrink-0 shadow-xs">

                <div className="flex items-center space-x-3">

                  {/* Back Button (Shown when inside a Group) */}

                  {currentGroupId !== null && (

                    <button

                      onClick={handleBackGroup}

                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs cursor-pointer shadow-xs transition-colors"

                      title="Back to Parent Group / Root (ย้อนกลับ)"

                    >

                      <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-300 group-hover:-translate-x-0.5 transition-transform" />

                      <span>Back</span>

                    </button>

                  )}



                  <div>

                    {/* Breadcrumbs Navigation */}

                    <div className="flex items-center space-x-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">

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
                                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 ring-2 ring-zinc-400 dark:ring-zinc-500 font-bold scale-105'
                                    : idx === crumbs.length - 1
                                    ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:underline'
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

                    <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-3 py-1 rounded-lg text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-xs animate-in fade-in duration-150">

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

                        className="flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-[11px] cursor-pointer shadow-xs"

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

                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                        title="ยกเลิกการเลือก (Deselect All)"

                      >

                        <X className="w-3.5 h-3.5" />

                      </button>

                    </div>

                  )}



                  <div className="flex items-center space-x-2 text-xs">

                    <span className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-md flex items-center space-x-1.5 font-medium text-[11px] shadow-xs">

                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />

                      <span className="text-zinc-800 dark:text-zinc-200 font-mono">{processes.filter(p => p.status === 'running').length} Running</span>

                    </span>

                    <span className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-md flex items-center space-x-1.5 font-medium text-[11px] text-zinc-500 dark:text-zinc-400 shadow-xs">

                      <span>{processes.length} Workflows</span>

                    </span>

                  </div>



                  <div className="w-[1px] h-5 bg-slate-200" />



                  {/* RBAC Role & Mode Badge */}
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider shrink-0 ${
                    isViewer
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : currentUser?.role === 'operator'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                  }`}
                  title={`Logged in as ${currentUser?.username || 'Guest'} (${currentUser?.role || 'user'})`}
                  >
                    {currentUser?.role ? `${currentUser.role.toUpperCase()} ${isViewer ? '• READ ONLY' : ''}` : 'GUEST'}
                  </span>

                  {/* Button 1: Create Group (RBAC Protected) */}
                  {userCanCreateGroup && (
                    <button
                      onClick={() => {
                        setNewGroupName('');
                        setNewGroupDesc('');
                        setShowCreateGroupModal(true);
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs cursor-pointer shadow-xs transition-colors"
                      title="Create New Group / Subgroup"
                    >
                      <FolderPlus className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
                      <span>Create Group</span>
                    </button>
                  )}

                  {/* Button 2: New Workflow (RBAC Protected) */}
                  {userCanCreateWorkflow && (
                    <button
                      onClick={() => {
                        handleNewWorkflowClick();
                      }}
                      className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                      title="Create New Workflow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Workflow</span>
                    </button>
                  )}

                  {/* 1px Vertical Divider */}
                  <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

                  {/* Theme Mode Toggle Button */}
                  <button
                    onClick={toggleTheme}
                    type="button"
                    aria-label="Toggle theme mode"
                    title={isDark ? 'Switch to Light Mode (Ctrl+J)' : 'Switch to Dark Mode (Ctrl+J)'}
                    className="w-8 h-8 rounded-md flex items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-400 rotate-0 scale-100 transition-all duration-300" />
                    ) : (
                      <Moon className="w-4 h-4 text-zinc-700 rotate-0 scale-100 transition-all duration-300" />
                    )}
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

                      <div className="flex flex-col items-center justify-center p-12 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 text-center space-y-4 max-w-md mx-auto mt-12 shadow-xs select-none">

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

                          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">

                            {currentGroupId ? 'This Group is Empty' : 'No Workflows or Groups Yet'}

                          </h3>

                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">

                            {currentGroupId

                              ? 'Organize workflows or create nested subgroups inside this folder.'

                              : 'Create a group folder or your first AI workflow pipeline.'}

                          </p>

                        </div>

                        {userCanCreateGroup || userCanCreateWorkflow ? (
                        <div className="flex items-center space-x-3 pt-2">
                          {userCanCreateGroup && (
                            <button
                              onClick={() => {
                                setNewGroupName('');
                                setNewGroupDesc('');
                                setShowCreateGroupModal(true);
                              }}
                              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs cursor-pointer shadow-xs transition-colors"
                            >
                              <FolderPlus className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
                              <span>Create Group</span>
                            </button>
                          )}
                          {userCanCreateWorkflow && (
                            <button
                              onClick={() => handleNewWorkflowClick()}
                              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                            >
                              <Plus className="w-4 h-4 stroke-[3]" />
                              <span>New Workflow</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="pt-2 text-xs text-zinc-400 dark:text-zinc-500 italic">
                          {isViewer ? 'Read-only access: Contact an Administrator or Builder to create workflows in this directory.' : 'Operator access: Workflow creation is restricted to Builders and Admins.'}
                        </div>
                      )}

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

                            onMove={userCanMove ? (e => {

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

                            }) : undefined}

                            onClick={() => {

                              setSelectedWorkflowIds([]);

                              setSelectedGroupIds([]);

                              setCurrentGroupId(grp.id);

                            }}

                            onDelete={canDeleteGroup(currentUser) ? () => setGroupToDelete(grp) : undefined}

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

                            className={`group rounded-xl bg-white dark:bg-[#121215] border transition-all duration-200 flex flex-col justify-between overflow-hidden h-[265px] cursor-pointer select-none shadow-xs ${
                              isSelected
                                ? "border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/10 dark:ring-zinc-100/20 shadow-md"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md"
                            }`} > {/*

                              isSelected

                                ? 'border-blue-600 ring-4 ring-blue-500/25 shadow-[0_4px_12px_-1px_rgba(30,60,110,0.12),0_9px_22px_-1px_rgba(26,106,255,0.35),0_14px_30px_1px_rgba(26,106,255,0.25)] -translate-y-1'

                                : 'border-slate-200/80 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/30'

                            }`}

                          >

                            {/* Blue Upper Section: Double-Layered Glassmorphic Border Frame */}

                            <div className="m-1.5 mb-0.5 p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-2xs relative select-none">

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
                                          ? 'bg-white text-zinc-900 ring-2 ring-white shadow-md'
                                          : 'bg-white/95 text-zinc-800 hover:ring-2 hover:ring-white/80'
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



                                  {userCanExecute && (
                                  <div className="flex items-center space-x-1">

                                    {isProcess ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStopProcess(proc.id);
                                        }}
                                        className="p-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer transition-all flex items-center justify-center"
                                        title="Active: กำลังทำงาน (คลิกเพื่อหยุด / Stop Workflow)"
                                      >
                                        <Square className="w-3 h-3 fill-current text-white" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePlayProcess(proc.id);
                                        }}
                                        className="p-1 rounded-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                                        title="Run Workflow (คลิกเพื่อเริ่มทำงาน)"
                                      >
                                        <Play className="w-3 h-3 fill-current text-zinc-900 dark:text-zinc-100" />
                                      </button>
                                    )}

                                  </div>
                                  )}

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

                            <div className="p-3 pt-1.5 bg-white dark:bg-[#121215] flex flex-col justify-end space-y-1.5 flex-1">

                              {/* Prominent Blue Open Button with Diffuse Shade / Soft Glow Aura */}

                              <button

                                onClick={(e) => {

                                  e.stopPropagation();

                                  handleInspectProcess(proc.id, 'logic');

                                }}

                                className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer select-none shadow-xs transition-colors"

                                title={`Open in Workflow Canvas (${nodeCount} Nodes, ${edgeCount} Edges)`}

                              >

                                <ExternalLink className="w-3.5 h-3.5 text-white dark:text-zinc-900" />

                                <span>Open</span>

                              </button>



                              {/* Card Footer: Move to Previous Layer Button & Secondary Actions (Move and Delete) */}

                              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs select-none">

                                {/* Left: Button to move out to previous layer (เหลือแค่ Icon ย้ายออก) */}

                                <button

                                  type="button"

                                  disabled={currentGroupId === null}

                                  onClick={(e) => {

                                    e.stopPropagation();

                                    handleMoveToPreviousLayer(proc.id, 'workflow');

                                  }}

                                  className={`p-1 rounded-md transition-all ${
                                    currentGroupId !== null
                                      ? 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shadow-xs hover:scale-105 active:scale-95'
                                      : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed opacity-40'
                                  }`}

                                  title={currentGroupId !== null ? 'ย้ายออกจากโฟลเดอร์นี้ ไป Layer ก่อนหน้า' : 'อยู่ที่หน้าหลัก (Root) แล้ว'}

                                >

                                  <CornerUpLeft className="w-3.5 h-3.5 stroke-[2.5]" />

                                </button>



                                <div className="flex items-center space-x-1 text-slate-400">

                                  <span className="text-[10px] font-mono text-slate-400 mr-0.5">

                                    {displayDate}

                                  </span>



                                  {/* Move to Group / Layer Button (Opens Drop Down - RBAC Protected) */}
                                  {userCanMove && (
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
                                      className="p-1 rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                      title="ย้าย Layer (เลือกโฟลเดอร์ปลายทาง)"
                                    >
                                      <FolderKanban className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete Workflow Button (RBAC Protected) */}
                                  {canDeleteWorkflow(currentUser, proc.owner_id) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setProcessToDelete(proc);
                                      }}
                                      className="p-1 rounded text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Delete Workflow"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

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
  );
}
