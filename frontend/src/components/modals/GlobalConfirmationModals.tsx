import React from 'react';
import { Save, Clock, CheckCircle2, AlertTriangle, Info, Trash2 } from 'lucide-react';

export interface GlobalConfirmationModalsProps {
  showSaveConfirmModal: boolean;
  handleNewWorkflowConfirmNo: () => void;
  handleNewWorkflowConfirmYes: () => void | Promise<void>;

  showSchedulerPopup: boolean;
  setShowSchedulerPopup: React.Dispatch<React.SetStateAction<boolean>>;
  schedulerPopupWorkflowName: string;
  schedulerPopupRound: number;

  customAlert: { show: boolean; title: string; message: string; type: 'error' | 'success' | 'info' };
  setCustomAlert: React.Dispatch<React.SetStateAction<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'info' }>>;

  queueToClear: 'pdf' | 'txt' | 'zip' | 'agent' | null;
  setQueueToClear: React.Dispatch<React.SetStateAction<'pdf' | 'txt' | 'zip' | 'agent' | null>>;
  selectedWorkflowId: string | null;
  selectedNode: any;
  updateSelectedNodeData: (field: string, val: any) => void;
  setServerPdfQueueFiles: React.Dispatch<React.SetStateAction<any[]>>;
  setServerZipQueueFiles: React.Dispatch<React.SetStateAction<any[]>>;
  setServerTxtQueueFiles: React.Dispatch<React.SetStateAction<any[]>>;
  showAlert: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
  backendUrl?: string;
}

export default function GlobalConfirmationModals({
  showSaveConfirmModal,
  handleNewWorkflowConfirmNo,
  handleNewWorkflowConfirmYes,

  showSchedulerPopup,
  setShowSchedulerPopup,
  schedulerPopupWorkflowName,
  schedulerPopupRound,

  customAlert,
  setCustomAlert,

  queueToClear,
  setQueueToClear,
  selectedWorkflowId,
  selectedNode,
  updateSelectedNodeData,
  setServerPdfQueueFiles,
  setServerZipQueueFiles,
  setServerTxtQueueFiles,
  showAlert,
  backendUrl,
}: GlobalConfirmationModalsProps) {
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

  return (
    <>
      {/* Save Confirm Modal */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-96 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-2xl select-none">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-2 flex items-center space-x-2 font-mono">
              <Save className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <span>Save Workflow</span>
            </h3>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              You have unsaved changes. Would you like to save the current workflow before clearing the canvas?
            </p>

            <div className="flex space-x-2.5 justify-end">
              <button
                onClick={handleNewWorkflowConfirmNo}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-xs"
              >
                No
              </button>
              <button
                onClick={handleNewWorkflowConfirmYes}
                className="px-5 py-2 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs transition-colors cursor-pointer"
              >
                Yes, Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduler Trigger Popup Modal */}
      {showSchedulerPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-[420px] bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-2xl select-none relative overflow-hidden">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2 font-mono">
              <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
              <span>Scheduler Triggered</span>
            </h3>

            <div className="space-y-3 mb-6">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The countdown timer for workflow <strong className="text-zinc-900 dark:text-zinc-100 font-bold">"{schedulerPopupWorkflowName}"</strong> has reached 0.
              </p>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider font-mono">Trigger Round:</span>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-200/80 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-2.5 py-0.5 rounded-full">
                  Round {schedulerPopupRound}
                </span>
              </div>

              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                The execution run has been initiated in the background. You can monitor the progress and outputs in the Log Viewer at the bottom.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSchedulerPopup(false)}
                className="px-5 py-2 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs transition-colors cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Theme Dialog Box */}
      {customAlert.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
          <div className="max-w-md w-full bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-150">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center space-x-2 text-zinc-900 dark:text-zinc-100 font-mono">
                {customAlert.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {customAlert.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                {customAlert.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                <span>{customAlert.title}</span>
              </h3>

              <button
                onClick={() => setCustomAlert(prev => ({ ...prev, show: false }))}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap select-text">
                {customAlert.message}
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex justify-end">
              <button
                onClick={() => setCustomAlert(prev => ({ ...prev, show: false }))}
                className="px-5 py-2 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs transition-colors cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Central Confirm Clear Queue Dialog Box */}
      {queueToClear && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl p-6 max-w-md w-full mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center mb-1">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>

              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide font-mono">
                Clear {queueToClear === 'pdf' ? 'PDF' : queueToClear === 'txt' ? 'TXT' : queueToClear === 'zip' ? 'ZIP' : 'Agent'} Queue
              </h2>

              <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                Are you sure you want to permanently clear the entire queue? <br />
                <span className="text-red-500 dark:text-red-400 font-semibold">This will delete all corresponding files on the backend server.</span>
              </p>

              <div className="flex space-x-3 w-full pt-4">
                <button
                  onClick={() => setQueueToClear(null)}
                  className="flex-1 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium font-mono transition-colors cursor-pointer shadow-xs"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    try {
                      const wfParam = selectedWorkflowId || 'wf_default';
                      if (queueToClear === 'pdf') {
                        await fetch(`${BACKEND_URL}/api/clear-pdf-queue?workflow_id=${encodeURIComponent(wfParam)}`, { method: 'DELETE' });
                        if (selectedNode) {
                          updateSelectedNodeData('parameters', { ...(selectedNode.data.parameters || {}), pdfQueue: [], queueLength: 0 });
                        }
                        setServerPdfQueueFiles([]);
                        showAlert("PDF Queue cleared successfully.", "Clear Success", "success");
                      } else if (queueToClear === 'zip') {
                        await fetch(`${BACKEND_URL}/api/clear-zip-queue?workflow_id=${encodeURIComponent(wfParam)}`, { method: 'DELETE' });
                        if (selectedNode) {
                          updateSelectedNodeData('parameters', { ...(selectedNode.data.parameters || {}), zipQueue: [], queueLength: 0 });
                        }
                        setServerZipQueueFiles([]);
                        showAlert("Zip Queue cleared successfully.", "Clear Success", "success");
                      } else if (queueToClear === 'txt') {
                        await fetch(`${BACKEND_URL}/api/clear-txt-queue?workflow_id=${encodeURIComponent(wfParam)}`, { method: 'DELETE' });
                        if (selectedNode) {
                          updateSelectedNodeData('parameters', { ...(selectedNode.data.parameters || {}), txtQueue: [], queueLength: 0 });
                        }
                        setServerTxtQueueFiles([]);
                        showAlert("TXT Queue cleared successfully.", "Clear Success", "success");
                      }
                    } catch (err) {
                      console.error('Error clearing queue:', err);
                      showAlert("Failed to clear queue.", "Clear Error", "error");
                    }
                    setQueueToClear(null);
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-mono font-medium text-xs uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer flex justify-center items-center space-x-2"
                >
                  <span>Confirm Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
