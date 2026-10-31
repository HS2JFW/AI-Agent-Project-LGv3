import React from 'react';
import ReactFlow, { Background, Controls, SelectionMode } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import { Lock, Unlock, Terminal, ChevronUp } from 'lucide-react';
import CanvasHeader from './CanvasHeader';
import { useTheme } from '../../hooks/useTheme';
import { isWorkflowTimerNode } from '../../utils/nodeGraphUtils';

export interface CanvasFlowAreaProps {
  reactFlowWrapper?: React.RefObject<HTMLDivElement | null>;
  isAutoSaving: boolean;
  workflowName: string;
  setWorkflowName: (name: string) => void;
  selectedWorkflowId: string | null;
  currentFileName: string | null;
  setCurrentFileName: React.Dispatch<React.SetStateAction<string | null>>;
  setProcesses: React.Dispatch<React.SetStateAction<any[]>>;
  isRunning: boolean;
  isPropertiesInspectorOpen: boolean;
  currentUser: any;
  onOpenProfile: () => void;
  onOpenUserManagement: () => void;
  currentTime: string;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  setReactFlowInstance: any;
  onDrop: any;
  onDragOver: any;
  onNodeClick: any;
  handleDrillDownContainer: (node: Node) => void;
  onPaneClick: any;
  onSelectionChange: any;
  nodeTypes: any;
  onNodeDragStart: any;
  onNodeDragStop: any;
  isLocked: boolean;
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  isSubflowModeActive: boolean;
  handleStartSubWorkFlowClick: () => void | Promise<any>;
  handleStartWorkFlowClick: () => void | Promise<any>;
  showLogsTray: boolean;
  setShowLogsTray: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CanvasFlowArea: React.FC<CanvasFlowAreaProps> = ({
  reactFlowWrapper,
  isAutoSaving,
  workflowName,
  setWorkflowName,
  selectedWorkflowId,
  currentFileName,
  setCurrentFileName,
  setProcesses,
  isRunning,
  isPropertiesInspectorOpen,
  currentUser,
  onOpenProfile,
  onOpenUserManagement,
  currentTime,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  setReactFlowInstance,
  onDrop,
  onDragOver,
  onNodeClick,
  handleDrillDownContainer,
  onPaneClick,
  onSelectionChange,
  nodeTypes,
  onNodeDragStart,
  onNodeDragStop,
  isLocked,
  setIsLocked,
  isSubflowModeActive,
  handleStartSubWorkFlowClick,
  handleStartWorkFlowClick,
  showLogsTray,
  setShowLogsTray,
}) => {
  const { isDark } = useTheme();
  const selectedNodesCount = nodes.filter((n) => n.selected).length;
  const isSubRunning =
    isSubflowModeActive ||
    nodes.some(
      (n) =>
        isWorkflowTimerNode(n) &&
        n.data?.parameters?.schedulerActive === true &&
        n.data?.parameters?.runMode === 'subflow'
    );
  const isFullRunning = nodes.some(
    (n) =>
      isWorkflowTimerNode(n) &&
      n.data?.parameters?.schedulerActive === true &&
      n.data?.parameters?.runMode === 'full'
  );

  return (
    <div className="flex-1 w-full h-full relative" ref={reactFlowWrapper}>
      <CanvasHeader
        isAutoSaving={isAutoSaving}
        workflowName={workflowName}
        onWorkflowNameChange={(val) => {
          setWorkflowName(val);
          if (val.trim()) {
            const cleanFname = val.trim().replace(/\s+/g, '_') + '.wf';
            setCurrentFileName(cleanFname);
            setProcesses((prev) =>
              prev.map((p) =>
                p.workflowId === selectedWorkflowId || p.name === workflowName
                  ? { ...p, name: val }
                  : p
              )
            );
          }
        }}
        currentFileName={currentFileName}
        isRunning={isRunning}
        selectedWorkflowId={selectedWorkflowId}
        isPropertiesInspectorOpen={isPropertiesInspectorOpen}
        currentUser={currentUser}
        onOpenProfile={onOpenProfile}
        onOpenUserManagement={onOpenUserManagement}
        currentTime={currentTime}
        selectedNodesCount={selectedNodesCount}
        isSubRunning={isSubRunning}
        onStartSubWorkFlowClick={handleStartSubWorkFlowClick}
        isFullRunning={isFullRunning}
        onStartWorkFlowClick={handleStartWorkFlowClick}
      />

      <ReactFlow
        key="logic-flow"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={(_e, node) => handleDrillDownContainer(node)}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        className="dark:bg-[#09090b] bg-[#fafafa] canvas-dots"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        nodesDraggable={!isLocked}
        minZoom={0.25}
        selectionOnDrag={true}
        panOnDrag={[1, 2]}
        selectionMode={SelectionMode.Partial}
      >
        <Background color={isDark ? "#27272a" : "#d4d4d8"} gap={24} size={1.2} />

        {/* Floating Navigation & Lock Controls bottom-left */}
        <Controls showInteractive={false} position="bottom-left">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`react-flow__controls-button flex items-center justify-center ${
              isLocked ? 'locked-btn' : ''
            }`}
            title={isLocked ? 'Unlock Nodes' : 'Lock Nodes'}
            type="button"
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </Controls>
      </ReactFlow>

      {/* Floating Show Log File Button when tray is hidden */}
      {!showLogsTray && (
        <button
          onClick={() => setShowLogsTray(true)}
          className="absolute bottom-5 right-6 z-20 flex items-center space-x-2 px-3.5 py-1.5 dark:bg-zinc-900/90 bg-white/90 border dark:border-zinc-800 border-zinc-200 rounded-lg shadow-sm hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-all backdrop-blur-md cursor-pointer group select-none"
          title="Show Log File (แสดง Log File)"
        >
          <Terminal className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Show Log File</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </button>
      )}
    </div>
  );
};

export default CanvasFlowArea;

