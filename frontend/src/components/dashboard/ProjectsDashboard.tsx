import React from 'react';
import { 
  ArrowLeft, 
  CornerUpLeft, 
  Plus, 
  FolderPlus, 
  FolderOpen, 
  FolderKanban, 
  Play, 
  Trash2, 
  ExternalLink, 
  Check,
  X
} from 'lucide-react';
import FolderCard, { getPaletteHex } from '../FolderCard';
import { getGroupTheme } from '../../constants/sidebarMenus';

export interface ProjectsDashboardProps {
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
  return (
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
  );
}
