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



        const containedWfs = processes.filter(p => { const gId = workflowGroupMap[p.workflowId || p.id]; return gId ? childGroupIds.has(gId) : false; });

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

                          onClick={onCreateWorkflowSubmit}
                          className="btn-diffuse-blue px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer select-none"

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
