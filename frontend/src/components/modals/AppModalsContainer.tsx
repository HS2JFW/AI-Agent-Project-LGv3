import React from 'react';
import type { Node } from 'reactflow';
import TimePickerModals, { type TimePickerModalsProps } from './TimePickerModals';
import GlobalConfirmationModals, { type GlobalConfirmationModalsProps } from './GlobalConfirmationModals';
import WorkflowManagementModals, { type WorkflowManagementModalsProps } from './WorkflowManagementModals';
import FloatingDialogManager from '../dialogs/FloatingDialogManager';
import JsonPreviewModal from '../dialogs/JsonPreviewModal';
import UserManagementModal from '../UserManagementModal';
import UnifiedSettingsModal from '../UnifiedSettingsModal';
import type { TableData } from '../TableBuilder';
import type { SampleData } from '../SampleBuilder';

export interface AppModalsContainerProps extends TimePickerModalsProps, GlobalConfirmationModalsProps, WorkflowManagementModalsProps {
  // Floating Dialogs
  dialogs: any[];
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  closeDialog: (id: string) => void;
  updateDialog: (id: string, updates: any) => void;
  bringToFront: (id: string) => void;
  tableBuilderNodeId: string | null;
  setTableBuilderNodeId: (val: string | null) => void;
  sampleBuilderNodeId: string | null;
  setSampleBuilderNodeId: (val: string | null) => void;
  rubricBuilderNodeId: string | null;
  setRubricBuilderNodeId: (val: string | null) => void;

  // Final Prompt & Send JSON Previews
  isFinalPromptModalOpen: boolean;
  setIsFinalPromptModalOpen: (val: boolean) => void;
  finalPromptPreview: string | null;
  isFinalSendModalOpen: boolean;
  setIsFinalSendModalOpen: (val: boolean) => void;
  finalSendPayloadPreview: string | null;

  // RBAC User Management
  isUserManagementOpen: boolean;
  setIsUserManagementOpen: (val: boolean) => void;
  currentUser: any;

  // Unified Settings
  isUnifiedSettingsOpen: boolean;
  setIsUnifiedSettingsOpen: (val: boolean) => void;
  unifiedSettingsTab: 'profile' | 'ai' | 'canvas';
  setUnifiedSettingsTab: (tab: 'profile' | 'ai' | 'canvas') => void;
  aiModels: any[];
  setAiModels: (val: any) => void;
  historyLimit: number;
  setHistoryLimit: (val: number) => void;
  pastCount: number;
  futureCount: number;
  undo: () => void;
  redo: () => void;
  onClearHistory: () => void;
}

