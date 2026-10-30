import React from 'react';
import {
  Database,
  Trash2,
  Lock,
  Settings,
  Pause,
  Layout,
  Play,
  X,
} from 'lucide-react';
import ConnectorsAndProcessorsInspector from './ConnectorsAndProcessorsInspector';
import QueueTablesSection from './QueueTablesSection';
import TimerNodeInspector from './TimerNodeInspector';
import BigDataInspectorSection from './BigDataInspectorSection';
import AgentNodeInspector from './AgentNodeInspector';
import { computeNodeFlags } from '../../utils/nodeFlags';

export interface PropertiesInspectorProps {
  inspectorWidth: number;
  handleInspectorFocus: (e: React.FocusEvent) => void;
  handleInspectorBlur: (e: React.FocusEvent) => void;
  setIsResizingInspector: React.Dispatch<React.SetStateAction<boolean>>;
  isResizingInspector: boolean;
  inspectorContentRef: React.RefObject<HTMLDivElement | null>;
  handleInspectorMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isDraggingInspectorScroll: boolean;
  handleStartWorkFlowClick: () => void;
  isWorkflowTimerNode: (node: any) => boolean;
  isProtectedTimerNode: (node: any) => boolean;
  getNodeClass: (node?: any) => string;
  nodes: any[];
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  edges: any[];
  selectedNode: any;
  setSelectedNode: React.Dispatch<React.SetStateAction<any>>;
  updateSelectedNodeData: (field: string, value: any) => void;
  updateSelectedNodeParameter: (field: string, value: any) => void;
  selectedWorkflowId: string | null;
  workflowName: string;
  setWorkflowName: (name: string) => void;
  workflowDesc: string;
  setWorkflowDesc: (desc: string) => void;
  setProcesses: React.Dispatch<React.SetStateAction<any[]>>;
  openDialog: (type: 'agent_result' | 'pdf_queue' | 'json' | 'zip_queue' | 'txt_queue', filename: string, rawContent?: string) => void;
  showAlert: (msg: string, title?: string, type?: 'info' | 'success' | 'error') => void;
  aiModels: any[];
  agentNodes: any[];
  isRunning: boolean;
  calMonth: number;
  setCalMonth: React.Dispatch<React.SetStateAction<number>>;
  calYear: number;
  setCalYear: React.Dispatch<React.SetStateAction<number>>;
  selectedCalDate: string | null;
  setSelectedCalDate: React.Dispatch<React.SetStateAction<string | null>>;
  selectedCalTime: string;
  setSelectedCalTime: React.Dispatch<React.SetStateAction<string>>;
  openClockPicker: (event: React.MouseEvent, initTime: string, onSave: (time: string) => void) => void;
  openDayPopover: (event: React.MouseEvent, initDay: number, onSave: (day: number) => void) => void;
  pdfQueuePage: number;
  setPdfQueuePage: React.Dispatch<React.SetStateAction<number>>;
  txtQueuePage: number;
  setTxtQueuePage: React.Dispatch<React.SetStateAction<number>>;
  zipQueuePage: number;
  setZipQueuePage: React.Dispatch<React.SetStateAction<number>>;
  serverPdfQueueFiles: any[];
  setServerPdfQueueFiles: React.Dispatch<React.SetStateAction<any[]>>;
  serverTxtQueueFiles: any[];
  setServerTxtQueueFiles: React.Dispatch<React.SetStateAction<any[]>>;
  serverZipQueueFiles: any[];
  setServerZipQueueFiles: React.Dispatch<React.SetStateAction<any[]>>;
  agentOutputsPage: number;
  setAgentOutputsPage: React.Dispatch<React.SetStateAction<number>>;
  serverAgentOutputsFiles: string[];
  setServerAgentOutputsFiles: React.Dispatch<React.SetStateAction<string[]>>;
  nodeLiveProgress: Record<string, any>;
  setNodeLiveProgress: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setIsFinalPromptModalOpen: (v: boolean) => void;
  setFinalPromptPreview: (v: string) => void;
  generateFinalPromptAsync: (nodeId: string) => Promise<string>;
  setIsFinalSendModalOpen: (v: boolean) => void;
  setFinalSendPayloadPreview: (v: string) => void;
  generateFinalPayloadAsync: (nodeId: string) => Promise<string>;
  handleDrillDownContainer: (containerNode: any) => void;
  isSelectedDbNode?: boolean;
  isSelectedGraphRagNode?: boolean;
  isSelectedApiConnectorNode?: boolean;
  isSelectedApiIncrementalNode?: boolean;
  isSelectedJsonConnectorNode?: boolean;
  isSelectedJsonConnectorListNode?: boolean;
  isSelectedPageNode?: boolean;
  isSelectedStorageNode?: boolean;
  isSelectedPdfsLoaderNode?: boolean;
  isSelectedOcrPdfsNode?: boolean;
  isSelectedExtractNode?: boolean;
  isSelectedDeDuplicateNode?: boolean;
  isSelectedStructuredParseNode?: boolean;
  isSelectedStateNode?: boolean;
  isSelectedPdfQueueNode?: boolean;
  isSelectedTxtQueueNode?: boolean;
  isSelectedZipQueueNode?: boolean;
  isSelectedRegularTimerNode?: boolean;
  isSelectedWorkflowTimerNode?: boolean;
  isSelectedPolarsConverterNode?: boolean;
  isSelectedDuckDbNode?: boolean;
  isSelectedBigDataAnalystNode?: boolean;
  isSelectedBigDataContainerNode?: boolean;
  isSelectedPdfExtractorNode?: boolean;
  deleteSelectedElements: () => void;
  updateSelectedNodeDataFields: (fields: { [key: string]: any }) => void;
  setTableBuilderNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setSampleBuilderNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setRubricBuilderNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  isSelectedTimerNode?: boolean;
  isSelectedMarkItDownNode?: boolean;
  setCurrentFileName: React.Dispatch<React.SetStateAction<string | null>>;
  backendUrl?: string;
}

