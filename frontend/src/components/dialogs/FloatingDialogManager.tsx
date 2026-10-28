import React from 'react';
import { type Node } from 'reactflow';
import { FloatingDialog, type DialogState } from '../../FloatingDialog';
import { TableBuilder, type TableData } from '../TableBuilder';
import { SampleBuilder, type SampleData } from '../SampleBuilder';
import RubricBuilder from '../RubricBuilder';

export interface FloatingDialogManagerProps {
  dialogs: DialogState[];
  nodes: Node[];
  closeDialog: (id: string) => void;
  updateDialog: (id: string, partial: Partial<DialogState>) => void;
  bringToFront: (id: string) => void;
  tableBuilderNodeId: string | null;
  setTableBuilderNodeId: (id: string | null) => void;
  handleSaveTableData: (tableData: TableData) => void;
  sampleBuilderNodeId: string | null;
  setSampleBuilderNodeId: (id: string | null) => void;
  handleSaveSampleData: (sampleData: SampleData) => void;
  rubricBuilderNodeId: string | null;
  setRubricBuilderNodeId: (id: string | null) => void;
  handleSaveRubricData: (rubricData: any) => void;
}

export const FloatingDialogManager: React.FC<FloatingDialogManagerProps> = ({
  dialogs,
  nodes,
  closeDialog,
  updateDialog,
  bringToFront,
  tableBuilderNodeId,
  setTableBuilderNodeId,
  handleSaveTableData,
  sampleBuilderNodeId,
  setSampleBuilderNodeId,
  handleSaveSampleData,
  rubricBuilderNodeId,
  setRubricBuilderNodeId,
  handleSaveRubricData,
}) => {
  return (
    <>
      {/* Floating File and Result Dialogs */}
      {dialogs.map((dialog) => (
        <FloatingDialog
          key={dialog.id}
          dialog={dialog}
          onClose={closeDialog}
          onUpdate={updateDialog}
          bringToFront={bringToFront}
        />
      ))}

      {/* Table Builder Modal */}
      {tableBuilderNodeId && (
        <TableBuilder
          initialData={nodes.find((n) => n.id === tableBuilderNodeId)?.data.tableData}
          nodeLabel={nodes.find((n) => n.id === tableBuilderNodeId)?.data.label}
          onClose={() => setTableBuilderNodeId(null)}
          onSave={handleSaveTableData}
        />
      )}

      {/* Sample Builder Modal */}
      {sampleBuilderNodeId && (
        <SampleBuilder
          initialData={nodes.find((n) => n.id === sampleBuilderNodeId)?.data.sampleData}
          nodeLabel={nodes.find((n) => n.id === sampleBuilderNodeId)?.data.label}
          onClose={() => setSampleBuilderNodeId(null)}
          onSave={handleSaveSampleData}
        />
      )}

      {/* Rubric / MCA Builder Modal */}
      {rubricBuilderNodeId && (
        <RubricBuilder
          mode={nodes.find((n) => n.id === rubricBuilderNodeId)?.type === 'mca' ? 'mca' : 'rubric'}
          initialData={nodes.find((n) => n.id === rubricBuilderNodeId)?.data.rubricData}
          nodeLabel={nodes.find((n) => n.id === rubricBuilderNodeId)?.data.label}
          onClose={() => setRubricBuilderNodeId(null)}
          onSave={handleSaveRubricData}
        />
      )}
    </>
  );
};

export default FloatingDialogManager;