export const AppModalsContainer: React.FC<AppModalsContainerProps> = (props) => {
  return (
    <>
      <TimePickerModals
        isClockOpen={props.isClockOpen}
        setIsClockOpen={props.setIsClockOpen}
        clockTimeValue={props.clockTimeValue}
        setClockTimeValue={props.setClockTimeValue}
        clockPosition={props.clockPosition}
        clockOnSaveCallback={props.clockOnSaveCallback}
        isDayPopoverOpen={props.isDayPopoverOpen}
        setIsDayPopoverOpen={props.setIsDayPopoverOpen}
        dayPopoverValue={props.dayPopoverValue}
        setDayPopoverValue={props.setDayPopoverValue}
        dayPopoverPosition={props.dayPopoverPosition}
        dayPopoverOnSaveCallback={props.dayPopoverOnSaveCallback}
      />

      <GlobalConfirmationModals
        showSaveConfirmModal={props.showSaveConfirmModal}
        handleNewWorkflowConfirmNo={props.handleNewWorkflowConfirmNo}
        handleNewWorkflowConfirmYes={props.handleNewWorkflowConfirmYes}
        showSchedulerPopup={props.showSchedulerPopup}
        setShowSchedulerPopup={props.setShowSchedulerPopup}
        schedulerPopupWorkflowName={props.schedulerPopupWorkflowName}
        schedulerPopupRound={props.schedulerPopupRound}
        customAlert={props.customAlert}
        setCustomAlert={props.setCustomAlert}
        queueToClear={props.queueToClear}
        setQueueToClear={props.setQueueToClear}
        selectedWorkflowId={props.selectedWorkflowId}
        selectedNode={props.selectedNode}
        updateSelectedNodeData={props.updateSelectedNodeData}
        setServerPdfQueueFiles={props.setServerPdfQueueFiles}
        setServerZipQueueFiles={props.setServerZipQueueFiles}
        setServerTxtQueueFiles={props.setServerTxtQueueFiles}
        showAlert={props.showAlert}
      />

      <WorkflowManagementModals
        processToDelete={props.processToDelete}
        setProcessToDelete={props.setProcessToDelete}
        handleDeleteProcess={props.handleDeleteProcess}
        showCreateGroupModal={props.showCreateGroupModal}
        setShowCreateGroupModal={props.setShowCreateGroupModal}
        newGroupName={props.newGroupName}
        setNewGroupName={props.setNewGroupName}
        newGroupDesc={props.newGroupDesc}
        setNewGroupDesc={props.setNewGroupDesc}
        newGroupColor={props.newGroupColor}
        setNewGroupColor={props.setNewGroupColor}
        currentGroupId={props.currentGroupId}
        handleCreateGroup={props.handleCreateGroup}
        moveMenuState={props.moveMenuState}
        setMoveMenuState={props.setMoveMenuState}
        groups={props.groups}
        workflowGroupMap={props.workflowGroupMap}
        executeMoveItems={props.executeMoveItems}
        getPathHierarchyLayers={props.getPathHierarchyLayers}
        groupToDelete={props.groupToDelete}
        setGroupToDelete={props.setGroupToDelete}
        processes={props.processes}
        handleDeleteGroup={props.handleDeleteGroup}
        showCreateWorkflowDialog={props.showCreateWorkflowDialog}
        setShowCreateWorkflowDialog={props.setShowCreateWorkflowDialog}
        newDialogWfName={props.newDialogWfName}
        setNewDialogWfName={props.setNewDialogWfName}
        newDialogWfDesc={props.newDialogWfDesc}
        setNewDialogWfDesc={props.setNewDialogWfDesc}
        newDialogWfColor={props.newDialogWfColor}
        setNewDialogWfColor={props.setNewDialogWfColor}
        onCreateWorkflowSubmit={props.onCreateWorkflowSubmit}
      />

      <FloatingDialogManager
        dialogs={props.dialogs}
        nodes={props.nodes}
        closeDialog={props.closeDialog}
        updateDialog={props.updateDialog}
        bringToFront={props.bringToFront}
        tableBuilderNodeId={props.tableBuilderNodeId}
        setTableBuilderNodeId={props.setTableBuilderNodeId}
        handleSaveTableData={(tableData: TableData) => {
          props.setNodes((nds) =>
            nds.map((n) =>
              n.id === props.tableBuilderNodeId ? { ...n, data: { ...n.data, tableData } } : n
            )
          );
          props.setTableBuilderNodeId(null);
        }}
        sampleBuilderNodeId={props.sampleBuilderNodeId}
        setSampleBuilderNodeId={props.setSampleBuilderNodeId}
        handleSaveSampleData={(sampleData: SampleData) => {
          props.setNodes((nds) =>
            nds.map((n) =>
              n.id === props.sampleBuilderNodeId ? { ...n, data: { ...n.data, sampleData } } : n
            )
          );
          props.setSampleBuilderNodeId(null);
        }}
        rubricBuilderNodeId={props.rubricBuilderNodeId}
        setRubricBuilderNodeId={props.setRubricBuilderNodeId}
        handleSaveRubricData={(rubricData) => {
          props.setNodes((nds) =>
            nds.map((n) =>
              n.id === props.rubricBuilderNodeId ? { ...n, data: { ...n.data, rubricData } } : n
            )
          );
        }}
      />

      <JsonPreviewModal
        isOpen={props.isFinalPromptModalOpen}
        title="Final Prompt Preview"
        content={props.finalPromptPreview}
        accentColor="neon"
        onClose={() => props.setIsFinalPromptModalOpen(false)}
      />

      <JsonPreviewModal
        isOpen={props.isFinalSendModalOpen}
        title="Final Send Payload Preview"
        content={props.finalSendPayloadPreview}
        accentColor="purple"
        onClose={() => props.setIsFinalSendModalOpen(false)}
      />

      <UserManagementModal
        isOpen={props.isUserManagementOpen}
        onClose={() => props.setIsUserManagementOpen(false)}
        currentUsername={props.currentUser?.username || ''}
        currentUserRole={props.currentUser?.role || ''}
      />

      <UnifiedSettingsModal
        isOpen={props.isUnifiedSettingsOpen}
        onClose={() => props.setIsUnifiedSettingsOpen(false)}
        activeTab={props.unifiedSettingsTab}
        onTabChange={(tab: 'profile' | 'ai' | 'canvas') => props.setUnifiedSettingsTab(tab)}
        username="user01"
        aiModels={props.aiModels}
        setAiModels={props.setAiModels}
        showAlert={props.showAlert}
        historyLimit={props.historyLimit}
        setHistoryLimit={props.setHistoryLimit}
        pastCount={props.pastCount}
        futureCount={props.futureCount}
        undo={props.undo}
        redo={props.redo}
        onClearHistory={props.onClearHistory}
      />
    </>
  );
};

export default AppModalsContainer;