export const PropertiesInspector: React.FC<PropertiesInspectorProps> = ({
  inspectorWidth,
  handleInspectorFocus,
  handleInspectorBlur,
  setIsResizingInspector,
  isResizingInspector,
  inspectorContentRef,
  handleInspectorMouseDown,
  isDraggingInspectorScroll,
  handleStartWorkFlowClick,
  isWorkflowTimerNode,
  isProtectedTimerNode,
  getNodeClass,
  nodes,
  setNodes,
  edges,
  selectedNode,
  setSelectedNode,
  updateSelectedNodeData,
  updateSelectedNodeParameter,
  selectedWorkflowId,
  workflowName,
  setWorkflowName,
  workflowDesc,
  setWorkflowDesc,
  setProcesses,
  openDialog,
  showAlert,
  aiModels,
  agentNodes,
  isRunning,
  calMonth,
  setCalMonth,
  calYear,
  setCalYear,
  selectedCalDate,
  setSelectedCalDate,
  selectedCalTime,
  setSelectedCalTime,
  openClockPicker,
  openDayPopover,
  pdfQueuePage,
  setPdfQueuePage,
  txtQueuePage,
  setTxtQueuePage,
  zipQueuePage,
  setZipQueuePage,
  serverPdfQueueFiles,
  setServerPdfQueueFiles,
  serverTxtQueueFiles,
  setServerTxtQueueFiles,
  serverZipQueueFiles,
  setServerZipQueueFiles,
  agentOutputsPage,
  setAgentOutputsPage,
  serverAgentOutputsFiles,
  setServerAgentOutputsFiles,
  nodeLiveProgress,
  setNodeLiveProgress,
  setIsFinalPromptModalOpen,
  setFinalPromptPreview,
  generateFinalPromptAsync,
  setIsFinalSendModalOpen,
  setFinalSendPayloadPreview,
  generateFinalPayloadAsync,
  handleDrillDownContainer,
  deleteSelectedElements,
  updateSelectedNodeDataFields,
  setTableBuilderNodeId,
  setSampleBuilderNodeId,
  setRubricBuilderNodeId,
  setCurrentFileName,
  backendUrl,
  ...props
}) => {
  const flags = React.useMemo(() => computeNodeFlags(selectedNode), [selectedNode]);
  const isSelectedDbNode = props.isSelectedDbNode ?? flags.isSelectedDbNode;
  const isSelectedGraphRagNode = props.isSelectedGraphRagNode ?? flags.isSelectedGraphRagNode;
  const isSelectedApiConnectorNode = props.isSelectedApiConnectorNode ?? flags.isSelectedApiConnectorNode;
  const isSelectedApiIncrementalNode = props.isSelectedApiIncrementalNode ?? flags.isSelectedApiIncrementalNode;
  const isSelectedJsonConnectorNode = props.isSelectedJsonConnectorNode ?? flags.isSelectedJsonConnectorNode;
  const isSelectedJsonConnectorListNode = props.isSelectedJsonConnectorListNode ?? flags.isSelectedJsonConnectorListNode;
  const isSelectedPageNode = props.isSelectedPageNode ?? flags.isSelectedPageNode;
  const isSelectedStorageNode = props.isSelectedStorageNode ?? flags.isSelectedStorageNode;
  const isSelectedPdfsLoaderNode = props.isSelectedPdfsLoaderNode ?? flags.isSelectedPdfsLoaderNode;
  const isSelectedOcrPdfsNode = props.isSelectedOcrPdfsNode ?? flags.isSelectedOcrPdfsNode;
  const isSelectedExtractNode = props.isSelectedExtractNode ?? flags.isSelectedExtractNode;
  const isSelectedDeDuplicateNode = props.isSelectedDeDuplicateNode ?? flags.isSelectedDeDuplicateNode;
  const isSelectedStructuredParseNode = props.isSelectedStructuredParseNode ?? flags.isSelectedStructuredParseNode;
  const isSelectedStateNode = props.isSelectedStateNode ?? flags.isSelectedStateNode;
  const isSelectedPdfQueueNode = props.isSelectedPdfQueueNode ?? flags.isSelectedPdfQueueNode;
  const isSelectedTxtQueueNode = props.isSelectedTxtQueueNode ?? flags.isSelectedTxtQueueNode;
  const isSelectedZipQueueNode = props.isSelectedZipQueueNode ?? flags.isSelectedZipQueueNode;
  const isSelectedRegularTimerNode = props.isSelectedRegularTimerNode ?? flags.isSelectedRegularTimerNode;
  const isSelectedWorkflowTimerNode = props.isSelectedWorkflowTimerNode ?? flags.isSelectedWorkflowTimerNode;
  const isSelectedPolarsConverterNode = props.isSelectedPolarsConverterNode ?? flags.isSelectedPolarsConverterNode;
  const isSelectedDuckDbNode = props.isSelectedDuckDbNode ?? flags.isSelectedDuckDbNode;
  const isSelectedBigDataAnalystNode = props.isSelectedBigDataAnalystNode ?? flags.isSelectedBigDataAnalystNode;
  const isSelectedBigDataContainerNode = props.isSelectedBigDataContainerNode ?? flags.isSelectedBigDataContainerNode;
  const isSelectedPdfExtractorNode = props.isSelectedPdfExtractorNode ?? flags.isSelectedPdfExtractorNode;
  const isSelectedTimerNode = props.isSelectedTimerNode ?? flags.isSelectedTimerNode;
  const isSelectedMarkItDownNode = props.isSelectedMarkItDownNode ?? flags.isSelectedMarkItDownNode;
  void workflowName;
  void setWorkflowName;
  void isSelectedPdfExtractorNode;
  void backendUrl;

  return (
        <aside 

          className="relative bg-white/95 backdrop-blur-md border-l border-slate-200/90 flex flex-col h-full z-10 shadow-[-12px_0_36px_rgba(30,60,110,0.08)] text-slate-800"

          style={{ width: `${inspectorWidth}px` }}

          onFocus={handleInspectorFocus}

          onBlur={handleInspectorBlur}

        >

          {/* Resize Grab Handle Divider */}

          <div 

            onMouseDown={(e) => {

              e.preventDefault();

              setIsResizingInspector(true);

            }}

            className={`absolute top-0 bottom-0 left-0 w-1.5 -translate-x-1/2 cursor-col-resize z-50 hover:bg-blue-500/40 transition-colors ${

              isResizingInspector ? 'bg-blue-500/40' : ''

            }`}

            title="Drag to resize"

          />

          <div className="p-4 border-b border-slate-100 bg-slate-50/70">

              <div className="flex items-center justify-between">

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">

                  {(() => {

                    const selectedNodes = nodes.filter(n => n.selected);

                    const activeSelectedNodes = selectedNodes.length > 0 ? selectedNodes : (selectedNode ? [selectedNode] : []);

                    if (activeSelectedNodes.length > 0) {

                      return (

                        <>

                          <Settings className="w-4 h-4 text-blue-600" />

                          <span>Properties Inspector</span>

                        </>

                      );

                    } else {

                      return (

                        <>

                          <Layout className="w-4 h-4 text-blue-600" />

                          <span>Workspace Inspector</span>

                        </>

                      );

                    }

                  })()}

                </h3>

                <button

                  onClick={() => {

                    setSelectedNode(null);

                    setNodes(prev => prev.map(n => ({ ...n, selected: false })));

                  }}

                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"

                  title="Close Inspector"

                >

                  <X className="w-4 h-4" />

                </button>

              </div>

              {(() => {

                const selectedNodes = nodes.filter(n => n.selected);

                const activeSelectedNodes = selectedNodes.length > 0 ? selectedNodes : (selectedNode ? [selectedNode] : []);



                if (activeSelectedNodes.length > 0) {

                  return (

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">

                      <div className="flex items-center space-x-2">

                        {/* Start / Pause Work Flow Button in Inspector */}

                        <button

                          onClick={handleStartWorkFlowClick}

                          className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer hover:scale-105 ${

                            (nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning)

                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md animate-pulse'

                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_2px_6px_rgba(26,106,255,0.3)]'

                          }`}

                          title={(nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning) ? "Pause Work Flow" : "Start Work Flow"}

                        >

                          {(nodes.some(n => isWorkflowTimerNode(n) && n.data.parameters?.schedulerActive === true && n.data.parameters?.runMode === "full") || isRunning) ? (

                            <>

                              <Pause className="w-3 h-3 fill-white text-white" />

                              <span>Pause Work Flow</span>

                            </>

                          ) : (

                            <>

                              <Play className="w-3 h-3 fill-white text-white" />

                              <span>Start Work Flow</span>

                            </>

                          )}

                        </button>

                      </div>

                      <span className="text-[9px] text-cyber-neon font-mono select-none">

                        {activeSelectedNodes.length} node{activeSelectedNodes.length > 1 ? 's' : ''} selected

                      </span>

                    </div>

                  );

                } else {

                  return (

                    <p className="text-[10px] text-cyber-muted mt-1 leading-relaxed">

                      Select any node on the canvas to configure its LangGraph properties.

                    </p>

                  );

                }

              })()}

            </div>



          <div 

            ref={inspectorContentRef}

            onMouseDown={handleInspectorMouseDown}

            className={`flex-1 overflow-y-auto min-h-0 p-5 space-y-5 cursor-grab ${

              isDraggingInspectorScroll ? 'cursor-grabbing select-none' : ''

            }`}

          >

            {selectedNode ? (

              <div className="space-y-4">

                {/* Node info header */}

                <div className="p-3 bg-cyber-dark bg-opacity-50 rounded-lg border border-cyber-border flex items-center justify-between">

                  <div>

                    <span className="text-[9px] uppercase tracking-widest text-cyber-muted font-bold font-mono">

                      ID: {selectedNode.id}

                    </span>

                    <h4 className="text-xs font-bold text-cyber-neon uppercase tracking-wide">

                      {selectedNode.data?.nodeType || getNodeClass(selectedNode) || 'Node'}

                    </h4>

                    <span className="text-[10px] text-cyber-muted block">

                      Category: {selectedNode.data.category || 'CustomNode'}

                    </span>

                  </div>

                  {isProtectedTimerNode(selectedNode) ? (

                    <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-cyber-dark bg-opacity-70 rounded border border-cyber-neon border-opacity-40 text-cyber-neon text-[10px] select-none" title="Protected System Node (โหนดระบบ ไม่สามารถลบได้)">

                      <Lock className="w-3 h-3 text-cyber-neon" />

                      <span className="font-mono text-[9px] font-bold tracking-wider">PROTECTED</span>

                    </div>

                  ) : (

                    <button

                      onClick={deleteSelectedElements}

                      className="p-1.5 rounded hover:bg-cyber-dark border border-cyber-border hover:border-red-500 hover:text-red-400 text-cyber-muted transition-all"

                      title="Delete Node"

                    >

                      <Trash2 className="w-4 h-4" />

                    </button>

                  )}

                </div>



                {/* Node Type Field (Workspace Tool Type) */}

                <div className="space-y-1.5">

                  <div className="flex items-center justify-between">

                    <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                      Node Type (Tool)

                    </label>

                    <span className="text-[9px] font-mono font-bold text-cyber-neon bg-cyber-dark px-2 py-0.5 rounded border border-cyber-neon border-opacity-40">

                      {selectedNode.data?.nodeType || getNodeClass(selectedNode) || 'CustomNode'}

                    </span>

                  </div>

                  <div className="flex items-center justify-between text-[9px] text-cyber-muted font-mono">

                    <span>Class Name:</span>

                    <span className="text-cyan-400 font-semibold">{getNodeClass(selectedNode)}</span>

                  </div>

                </div>



                {/* Node Label / Name Input */}

                <div className="space-y-1.5">

                  <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                    Node Title / Display Name

                  </label>

                  <input

                    type="text"

                    value={selectedNode.data.label !== undefined ? selectedNode.data.label : (selectedNode.data.name || '')}

                    onChange={(e) => {

                      const cls = getNodeClass(selectedNode);

                      const currentType = selectedNode.data?.nodeType || cls.replace(/_/g, ' ');

                      updateSelectedNodeDataFields({

                        name: e.target.value,

                        label: e.target.value,

                        nodeType: currentType,

                        nodeClass: cls,

                        originalName: selectedNode.data.originalName || currentType

                      });

                    }}

                    className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                    placeholder="e.g. OCR Reader"

                  />

                  <p className="text-[9px] text-cyber-muted italic">

                    Title/Display Name สำหรับตั้งชื่อให้เข้าใจง่าย โดยระบบจะตรวจสอบการทำงานผ่าน Node Type: <span className="text-cyber-neon font-semibold">{selectedNode.data?.nodeType || getNodeClass(selectedNode)}</span> เสมอ

                  </p>

                </div>



                {selectedNode.type === 'sample' && (

                  <div className="space-y-1.5 mt-4">

                    <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                      Table Description

                    </label>

                    <textarea

                      value={selectedNode.data.description || ''}

                      onChange={(e) => updateSelectedNodeDataFields({ description: e.target.value })}

                      className="w-full h-20 text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text resize-none"

                      placeholder="Describe the purpose of this sample table..."

                    />

                  </div>

                )}



                {/* Rubric/Sample Button */}

                {(selectedNode.type === 'rubric' || selectedNode.type === 'mca' || selectedNode.type === 'sample' || selectedNode.data?.category === 'Criteria') && (

                  <div className="flex flex-col space-y-4 mt-4 pt-4 border-t border-cyber-border">

                                          {selectedNode.type === 'table' ? (

                        <button

                          onClick={() => {

                            setTableBuilderNodeId(selectedNode.id);

                          }}

                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0f] font-bold rounded shadow-lg transition-colors"

                        >

                          Open Table Builder

                        </button>

                      ) : selectedNode.type === 'sample' ? (

                      <button

                        onClick={() => {

                          setSampleBuilderNodeId(selectedNode.id);

                        }}

                        className="w-full py-3 bg-[#38bdf8] hover:bg-cyan-400 text-[#0a0a0f] font-bold rounded shadow-lg transition-colors"

                      >

                        {selectedNode.data?.sampleData ? 'Edit Sample' : 'Create Sample'}

                      </button>

                    ) : (

                      <button

                        onClick={() => setRubricBuilderNodeId(selectedNode.id)}

                        className="w-full py-3 bg-[#84CC16] hover:bg-[#A3E635] text-[#0a0a0f] font-bold rounded shadow-lg transition-colors"

                      >

                        {selectedNode.data?.rubricData ? (selectedNode.type === 'mca' ? 'Edit MCA' : 'Edit Rubric') : (selectedNode.type === 'mca' ? 'Create MCA Table' : 'Create Rubric Table')}

                      </button>

                    )}

                  </div>

                )}



                {/* Connectors & Processors Inspector (DB, Graph RAG, APIs, JSON, Storage, OCR, Extract, Parse, State) */}
                <ConnectorsAndProcessorsInspector
                  selectedNode={selectedNode}
                  updateSelectedNodeParameter={updateSelectedNodeParameter}
                  updateSelectedNodeData={updateSelectedNodeData}
                  nodes={nodes}
                  setNodes={setNodes}
                  edges={edges}
                  selectedWorkflowId={selectedWorkflowId}
                  aiModels={aiModels}
                  openDialog={openDialog}
                  isSelectedDbNode={isSelectedDbNode}
                  isSelectedGraphRagNode={isSelectedGraphRagNode}
                  isSelectedApiConnectorNode={isSelectedApiConnectorNode}
                  isSelectedApiIncrementalNode={isSelectedApiIncrementalNode}
                  isSelectedJsonConnectorNode={isSelectedJsonConnectorNode}
                  isSelectedJsonConnectorListNode={isSelectedJsonConnectorListNode}
                  isSelectedPageNode={isSelectedPageNode}
                  isSelectedStorageNode={isSelectedStorageNode}
                  isSelectedPdfsLoaderNode={isSelectedPdfsLoaderNode}
                  isSelectedOcrPdfsNode={isSelectedOcrPdfsNode}
                  isSelectedExtractNode={isSelectedExtractNode}
                  isSelectedDeDuplicateNode={isSelectedDeDuplicateNode}
                  isSelectedStructuredParseNode={isSelectedStructuredParseNode}
                  isSelectedStateNode={isSelectedStateNode}
                />

                {/* PDF, TXT, and Zip Queue Parameter Editors & Tables */}
                <QueueTablesSection
                  selectedNode={selectedNode}
                  edges={edges}
                  setNodes={setNodes}
                  selectedWorkflowId={selectedWorkflowId}
                  updateSelectedNodeData={updateSelectedNodeData}
                  isSelectedPdfQueueNode={isSelectedPdfQueueNode}
                  isSelectedTxtQueueNode={isSelectedTxtQueueNode}
                  isSelectedZipQueueNode={isSelectedZipQueueNode}
                  pdfQueuePage={pdfQueuePage}
                  setPdfQueuePage={setPdfQueuePage}
                  txtQueuePage={txtQueuePage}
                  setTxtQueuePage={setTxtQueuePage}
                  zipQueuePage={zipQueuePage}
                  setZipQueuePage={setZipQueuePage}
                  serverPdfQueueFiles={serverPdfQueueFiles}
                  setServerPdfQueueFiles={setServerPdfQueueFiles}
                  serverTxtQueueFiles={serverTxtQueueFiles}
                  setServerTxtQueueFiles={setServerTxtQueueFiles}
                  serverZipQueueFiles={serverZipQueueFiles}
                  setServerZipQueueFiles={setServerZipQueueFiles}
                  openDialog={openDialog}
                  showAlert={showAlert}
                />



                <TimerNodeInspector
                  selectedNode={selectedNode}
                  nodes={nodes}
                  isSelectedRegularTimerNode={isSelectedRegularTimerNode}
                  isSelectedWorkflowTimerNode={isSelectedWorkflowTimerNode}
                  setNodes={setNodes}
                  setSelectedNode={setSelectedNode}
                  updateSelectedNodeParameter={updateSelectedNodeParameter}
                  calMonth={calMonth}
                  setCalMonth={setCalMonth}
                  calYear={calYear}
                  setCalYear={setCalYear}
                  selectedCalDate={selectedCalDate}
                  setSelectedCalDate={setSelectedCalDate}
                  selectedCalTime={selectedCalTime}
                  setSelectedCalTime={setSelectedCalTime}
                  openClockPicker={openClockPicker}
                  openDayPopover={openDayPopover}
                />



                {/* Big Data & Analytics Inspectors (Polars, DuckDB, Autonomous Analyst Container) */}
                <BigDataInspectorSection
                  selectedNode={selectedNode}
                  updateSelectedNodeParameter={updateSelectedNodeParameter}
                  handleDrillDownContainer={handleDrillDownContainer}
                  isSelectedPolarsConverterNode={isSelectedPolarsConverterNode}
                  isSelectedDuckDbNode={isSelectedDuckDbNode}
                  isSelectedBigDataAnalystNode={isSelectedBigDataAnalystNode}
                  isSelectedBigDataContainerNode={isSelectedBigDataContainerNode}
                />

                {/* Agent & Model Node Inspector (Configuration, Outputs, Metrics, Tools, LangGraph) */}
                <AgentNodeInspector
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                  updateSelectedNodeData={updateSelectedNodeData}
                  updateSelectedNodeParameter={updateSelectedNodeParameter}
                  nodes={nodes}
                  setNodes={setNodes}
                  edges={edges}
                  selectedWorkflowId={selectedWorkflowId}
                  getNodeClass={getNodeClass}
                  agentOutputsPage={agentOutputsPage}
                  setAgentOutputsPage={setAgentOutputsPage}
                  serverAgentOutputsFiles={serverAgentOutputsFiles}
                  setServerAgentOutputsFiles={setServerAgentOutputsFiles}
                  nodeLiveProgress={nodeLiveProgress}
                  setNodeLiveProgress={setNodeLiveProgress}
                  openDialog={openDialog}
                  showAlert={showAlert}
                  setIsFinalPromptModalOpen={setIsFinalPromptModalOpen}
                  setFinalPromptPreview={setFinalPromptPreview}
                  generateFinalPromptAsync={generateFinalPromptAsync}
                  setIsFinalSendModalOpen={setIsFinalSendModalOpen}
                  setFinalSendPayloadPreview={setFinalSendPayloadPreview}
                  generateFinalPayloadAsync={generateFinalPayloadAsync}
                  isSelectedPdfExtractorNode={isSelectedPdfExtractorNode}
                  isSelectedDbNode={isSelectedDbNode}
                  isSelectedGraphRagNode={isSelectedGraphRagNode}
                  isSelectedExtractNode={isSelectedExtractNode}
                  isSelectedDeDuplicateNode={isSelectedDeDuplicateNode}
                  isSelectedStructuredParseNode={isSelectedStructuredParseNode}
                  isSelectedStateNode={isSelectedStateNode}
                  isSelectedApiConnectorNode={isSelectedApiConnectorNode}
                  isSelectedJsonConnectorNode={isSelectedJsonConnectorNode}
                  isSelectedJsonConnectorListNode={isSelectedJsonConnectorListNode}
                  isSelectedPageNode={isSelectedPageNode}
                  isSelectedStorageNode={isSelectedStorageNode}
                  isSelectedTimerNode={isSelectedTimerNode}
                  isSelectedPdfsLoaderNode={isSelectedPdfsLoaderNode}
                  isSelectedPdfQueueNode={isSelectedPdfQueueNode}
                  isSelectedTxtQueueNode={isSelectedTxtQueueNode}
                  isSelectedZipQueueNode={isSelectedZipQueueNode}
                  isSelectedOcrPdfsNode={isSelectedOcrPdfsNode}
                  isSelectedMarkItDownNode={isSelectedMarkItDownNode}
                  isSelectedPolarsConverterNode={isSelectedPolarsConverterNode}
                  isSelectedDuckDbNode={isSelectedDuckDbNode}
                  isSelectedBigDataAnalystNode={isSelectedBigDataAnalystNode}
                  isSelectedBigDataContainerNode={isSelectedBigDataContainerNode}
                  aiModels={aiModels}
                  agentNodes={agentNodes}
                  isRunning={isRunning}
                />
              </div>

            ) : (

              <div className="space-y-6 animate-fadeIn pb-24">

                <div className="p-4 bg-cyber-dark bg-opacity-40 rounded-lg border border-cyber-border space-y-4 shadow-sm">

                  <div className="flex items-center space-x-2 border-b border-cyber-border border-opacity-40 pb-2.5">

                    <Layout className="w-4 h-4 text-cyber-neon" />

                    <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider">

                      Workspace Overview

                    </h4>

                  </div>

                  

                  <div className="space-y-1.5">

                    <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                      Workflow Name

                    </label>

                    <input

                      type="text"

                      value={workflowName}

                      onChange={(e) => {

                  const val = e.target.value;

                  setWorkflowName(val);

                  if (val.trim()) {

                    const cleanFname = val.trim().replace(/\s+/g, '_') + '.wf';

                    setCurrentFileName(cleanFname);

                    setProcesses(prev => prev.map(p => (p.workflowId === selectedWorkflowId || p.name === workflowName) ? { ...p, name: val } : p));

                  }

                }}

                      className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      placeholder="e.g. My AI Agent Flow"

                    />

                  </div>

                  

                  <div className="space-y-1.5 pt-2">

                    <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                      Workflow Description

                    </label>

                    <textarea

                      value={workflowDesc}

                      onChange={(e) => setWorkflowDesc(e.target.value)}

                      rows={3}

                      className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text resize-none"

                      placeholder="Describe what this workflow does..."

                    />

                  </div>

                </div>



                <div className="p-4 bg-cyber-dark bg-opacity-40 rounded-lg border border-cyber-border space-y-4 shadow-sm">

                  <div className="flex items-center space-x-2 border-b border-cyber-border border-opacity-40 pb-2.5">

                    <Database className="w-4 h-4 text-cyber-neon" />

                    <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider">

                      Workspace Statistics

                    </h4>

                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">

                    <div className="bg-cyber-dark bg-opacity-70 p-2 rounded border border-cyber-border">

                      <span className="text-cyber-muted block">Total Nodes</span>

                      <span className="text-sm font-bold text-cyber-text mt-0.5 block">{nodes.length}</span>

                    </div>

                    <div className="bg-cyber-dark bg-opacity-70 p-2 rounded border border-cyber-border">

                      <span className="text-cyber-muted block">Total Edges</span>

                      <span className="text-sm font-bold text-cyber-text mt-0.5 block">{edges.length}</span>

                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>





        </aside>

  );
};

export default PropertiesInspector;
