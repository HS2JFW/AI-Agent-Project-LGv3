import React from 'react';
import { Trash2, FileText, Eye } from 'lucide-react';

export interface AgentNodeInspectorProps {
  selectedNode: any;
  setSelectedNode: React.Dispatch<React.SetStateAction<any>>;
  updateSelectedNodeData: (field: string, value: any) => void;
  updateSelectedNodeParameter: (field: string, value: any) => void;
  nodes: any[];
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  edges: any[];
  selectedWorkflowId: string | null;
  getNodeClass: (n?: any) => string;
  agentOutputsPage: number;
  setAgentOutputsPage: React.Dispatch<React.SetStateAction<number>>;
  serverAgentOutputsFiles: string[];
  setServerAgentOutputsFiles: React.Dispatch<React.SetStateAction<string[]>>;
  nodeLiveProgress: Record<string, {
    currentIndex?: number;
    currentPage?: number;
    totalPages?: number;
    percent?: number;
    status?: string;
    stepMessage?: string;
    filename?: string;
    updatedAt?: number;
  }>;
  setNodeLiveProgress: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  openDialog: (type: 'agent_result' | 'pdf_queue' | 'json' | 'zip_queue' | 'txt_queue', filename: string, rawContent?: string) => void;
  showAlert: (msg: string, title?: string, type?: 'info' | 'success' | 'error') => void;
  setIsFinalPromptModalOpen: (v: boolean) => void;
  setFinalPromptPreview: (v: string) => void;
  generateFinalPromptAsync: (nodeId: string) => Promise<string>;
  setIsFinalSendModalOpen: (v: boolean) => void;
  setFinalSendPayloadPreview: (v: string) => void;
  generateFinalPayloadAsync: (nodeId: string) => Promise<string>;
  isSelectedPdfExtractorNode: boolean;
  isSelectedDbNode: boolean;
  isSelectedGraphRagNode: boolean;
  isSelectedExtractNode: boolean;
  isSelectedDeDuplicateNode: boolean;
  isSelectedStructuredParseNode: boolean;
  isSelectedStateNode: boolean;
  isSelectedApiConnectorNode: boolean;
  isSelectedJsonConnectorNode: boolean;
  isSelectedJsonConnectorListNode: boolean;
  isSelectedPageNode: boolean;
  isSelectedStorageNode: boolean;
  isSelectedTimerNode: boolean;
  isSelectedPdfsLoaderNode: boolean;
  isSelectedPdfQueueNode: boolean;
  isSelectedTxtQueueNode: boolean;
  isSelectedZipQueueNode: boolean;
  isSelectedOcrPdfsNode: boolean;
  isSelectedMarkItDownNode: boolean;
  isSelectedPolarsConverterNode: boolean;
  isSelectedDuckDbNode: boolean;
  isSelectedBigDataAnalystNode: boolean;
  isSelectedBigDataContainerNode: boolean;
  aiModels: any[];
  agentNodes: any[];
  isRunning: boolean;
  backendUrl?: string;
}

export const AgentNodeInspector: React.FC<AgentNodeInspectorProps> = ({
  selectedNode,
  setSelectedNode,
  updateSelectedNodeData,
  updateSelectedNodeParameter,
  nodes,
  setNodes,
  edges,
  selectedWorkflowId,
  getNodeClass,
  agentOutputsPage,
  setAgentOutputsPage,
  serverAgentOutputsFiles,
  setServerAgentOutputsFiles,
  nodeLiveProgress,
  setNodeLiveProgress,
  openDialog,
  showAlert,
  setIsFinalPromptModalOpen,
  setFinalPromptPreview,
  generateFinalPromptAsync,
  setIsFinalSendModalOpen,
  setFinalSendPayloadPreview,
  generateFinalPayloadAsync,
  isSelectedPdfExtractorNode,
  isSelectedDbNode,
  isSelectedGraphRagNode,
  isSelectedExtractNode,
  isSelectedDeDuplicateNode,
  isSelectedStructuredParseNode,
  isSelectedStateNode,
  isSelectedApiConnectorNode,
  isSelectedJsonConnectorNode,
  isSelectedJsonConnectorListNode,
  isSelectedPageNode,
  isSelectedStorageNode,
  isSelectedTimerNode,
  isSelectedPdfsLoaderNode,
  isSelectedPdfQueueNode,
  isSelectedTxtQueueNode,
  isSelectedZipQueueNode,
  isSelectedOcrPdfsNode,
  isSelectedMarkItDownNode,
  isSelectedPolarsConverterNode,
  isSelectedDuckDbNode,
  isSelectedBigDataAnalystNode,
  isSelectedBigDataContainerNode,
  aiModels,
  agentNodes,
  isRunning,
  backendUrl,
}) => {
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

  return (
    <>
                {/* Node Role Input & LangChain/LangGraph/LangSmith Parameter Tuning Form (Specific to Agents) */}

                {(selectedNode.data.category === 'Agents' || selectedNode.data.category === 'Agent' || selectedNode.data.name?.toLowerCase().includes('agent') || selectedNode.type?.toLowerCase().includes('agent') || isSelectedPdfExtractorNode) && !isSelectedDbNode && !isSelectedGraphRagNode && !isSelectedExtractNode && !isSelectedDeDuplicateNode && !isSelectedStructuredParseNode && !isSelectedStateNode && (

                  <>

                    {!isSelectedPdfExtractorNode && (

                      <div className="space-y-4 pt-3 border-t border-cyber-border">

                      <h4 className="text-xs font-bold text-cyber-neon uppercase tracking-wider">

                        Gemini Agent Configuration

                      </h4>





                      {/* Agent Role */}

                      <div className="space-y-1.5">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Role:

                          </label>

                        </div>

                        <textarea

                          value={selectedNode.data.role !== undefined ? selectedNode.data.role : 'Agent Role'}

                          onChange={(e) => updateSelectedNodeData('role', e.target.value)}

                          rows={2}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono"

                          placeholder="Enter agent persona or role (e.g., Senior Financial Analyst)..."

                        />

                      </div>



                      {/* Agent Prompt Instructions */}

                      <div className="space-y-1.5">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Prompt:

                          </label>

                        </div>

                        <textarea

                          value={selectedNode.data.prompt || ''}

                          onChange={(e) => updateSelectedNodeData('prompt', e.target.value)}

                          rows={4}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono"

                          placeholder="Enter task prompt or specific instructions for this agent..."

                        />

                          <button
                            onClick={async () => {
                              setFinalPromptPreview(await generateFinalPromptAsync(selectedNode.id));
                              setIsFinalPromptModalOpen(true);
                            }}
                            className="w-full py-2 mt-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium rounded-lg shadow-xs transition-colors text-xs flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <span>Preview Final Prompt</span>
                          </button>

                          <button
                            onClick={async () => {
                              setFinalSendPayloadPreview(await generateFinalPayloadAsync(selectedNode.id));
                              setIsFinalSendModalOpen(true);
                            }}
                            className="w-full py-2 mt-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium rounded-lg shadow-xs transition-colors text-xs flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <span>Preview Final Send Payload</span>
                          </button>
                      </div>



                      {/* Model & Temp */}

                      <div className="space-y-3">

                        <div className="space-y-1.5">

                          <div className="flex flex-col space-y-0.5">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              AI Model Selection

                            </label>

                            <span className="text-[8px] text-cyber-neon italic">Shared Key via Models Tab</span>

                          </div>

                          <select

                            value={selectedNode.data.parameters?.modelName || 'gemini-2.5-flash'}

                            onChange={(e) => updateSelectedNodeParameter('modelName', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                          >

                            {aiModels.map((m) => (

                              <option key={m.id} value={m.modelName}>

                                {m.label || m.modelName} ({m.provider})

                              </option>

                            ))}

                          </select>

                        </div>

                        

                        {(getNodeClass(selectedNode) === 'AI Agent PDFs Loop' || getNodeClass(selectedNode) === 'AI Agent PDFs Chain') && (

                          <div className="space-y-1.5 mt-3">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              Expect Max Token

                            </label>

                            <input 

                              type="number"

                              value={selectedNode.data.parameters?.expectMaxToken || ''}

                              onChange={(e) => updateSelectedNodeParameter('expectMaxToken', e.target.value)}

                              className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                              placeholder="e.g. 100000"

                            />

                            <p className="text-[9px] text-cyber-muted italic mt-1">

                                Maximum expected tokens for the loop/chain processing.

                            </p>

                          </div>

                        )}



                      </div>

                      </div>

                    )}



                    {/* Agent DB Specific Parameters */}

                    {(getNodeClass(selectedNode) === 'Agent DB' || getNodeClass(selectedNode) === 'AI Agent DB') && (

                      <div className="pt-3 border-t border-cyber-border space-y-3">

                        <div>

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block mb-1">

                            Mode

                          </label>

                          <select

                            value={selectedNode.data.parameters?.mode || 'auto'}

                            onChange={(e) => updateSelectedNodeParameter('mode', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                          >

                            <option value="auto">Auto (Run query immediately)</option>

                            <option value="manual">Manual (Wait for button click)</option>

                          </select>

                        </div>

                        <div>

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block mb-1">

                            Connection String

                          </label>

                          <input

                            type="text"

                            value={selectedNode.data.parameters?.connectionString || ''}

                            onChange={(e) => updateSelectedNodeParameter('connectionString', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                            placeholder="e.g., sqlite://./database.db"

                          />

                        </div>

                        {selectedNode.data.parameters?.mode === 'manual' && (

                          <button

                            onClick={async () => {

                               try {

                                 const res = await fetch(`${BACKEND_URL}/api/workflows/${selectedWorkflowId || 'wf'}/node/${selectedNode.id}/run_query_loop`, {

                                    method: 'POST'

                                 });

                                 if (res.ok) {

                                   showAlert('Query loop started successfully.', 'Success', 'success');

                                 } else {

                                   const data = await res.json();

                                   showAlert('Failed to start query loop: ' + (data.error || res.statusText), 'Error', 'error');

                                 }

                               } catch (err: any) {

                                 showAlert('Error calling run query loop: ' + err.message, 'Error', 'error');

                               }

                            }}

                            className="w-full mt-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs py-2 px-3 rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"

                          >

                            <span>Run Query Loop()</span>

                          </button>

                        )}

                      </div>

                    )}



                                      </>

                )}



                {/* Agent Output / Table Display Section */}

                    {(() => {

                        if (getNodeClass(selectedNode).toLowerCase().includes('queue')) return null;

                          const isAgentPdfsNode = !isSelectedJsonConnectorListNode && !getNodeClass(selectedNode).toLowerCase().includes('queue') && (getNodeClass(selectedNode) === 'Agent' || getNodeClass(selectedNode) === 'Agent DB' || getNodeClass(selectedNode) === 'Agent Audit' || getNodeClass(selectedNode) === 'PDF to Image Agent' || getNodeClass(selectedNode) === 'PDF to Base64 Agent' || getNodeClass(selectedNode) === 'AI Agent API PDFs' || getNodeClass(selectedNode) === 'AI Agent PDFs' || getNodeClass(selectedNode) === 'AI Agent DB' || getNodeClass(selectedNode) === 'AI Agent Zip' || getNodeClass(selectedNode) === 'AI Agent PDFs Audit' || getNodeClass(selectedNode) === 'AI Agent PDFs Loop' || getNodeClass(selectedNode) === 'AI Agent PDFs Chain' || getNodeClass(selectedNode) === 'AI Agent PDFs Base64' || getNodeClass(selectedNode) === 'AI Agent PDFs Raw' || getNodeClass(selectedNode) === 'AI Agent PDFs Image' || getNodeClass(selectedNode).includes('PDF') || selectedNode.data.type === 'AgentAPIPDFsNode' || selectedNode.data.type === 'AgentPDFsNode' || selectedNode.data.type === 'AgentZipNode' || selectedNode.data.type === 'AgentPDFsAuditNode' || selectedNode.data.type === 'AgentPDFsBase64Node' || selectedNode.data.type === 'AgentPDFsRawNode' || selectedNode.data.type === 'AgentPDFsImageNode' || selectedNode.data.type === 'OCRPDFsNode' || getNodeClass(selectedNode) === 'OCR PDFs' || (selectedNode.data.parameters && ('agentOutputsTable' in selectedNode.data.parameters || 'pdfUrls' in selectedNode.data.parameters)));

                        const rawOutputs = selectedNode.data.parameters?.agentOutputsTable || selectedNode.data.parameters?.agentResultQueue || selectedNode.data.parameters?.agentOutputs;

                        const completedOutputsMap: Record<string, string> = {};

                        if (rawOutputs && typeof rawOutputs === 'object' && !Array.isArray(rawOutputs)) {

                            Object.entries(rawOutputs).forEach(([k, v]) => {

                                completedOutputsMap[k] = String(v);

                            });

                        } else if (Array.isArray(rawOutputs)) {

                            rawOutputs.forEach((v, i) => {

                                completedOutputsMap[String(i + 1)] = String(v);

                            });

                        }



                        if (serverAgentOutputsFiles && serverAgentOutputsFiles.length > 0) {

                            const cleanNodeId = selectedNode.id.replace('node_', '');

                            const nodeFiles = serverAgentOutputsFiles.filter(f => f.startsWith(`${cleanNodeId}_`));

                            nodeFiles.forEach(nf => {

                                const match = nf.match(/^([^_]+)_(\d+)_/);

                                const k = match ? match[2] : '';

                                if (k && !completedOutputsMap[k]) {

                                    completedOutputsMap[k] = nf;

                                }

                            });

                        }



                        // Collect parent queue files from incoming edges or node parameters

                        const incomingParentEdgesForQueue = edges.filter(e => e.target === selectedNode.id);

                        const parentQueueMap: Record<string, { name: string, originalItem: any }> = {};

                        incomingParentEdgesForQueue.forEach(e => {

                            const pNode = nodes.find(n => n.id === e.source) || agentNodes.find(n => n.id === e.source);

                            if (pNode && pNode.data && pNode.data.parameters) {

                                const pParams = pNode.data.parameters;

                                const q = pParams.pdfQueue || pParams.txtQueue || pParams.table || pParams.agentOutputsTable;

                                if (Array.isArray(q)) {

                                    q.forEach((item, idx) => {

                                        const key = String(idx + 1);

                                        const name = typeof item === 'string' ? item : (item?.disk_name || item?.filename || item?.name || `Item ${key}`);

                                        if (!parentQueueMap[key]) parentQueueMap[key] = { name, originalItem: item };

                                    });

                                } else if (typeof q === 'object' && q !== null) {

                                    Object.entries(q).forEach(([k, item]) => {

                                        const key = String(k);

                                        const name = typeof item === 'string' ? (item as string) : ((item as any)?.disk_name || (item as any)?.filename || (item as any)?.name || `Item ${key}`);

                                        if (!parentQueueMap[key]) parentQueueMap[key] = { name, originalItem: item };

                                    });

                                }

                            }

                        });



                        if (Array.isArray(selectedNode.data.parameters?.pdfQueue)) {

                            selectedNode.data.parameters.pdfQueue.forEach((item: any, idx: number) => {

                                const key = String(idx + 1);

                                const name = typeof item === 'string' ? item : (item?.disk_name || item?.filename || item?.name || `Item ${key}`);

                                if (!parentQueueMap[key]) parentQueueMap[key] = { name, originalItem: item };

                            });

                        }



                        const allRowKeys = new Set<string>();

                        Object.keys(completedOutputsMap).forEach(k => allRowKeys.add(k));

                        Object.keys(parentQueueMap).forEach(k => allRowKeys.add(k));

                        const expectedLen = Number(selectedNode.data.parameters?.queueLength) || 0;

                        for (let i = 1; i <= expectedLen; i++) {

                            allRowKeys.add(String(i));

                        }



                        const sortedRowKeys = Array.from(allRowKeys).sort((a, b) => parseInt(a) - parseInt(b));

                        const agentOutputsList: Array<{

                            key: string;

                            fileName: string;

                            originalPdfName?: string;

                            isCompleted: boolean;

                        }> = sortedRowKeys.map(k => {

                            const completedFile = completedOutputsMap[k];

                            const parentItem = parentQueueMap[k];

                            return {

                                key: k,

                                fileName: completedFile || parentItem?.name || `Row ${k}`,

                                originalPdfName: parentItem?.name || undefined,

                                isCompleted: Boolean(completedFile)

                            };

                        });

                        

                        const handleClearAllAgentOutputs = async () => {

                          const incomingParentEdges = edges.filter(e => e.target === selectedNode.id);

                          const syncedMaxList: Record<string, number> = {};

                          for (const edge of incomingParentEdges) {

                            const pNode = nodes.find(n => n.id === edge.source);

                            if (pNode && pNode.data && pNode.data.parameters) {

                              const pParams = pNode.data.parameters;

                              let count = pParams.queueLength;

                              if (count === undefined || count === null) {

                                if (Array.isArray(pParams.pdfQueue)) count = pParams.pdfQueue.length;

                                else if (typeof pParams.pdfQueue === 'object' && pParams.pdfQueue !== null) count = Object.keys(pParams.pdfQueue).length;

                                else count = pParams.previous_max || 0;

                              }

                              const parentKey = (edge.sourceHandle && edge.sourceHandle !== "output" && edge.sourceHandle !== "bottom-source")

                                ? `${edge.source}_${edge.sourceHandle}`

                                : edge.source;

                              syncedMaxList[parentKey] = Number(count) || 0;

                            }

                          }

                          const syncedQueueLength = Object.values(syncedMaxList).length > 0 ? Math.max(...Object.values(syncedMaxList)) : 0;



                          const clearedParams = {

                            ...(selectedNode.data.parameters || {}),

                            agentOutput: '',

                            agentOutputsTable: {},

                            agentResultQueue: [],

                            agentOutputs: [],

                            agentOutputStatusesMap: {},

                            currentJsonFile: '',

                            currentIndex: 0,

                            hasNext: false,

                            queueLength: syncedQueueLength,

                            previous_max: 0,

                            previousMaxList: syncedMaxList

                          };

                          updateSelectedNodeData('parameters', clearedParams);

                          setServerAgentOutputsFiles([]);

                          setNodeLiveProgress(prev => ({

                            ...prev,

                            [selectedNode.id]: { status: 'idle', percent: 0, currentIndex: 0, currentPage: 0, totalPages: 0 }

                          }));

                          try {

                            const stringFilenames = Object.values(completedOutputsMap).filter(Boolean);

                            const res = await fetch(`${BACKEND_URL}/api/clear-agent-results`, {

                              method: 'POST',

                              headers: { 'Content-Type': 'application/json' },

                              body: JSON.stringify({

                                node_id: selectedNode.id,

                                filenames: stringFilenames,

                                workflow_id: selectedWorkflowId || 'wf_default'

                              })

                            });

                            const data = await res.json();

                            if (data.status === 'success') {

                              showAlert(data.message || 'ลบไฟล์และข้อมูลผลลัพธ์ทั้งหมดสำเร็จแล้ว', 'Clear Success', 'success');

                            } else {

                              showAlert('ลบตารางผลลัพธ์สำเร็จ แต่การลบไฟล์ที่ Backend มีข้อความแจ้ง: ' + data.message, 'Clear Info', 'info');

                            }

                          } catch (err) {

                            showAlert('ลบข้อมูลบนตารางสำเร็จ (ไม่สามารถเชื่อมต่อลบไฟล์ที่ Backend Server ได้)', 'Clear Warning', 'info');

                          }

                        };



                        return (

                          <div className="pt-3 border-t border-cyber-border space-y-3">

                            {isAgentPdfsNode ? (

                              <div className="space-y-2.5">

                                {/* Real-time Analysis Progress Banner */}

                                {(() => {

                                  const live = nodeLiveProgress[selectedNode.id];

                                  const isNodeActive = (live && (live.status === 'Active' || (isRunning && (live.percent || 0) > 0 && (live.percent || 0) < 100)));

                                  if (!isNodeActive) return null;



                                  return (

                                    <div className="p-3 bg-cyan-950/40 border border-cyber-neon/40 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.15)] space-y-2 transition-all">

                                      <div className="flex items-center justify-between">

                                        <div className="flex items-center gap-2">

                                          <span className="relative flex h-2 w-2">

                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-neon opacity-75"></span>

                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-neon"></span>

                                          </span>

                                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyber-neon">

                                            Analyzing Data {live.currentIndex ? `• Row #${live.currentIndex}` : ''}

                                            {live.currentPage && live.totalPages ? ` (Page ${live.currentPage}/${live.totalPages})` : ''}

                                          </span>

                                        </div>

                                        <span className="font-mono text-xs font-black text-cyber-neon tracking-wider">

                                          {live.percent || 0}%

                                        </span>

                                      </div>

                                      

                                      <div className="w-full h-2.5 bg-cyber-dark rounded-full overflow-hidden border border-cyber-border/70 p-0.5 shadow-inner">

                                        <div 

                                          className="h-full rounded-full bg-gradient-to-r from-cyber-neon via-emerald-400 to-cyber-neon bg-[length:200%_100%] animate-pulse transition-all duration-300"

                                          style={{ width: `${Math.max(5, Math.min(100, live.percent || 0))}%` }}

                                        />

                                      </div>



                                      {live.stepMessage && (

                                        <div className="text-[10px] text-cyber-muted font-medium flex items-center justify-between truncate pt-0.5">

                                          <span className="truncate">{live.stepMessage}</span>

                                          {live.filename && (

                                            <span className="font-mono text-[9px] text-cyber-muted/70 ml-2 shrink-0">{live.filename}</span>

                                          )}

                                        </div>

                                      )}

                                    </div>

                                  );

                                })()}



                                <div className="flex items-center justify-between">

                                  <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block flex-1">

                                    Agent Output Table ({agentOutputsList.length})

                                    {selectedNode.data.parameters?.currentIndex !== undefined && (

                                      <span className="text-cyber-neon ml-2 normal-case font-medium">

                                        (Processed: {selectedNode.data.parameters.currentIndex} / {selectedNode.data.parameters.queueLength || '?'})

                                      </span>

                                    )}

                                  </label>

                                  {!isSelectedJsonConnectorListNode && (

                                    <button

                                      type="button"

                                      onClick={handleClearAllAgentOutputs}

                                      className="text-[10px] font-mono border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-xs"

                                      title="Clear all text result files from Table & delete files on Backend server"

                                    >

                                      <Trash2 className="w-2.5 h-2.5" /> Clear

                                    </button>

                                  )}

                                </div>

                                <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                                  <table className="w-full text-left border-collapse">

                                    <thead>

                                      <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted">

                                        <th className="py-2 px-3 text-center w-14"></th>

                                        <th className="py-2 px-3 text-center w-12">ID</th>

                                        <th className="py-2 px-3">Text File Name</th>

                                        <th className="py-2 px-3 text-center w-36">Progress</th>

                                        <th className="py-2 px-3 text-center w-20">Status</th>

                                      </tr>

                                    </thead>

                                    <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                      {agentOutputsList.length === 0 ? (

                                        <tr>

                                          <td colSpan={5} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                            No text output files yet. Execute workflow to generate analysis.

                                          </td>

                                        </tr>

                                      ) : (

                                        (() => {

                                          const PAGE_SIZE = 10;

                                          const totalAgentPages = Math.ceil(agentOutputsList.length / PAGE_SIZE) || 1;

                                          const currentAgentOutputsPage = Math.min(agentOutputsPage, totalAgentPages);

                                          const agentStartIdx = (currentAgentOutputsPage - 1) * PAGE_SIZE;

                                          const paginatedAgentOutputsList = agentOutputsList.slice(agentStartIdx, agentStartIdx + PAGE_SIZE);



                                          const rawPdfUrls = selectedNode.data.parameters?.pdfUrls;

                                          let pdfList = [];

                                          if (typeof rawPdfUrls === 'string') {

                                            if (rawPdfUrls.trim().startsWith('[') && rawPdfUrls.trim().endsWith(']')) {

                                              try { pdfList = JSON.parse(rawPdfUrls); } catch(e) {}

                                            } else {

                                              pdfList = rawPdfUrls.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

                                            }

                                          } else if (Array.isArray(rawPdfUrls)) {

                                            pdfList = rawPdfUrls;

                                          }



                                          const liveProg = nodeLiveProgress[selectedNode.id];

                                          const activeIndex = (liveProg && (liveProg.status === 'Active' || isRunning)) ? Number(liveProg.currentIndex) : null;



                                          return paginatedAgentOutputsList.map((item, pageIdx) => { 

                                            const { key, fileName, originalPdfName, isCompleted } = item;

                                            const globalIdx = agentStartIdx + pageIdx;

                                            const pdfFileName = originalPdfName || pdfList[globalIdx] || null;

                                            const cleanFileName = fileName.split('/').pop() || fileName;

                                            const storedStatusesMap = selectedNode.data.parameters?.agentOutputStatusesMap || {};



                                            let rowStatus = 'Queue';

                                            let rowPercent = 0;

                                            let progressText = '0%';



                                            if (isCompleted) {

                                              rowStatus = 'Complete';

                                              rowPercent = 100;

                                              progressText = '100%';

                                            } else if (activeIndex !== null && Number(key) === activeIndex) {

                                              rowStatus = 'Active';

                                              rowPercent = typeof liveProg?.percent === 'number' ? liveProg.percent : 10;

                                              const pageStr = liveProg?.currentPage && liveProg?.totalPages ? ` (${liveProg.currentPage}/${liveProg.totalPages})` : '';

                                              progressText = `${rowPercent}%${pageStr}`;

                                            } else if (Number(key) <= (selectedNode.data.parameters?.currentIndex || 0) && (selectedNode.data.parameters?.currentIndex > 0)) {

                                              rowStatus = 'Complete';

                                              rowPercent = 100;

                                              progressText = '100%';

                                            } else {

                                              rowStatus = storedStatusesMap[fileName] || 'Queue';

                                              rowPercent = rowStatus === 'Complete' ? 100 : 0;

                                              progressText = `${rowPercent}%`;

                                            }



                                            const isSelected = selectedNode.data.parameters?.selectedAgentOutputRow === globalIdx;

                                            return (

                                              <tr 

                                                key={globalIdx} 

                                                onClick={async () => {

                                                  if (isSelectedJsonConnectorListNode) {

                                                    const safeUpdateParams = (updates: any) => {

                                                      setNodes((nds) => nds.map((n) => {

                                                        if (n.id === selectedNode.id) {

                                                          return { ...n, data: { ...n.data, parameters: { ...(n.data.parameters || {}), ...updates } } };

                                                        }

                                                        return n;

                                                      }));

                                                      setSelectedNode((prev: any) => {

                                                        if (!prev || prev.id !== selectedNode.id) return prev;

                                                        return { ...prev, data: { ...prev.data, parameters: { ...(prev.data.parameters || {}), ...updates } } };

                                                      });

                                                    };



                                                    if (isSelected) {

                                                      safeUpdateParams({ selectedAgentOutputRow: undefined, selectedRowContent: undefined });

                                                    } else {

                                                      safeUpdateParams({ selectedAgentOutputRow: globalIdx, selectedRowContent: 'Loading...' });

                                                      try {

                                                        const title = fileName.split('/').pop()?.split('?')[0] || fileName;

                                                        const wfParam = encodeURIComponent(selectedWorkflowId || 'wf_default');

                                                        const url = `${BACKEND_URL}/api/agent-result/${encodeURIComponent(title)}?workflow_id=${wfParam}`;

                                                        const res = await fetch(url);

                                                        if (res.ok) {

                                                           const text = await res.text();

                                                           safeUpdateParams({ selectedRowContent: text });

                                                        } else {

                                                           safeUpdateParams({ selectedRowContent: `Error loading file: ${res.statusText}` });

                                                        }

                                                      } catch (err) {

                                                         safeUpdateParams({ selectedRowContent: `Error: ${String(err)}` });

                                                      }

                                                    }

                                                  }

                                                }}

                                                className={`transition-all ${isSelectedJsonConnectorListNode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-yellow-400 border-l-4 border-l-yellow-600 text-black font-semibold' : 'hover:bg-cyber-light hover:bg-opacity-10 text-cyber-text'}`}

                                              >

                                                <td className="py-2 px-3 text-center">

                                                  <div className="flex items-center justify-center gap-1.5">

                                                    {pdfFileName && (

                                                      <button

                                                        type="button"

                                                        onClick={() => openDialog('pdf_queue', pdfFileName)}

                                                        className="text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded transition-colors inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs"

                                                        title="View original PDF file"

                                                      >

                                                        <FileText className="w-2.5 h-2.5" /> PDF

                                                      </button>

                                                    )}

                                                    {isCompleted && (

                                                      <button

                                                        type="button"

                                                        onClick={() => openDialog('agent_result', fileName)}

                                                        className="text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded transition-colors inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs"

                                                        title="View text analysis file in new browser tab"

                                                      >

                                                        <Eye className="w-2.5 h-2.5" />

                                                      </button>

                                                    )}

                                                  </div>

                                                </td>

                                                <td className={`py-2 px-3 text-center font-mono font-bold text-[10px] ${isSelected ? 'text-black' : 'text-cyber-muted'}`}>{key}</td>

                                                <td className={`py-2 px-3 font-mono truncate max-w-[170px] ${isSelected ? 'text-black font-bold' : ''}`} title={cleanFileName}>

                                                  <div className="flex items-center gap-1.5">

                                                    <span>{cleanFileName}</span>

                                                  </div>

                                                </td>

                                                <td className="py-2 px-3 text-center min-w-[130px]">

                                                  <div className="flex flex-col items-center justify-center gap-1">

                                                    <div className="w-full h-2 bg-cyber-dark rounded-full overflow-hidden border border-cyber-border p-0.5 shadow-inner">

                                                      <div 

                                                        className={`h-full rounded-full transition-all duration-300 ${

                                                          rowStatus === 'Active' 

                                                            ? 'bg-gradient-to-r from-cyber-neon to-emerald-400 animate-pulse' 

                                                            : rowStatus === 'Complete' 

                                                              ? 'bg-emerald-500' 

                                                              : 'bg-cyber-muted bg-opacity-20'

                                                        }`}

                                                        style={{ width: `${Math.max(rowStatus === 'Active' ? 5 : 0, Math.min(100, rowPercent))}%` }}

                                                      />

                                                    </div>

                                                    <span className={`text-[9px] font-mono font-bold leading-none ${

                                                      rowStatus === 'Active' 

                                                        ? 'text-cyber-neon' 

                                                        : rowStatus === 'Complete' 

                                                          ? 'text-emerald-400' 

                                                          : 'text-cyber-muted'

                                                    }`}>

                                                      {progressText}

                                                    </span>

                                                  </div>

                                                </td>

                                                <td className="py-2 px-3 text-center">

                                                  {rowStatus === 'Queue' ? (

                                                    <span className="inline-block text-[8px] px-1.5 py-0.5 rounded border bg-amber-950 text-amber-300 border-amber-700 font-mono animate-pulse">

                                                      Queue

                                                    </span>

                                                  ) : rowStatus === 'Active' ? (

                                                    <span className="inline-block text-[8px] px-1.5 py-0.5 rounded border bg-blue-950 text-blue-300 border-blue-700 font-mono animate-pulse">

                                                      Active

                                                    </span>

                                                  ) : (

                                                    <span className="inline-block text-[8px] px-1.5 py-0.5 rounded border bg-emerald-950 text-emerald-300 border-emerald-700 font-mono">

                                                      Complete

                                                    </span>

                                                  )}

                                                </td>

                                              </tr>

                                            );

                                          });

                                        })()

                                      )}

                                    </tbody>

                                  </table>

                                </div>



                                {/* Agent Output Table Pagination Controls */}

                                {(() => {

                                  const PAGE_SIZE = 10;

                                  const totalAgentPages = Math.ceil(agentOutputsList.length / PAGE_SIZE) || 1;

                                  const currentAgentOutputsPage = Math.min(agentOutputsPage, totalAgentPages);



                                  if (totalAgentPages <= 1) return null;

                                  return (

                                    <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-cyber-muted select-none">

                                      <span className="font-mono">

                                        Page {currentAgentOutputsPage} / {totalAgentPages}

                                      </span>

                                      <div className="flex items-center gap-1">

                                        <button

                                          type="button"

                                          disabled={currentAgentOutputsPage === 1}

                                          onClick={() => setAgentOutputsPage(1)}

                                          className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                            currentAgentOutputsPage === 1

                                              ? 'opacity-30 cursor-not-allowed'

                                              : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                          }`}

                                          title="First Page"

                                        >

                                          &lt;&lt;

                                        </button>

                                        <button

                                          type="button"

                                          disabled={currentAgentOutputsPage === 1}

                                          onClick={() => setAgentOutputsPage(prev => Math.max(1, prev - 1))}

                                          className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                            currentAgentOutputsPage === 1

                                              ? 'opacity-30 cursor-not-allowed'

                                              : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                          }`}

                                          title="Previous Page"

                                        >

                                          &lt;

                                        </button>

                                        {(() => {

                                          const pages = [];

                                          const maxPagesToShow = 5;

                                          let startPage = Math.max(1, currentAgentOutputsPage - Math.floor(maxPagesToShow / 2));

                                          let endPage = Math.min(totalAgentPages, startPage + maxPagesToShow - 1);

                                          if (endPage - startPage + 1 < maxPagesToShow) {

                                            startPage = Math.max(1, endPage - maxPagesToShow + 1);

                                          }

                                          for (let p = startPage; p <= endPage; p++) {

                                            pages.push(

                                              <button

                                                key={p}

                                                type="button"

                                                onClick={() => setAgentOutputsPage(p)}

                                                className={`px-1.5 py-0.5 rounded border text-[8px] font-mono transition-colors cursor-pointer ${

                                                  currentAgentOutputsPage === p

                                                    ? 'bg-cyber-neon border-cyber-neon text-black font-extrabold shadow-[0_0_6px_rgba(0,243,255,0.35)]'

                                                    : 'border-cyber-border text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                                }`}

                                              >

                                                {p}

                                              </button>

                                            );

                                          }

                                          return pages;

                                        })()}

                                        <button

                                          type="button"

                                          disabled={currentAgentOutputsPage === totalAgentPages}

                                          onClick={() => setAgentOutputsPage(prev => Math.min(totalAgentPages, prev + 1))}

                                          className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                            currentAgentOutputsPage === totalAgentPages

                                              ? 'opacity-30 cursor-not-allowed'

                                              : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                          }`}

                                          title="Next Page"

                                        >

                                          &gt;

                                        </button>

                                        <button

                                          type="button"

                                          disabled={currentAgentOutputsPage === totalAgentPages}

                                          onClick={() => setAgentOutputsPage(totalAgentPages)}

                                          className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                            currentAgentOutputsPage === totalAgentPages

                                              ? 'opacity-30 cursor-not-allowed'

                                              : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                          }`}

                                          title="Last Page"

                                        >

                                          &gt;&gt;

                                        </button>

                                      </div>

                                    </div>

                                  );

                                })()}

                                



                              </div>

                            ) : (

                              <>

                                {!isSelectedJsonConnectorListNode && (

                                  <>

                                    <div className="flex items-center justify-between">

                                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                                        Agent Output

                                      </label>

                                      {selectedNode.data.parameters?.agentOutput && (

                                        <button

                                          onClick={() => updateSelectedNodeParameter('agentOutput', '')}

                                          className="text-[9px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"

                                        >

                                          Clear

                                        </button>

                                      )}

                                    </div>

                                    <textarea

                                      readOnly

                                      value={selectedNode.data.parameters?.agentOutput || ''}

                                      rows={5}

                                      className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                                      placeholder="Agent output will be populated on execution..."

                                    />

                                  </>

                                )}

                              </>

                            )}

                            {isAgentPdfsNode && (

                              <div className="pt-3 border-t border-cyber-border space-y-2 mt-3">

                                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-cyber-muted font-bold select-none">

                                  <span>Queue Tracking</span>

                                  <span className="text-cyber-neon font-mono">Index: {selectedNode.data.parameters?.currentIndex ?? '-'}</span>

                                </div>

                                <div className="flex flex-col space-y-1.5">

                                  {selectedNode.data.parameters?.previousMaxList && Object.keys(selectedNode.data.parameters.previousMaxList).length > 0 ? (

                                    (() => {

                                      const dedupMap: Record<string, number> = {};

                                      Object.entries(selectedNode.data.parameters.previousMaxList).forEach(([pid, val]) => {

                                        const normKey = pid.replace(/_output$/, '');

                                        const numVal = Number(val) || 0;

                                        if (dedupMap[normKey] === undefined || !pid.endsWith('_output')) {

                                          dedupMap[normKey] = numVal;

                                        }

                                      });



                                      return Object.entries(dedupMap).map(([pid, maxVal]) => {

                                        const parentNode = nodes.find(n => n.id === pid);

                                        const parentLabel = parentNode ? (parentNode.data?.label || parentNode.data?.name || pid.replace('node_', '')) : pid.replace('node_', '');

                                        return (

                                          <div key={pid} className="flex items-center justify-between py-1 px-2 bg-cyber-dark bg-opacity-40 rounded border border-cyber-border border-opacity-35">

                                            <span className="text-[10px] text-cyber-muted truncate flex-1 font-mono" title={`ID: ${pid}`}>Parent: {parentLabel}</span>

                                            <span className="text-xs font-mono font-bold text-emerald-400 ml-2">Max: {String(maxVal)}</span>

                                          </div>

                                        );

                                      });

                                    })()

                                  ) : (

                                    <div className="text-[10px] text-cyber-muted italic px-1">No parent queue data available</div>

                                  )}

                                </div>

                              </div>

                            )}



                          </div>

                        );

                      })()}



                {/* Prompt instructions (specific to Models only, since Agents has its own restructured view) */}

                {selectedNode.data.category === 'Models' && !isSelectedDbNode && (

                  <div className="space-y-1.5">

                    <div className="flex items-center justify-between">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Role:

                      </label>

                      <span className="text-[9px] text-cyber-neon font-semibold cursor-pointer">

                        Set Template

                      </span>

                    </div>

                    <textarea

                      value={selectedNode.data.prompt || ''}

                      onChange={(e) => updateSelectedNodeData('prompt', e.target.value)}

                      rows={6}

                      className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-none leading-relaxed font-mono"

                      placeholder="Enter system prompt for LLM routing decisions..."

                    />

                  </div>

                )}


                {!isSelectedDbNode && !isSelectedApiConnectorNode && !isSelectedJsonConnectorNode && !isSelectedJsonConnectorListNode && !isSelectedPageNode && !isSelectedStorageNode && !isSelectedTimerNode && !isSelectedPdfsLoaderNode && !isSelectedPdfQueueNode && !isSelectedTxtQueueNode && !isSelectedZipQueueNode && !isSelectedOcrPdfsNode && !isSelectedPdfExtractorNode && !isSelectedExtractNode && !isSelectedDeDuplicateNode && !isSelectedStructuredParseNode && !isSelectedStateNode && !isSelectedMarkItDownNode && !isSelectedPolarsConverterNode && !isSelectedDuckDbNode && !isSelectedBigDataAnalystNode && !isSelectedBigDataContainerNode && selectedNode.data.category !== 'Datasets' && selectedNode.data.category !== 'Big Data & Analytics' && selectedNode.data.category !== 'Agents' && selectedNode.data.category !== 'Agent' && !selectedNode.data.name?.toLowerCase().includes('agent') && !selectedNode.type?.toLowerCase().includes('agent') && selectedNode.data.category !== 'Models' && selectedNode.data.category !== 'Criteria' && selectedNode.type !== 'rubric' && selectedNode.type !== 'mca' && selectedNode.type !== 'table' && (

                  <>

                    {/* Agent Metrics & Tools */}

                    <div className="pt-3 border-t border-cyber-border space-y-3">

                      <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider">

                        Agent Metrics & Tools

                      </h4>

                      

                      {/* Progress (%) slider */}

                      <div className="space-y-1">

                        <div className="flex items-center justify-between text-[10px]">

                          <span className="font-bold uppercase tracking-wider text-cyber-muted">Progress (%)</span>

                          <span className="text-cyber-neon font-semibold font-mono">

                            {selectedNode.data.parameters?.progress !== undefined ? `${selectedNode.data.parameters.progress}%` : 'Not Set'}

                          </span>

                        </div>

                        <div className="flex items-center space-x-2">

                          <input 

                            type="range" 

                            min="0" 

                            max="100" 

                            value={selectedNode.data.parameters?.progress !== undefined ? selectedNode.data.parameters.progress : 50} 

                            onChange={(e) => updateSelectedNodeParameter('progress', Number(e.target.value))}

                            className="flex-1 h-1.5 bg-cyber-dark rounded-lg appearance-none cursor-pointer accent-cyber-neon"

                          />

                          <button

                            onClick={() => {

                              const currentParams = { ...selectedNode.data.parameters };

                              delete currentParams.progress;

                              updateSelectedNodeData('parameters', currentParams);

                            }}

                            className="text-[9px] text-red-400 hover:text-red-300 font-semibold bg-cyber-dark border border-cyber-border px-1.5 py-0.5 rounded cursor-pointer"

                            title="Remove progress bar"

                          >

                            Reset

                          </button>

                        </div>

                      </div>



                      {/* Progress Bar Color selection */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Progress Bar Color

                        </label>

                        <select

                          value={selectedNode.data.parameters?.progressColor || '#00F0FF'}

                          onChange={(e) => updateSelectedNodeParameter('progressColor', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                        >

                          <option value="#00F0FF">Cyan</option>

                          <option value="#10B981">Emerald</option>

                          <option value="#8B5CF6">Purple</option>

                          <option value="#F59E0B">Orange</option>

                          <option value="#EF4444">Red</option>

                        </select>

                      </div>



                      {/* Tech capabilities tools check list */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Tech Tools / Capabilities

                        </label>

                        <div className="grid grid-cols-3 gap-2">

                          {[

                            { name: 'React', key: 'react' },

                            { name: 'NodeJS', key: 'nodejs' },

                            { name: 'Python', key: 'python' },

                            { name: 'Database', key: 'database' },

                            { name: 'API', key: 'api' },

                            { name: 'Users', key: 'users' },

                            { name: 'Search', key: 'search' },

                            { name: 'Check', key: 'check' },

                            { name: 'Vector', key: 'vector' },

                          ].map((tool) => {

                            const currentTools = selectedNode.data.parameters?.tools || [];

                            const isChecked = currentTools.includes(tool.key);

                            return (

                              <label 

                                key={tool.key} 

                                className={`flex items-center justify-center p-1.5 rounded border text-[10px] font-semibold cursor-pointer select-none transition-all ${

                                  isChecked 

                                    ? 'bg-cyber-neon bg-opacity-10 border-cyber-neon text-cyber-neon' 

                                    : 'bg-cyber-dark border-cyber-border text-cyber-muted hover:border-gray-500'

                                }`}

                              >

                                <input 

                                  type="checkbox" 

                                  checked={isChecked}

                                  onChange={() => {

                                    const newTools = isChecked 

                                      ? currentTools.filter((t: string) => t !== tool.key)

                                      : [...currentTools, tool.key];

                                    updateSelectedNodeParameter('tools', newTools);

                                  }}

                                  className="sr-only"

                                />

                                <span>{tool.name}</span>

                              </label>

                            );

                          })}

                        </div>

                      </div>

                    </div>



                    {/* Memory Settings Section */}

                    <div className="pt-3 border-t border-cyber-border space-y-3">

                      <h4 className="text-xs font-bold text-cyber-text flex items-center justify-between">

                        <span>Memory Settings</span>

                        <span className="text-[9px] font-bold uppercase tracking-widest text-cyber-neon">

                          State Retention

                        </span>

                      </h4>

                      

                      {/* Memory Type */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Type

                        </label>

                        <select

                          value={selectedNode.data.parameters?.memoryType || 'Vector'}

                          onChange={(e) => updateSelectedNodeParameter('memoryType', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                        >

                          <option value="Vector">Vector Store (Semantic Search)</option>

                          <option value="Buffer">Buffer Window (Last N Messages)</option>

                          <option value="None">None (Stateless)</option>

                        </select>

                      </div>



                      {/* Memory Capacity Slider */}

                      <div className="space-y-1">

                        <div className="flex items-center justify-between text-[10px]">

                          <span className="font-bold uppercase tracking-wider text-cyber-muted">Capacity</span>

                          <span className="text-cyber-neon font-semibold font-mono">

                            {selectedNode.data.parameters?.memoryCapacity || '10k'}

                          </span>

                        </div>

                        <input 

                          type="range" 

                          min="1" 

                          max="10" 

                          defaultValue="3" 

                          onChange={(e) => updateSelectedNodeParameter('memoryCapacity', `${Number(e.target.value) * 3}k`)}

                          className="w-full h-1.5 bg-cyber-dark rounded-lg appearance-none cursor-pointer accent-cyber-neon"

                        />

                      </div>



                      {/* Time Window Buttons */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Time Window Configuration

                        </label>

                        <div className="flex space-x-1.5">

                          {['Real-time', 'Hourly', 'Log history'].map((option, oIdx) => (

                            <button

                              key={option}

                              onClick={() => updateSelectedNodeParameter('timeWindow', option)}

                              className={`flex-1 text-[9px] font-bold py-1.5 px-1 rounded-lg border transition-all ${

                                selectedNode.data.parameters?.timeWindow === option || (!selectedNode.data.parameters?.timeWindow && oIdx === 1)
                                  ? 'bg-zinc-900 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs'
                                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'

                              }`}

                            >

                              {option}

                            </button>

                          ))}

                        </div>

                      </div>

                    </div>



                    {/* LangGraph Compilation Parameter Fields */}

                    <div className="pt-3 border-t border-cyber-border space-y-3.5">

                      <h4 className="text-xs font-bold text-cyber-text">

                        LangGraph Parameters

                      </h4>

                      

                      {/* Recursion Limit Toggle */}

                      <div className="flex items-center justify-between">

                        <div className="space-y-0.5">

                          <span className="text-xs text-cyber-text block font-semibold">Recursion Limit</span>

                          <span className="text-[9px] text-cyber-muted block">Prevent infinite cycle loops</span>

                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">

                          <input 

                            type="checkbox" 

                            defaultChecked 

                            onChange={(e) => updateSelectedNodeParameter('recursionLimit', e.target.checked ? 'Active' : 'Disabled')}

                            className="sr-only peer" 

                          />

                          <div className="w-9 h-5 bg-cyber-dark border border-cyber-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-muted peer-checked:after:bg-cyber-neon after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyber-panel"></div>

                        </label>

                      </div>



                      {/* Checkpointer Toggle */}

                      <div className="flex items-center justify-between">

                        <div className="space-y-0.5">

                          <span className="text-xs text-cyber-text block font-semibold">Checkpointer saver</span>

                          <span className="text-[9px] text-cyber-muted block">Save state for Time-travel auditing</span>

                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">

                          <input 

                            type="checkbox" 

                            defaultChecked

                            onChange={(e) => updateSelectedNodeParameter('checkpointer', e.target.checked ? 'Active' : 'Disabled')}

                            className="sr-only peer" 

                          />

                          <div className="w-9 h-5 bg-cyber-dark border border-cyber-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-muted peer-checked:after:bg-cyber-neon after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyber-panel"></div>

                        </label>

                      </div>

                    </div>

                  </>

                )}


    </>
  );
};

export default AgentNodeInspector;
