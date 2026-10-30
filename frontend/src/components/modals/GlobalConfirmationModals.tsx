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

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">

          <div className="w-96 bg-cyber-panel border-2 border-cyber-neon rounded-xl p-6 shadow-[0_0_25px_rgba(212,255,58,0.25)] select-none">

            <h3 className="text-sm font-extrabold uppercase tracking-widest text-cyber-neon mb-3 flex items-center space-x-2">

              <Save className="w-5 h-5 text-cyber-neon" />

              <span>Save work flow</span>

            </h3>

            <p className="text-xs text-cyber-text mb-6 leading-relaxed">

              You have unsaved changes. Would you like to save the current work flow to your file before clearing the screen?

            </p>

            <div className="flex space-x-3 justify-end">

              <button

                onClick={handleNewWorkflowConfirmNo}

                className="px-4 py-2 text-xs font-bold rounded-lg border border-cyber-border hover:border-red-500 bg-cyber-dark text-cyber-muted hover:text-red-500 transition-all cursor-pointer"

              >

                No

              </button>

              <button

                onClick={handleNewWorkflowConfirmYes}

                className="px-5 py-2 text-xs font-bold rounded-lg bg-cyber-neon hover:bg-opacity-80 text-cyber-dark shadow-neon-glow font-extrabold transition-all cursor-pointer"

              >

                Yes

              </button>

            </div>

          </div>

        </div>

      )}

      {/* Scheduler Trigger Popup Modal */}

      {showSchedulerPopup && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">

          <div className="w-[420px] bg-cyber-panel border-2 border-cyber-neon rounded-2xl p-6 shadow-[0_0_40px_rgba(212,255,58,0.35)] select-none relative overflow-hidden">

            {/* Glow background flare */}

            <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyber-neon opacity-10 rounded-full blur-2xl pointer-events-none" />

            

            <h3 className="text-base font-extrabold uppercase tracking-widest text-cyber-neon mb-4 flex items-center space-x-2.5">

              <Clock className="w-6 h-6 text-cyber-neon animate-pulse" />

              <span>Scheduler Triggered</span>

            </h3>

            

            <div className="space-y-3 mb-6">

              <p className="text-xs text-cyber-muted leading-relaxed">

                The countdown timer for workflow <strong className="text-cyber-text font-bold">"{schedulerPopupWorkflowName}"</strong> has reached 0.

              </p>

              <div className="bg-cyber-dark bg-opacity-50 border border-cyber-border rounded-xl p-3.5 flex items-center justify-between">

                <span className="text-[10px] text-cyber-muted font-bold uppercase tracking-wider">Trigger Round:</span>

                <span className="text-xs font-mono font-black text-cyber-neon bg-cyber-neon bg-opacity-10 border border-cyber-neon border-opacity-35 px-2.5 py-0.5 rounded-full">

                  Round {schedulerPopupRound}

                </span>

              </div>

              <p className="text-[10px] text-cyber-muted italic leading-relaxed">

                The execution run has been initiated in the background. You can monitor the progress and outputs in the Log Viewer at the bottom of the screen.

              </p>

            </div>



            <div className="flex justify-end">

              <button

                onClick={() => setShowSchedulerPopup(false)}

                className="px-6 py-2 text-xs font-extrabold rounded-lg bg-cyber-neon hover:bg-opacity-80 text-cyber-dark shadow-neon-glow hover:scale-105 transition-all cursor-pointer"

              >

                Acknowledge

              </button>

            </div>

          </div>

        </div>

      )}


      {/* Custom Theme Dialog Box */}

      {customAlert.show && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4 animate-fade-in select-none">

          <div className={`max-w-md w-full bg-cyber-panel border-2 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 ${

            customAlert.type === 'success' ? 'border-cyber-neon shadow-[0_0_20px_rgba(0,255,243,0.2)]' :

            customAlert.type === 'error' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :

            'border-cyber-border-hover shadow-[0_0_20px_rgba(212,255,58,0.1)]'

          }`}>

            {/* Header */}

            <div className="px-5 py-4 border-b border-cyber-border border-opacity-40 bg-cyber-dark bg-opacity-45 flex items-center justify-between">

              <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center space-x-2 ${

                customAlert.type === 'success' ? 'text-cyber-neon' :

                customAlert.type === 'error' ? 'text-red-400' :

                'text-cyber-text'

              }`}>

                {customAlert.type === 'success' && <CheckCircle2 className="w-4 h-4 text-cyber-neon" />}

                {customAlert.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}

                {customAlert.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}

                <span>{customAlert.title}</span>

              </h3>

              <button 

                onClick={() => setCustomAlert(prev => ({ ...prev, show: false }))}

                className="text-cyber-muted hover:text-cyber-neon transition-colors cursor-pointer text-xs"

              >

                ✕

              </button>

            </div>

            

            {/* Body */}

            <div className="px-6 py-6 bg-cyber-dark bg-opacity-15">

              <p className="text-xs text-cyber-text leading-relaxed font-semibold whitespace-pre-wrap select-text">

                {customAlert.message}

              </p>

            </div>

            

            {/* Footer */}

            <div className="px-5 py-3 border-t border-cyber-border border-opacity-40 bg-cyber-dark bg-opacity-45 flex justify-end">

              <button

                onClick={() => setCustomAlert(prev => ({ ...prev, show: false }))}

                className={`px-5 py-2 text-xs font-extrabold rounded-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${

                  customAlert.type === 'success' ? 'bg-cyber-neon text-cyber-dark shadow-neon-glow' :

                  customAlert.type === 'error' ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]' :

                  'bg-cyber-panel text-cyber-neon border border-cyber-border hover:border-cyber-neon hover:text-cyber-text'

                }`}

              >

                Acknowledge

              </button>

            </div>

          </div>

        </div>

      )}



              {/* Central Luxury Confirm Clear Queue Dialog Box */}

              {queueToClear && (

                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-85 backdrop-blur-lg animate-fadeIn select-none">

                  <div className="bg-cyber-dark border-2 border-red-500 shadow-[0_0_60px_rgba(248,113,113,0.4)] rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all relative overflow-hidden">

                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-pink-500"></div>

                    <div className="flex flex-col items-center text-center space-y-4">

                      <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-10 border border-red-500 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(248,113,113,0.3)]">

                        <Trash2 className="w-8 h-8 text-red-500" />

                      </div>

                      <h2 className="text-xl font-black text-white uppercase tracking-widest font-mono">

                        Clear {queueToClear === 'pdf' ? 'PDF' : queueToClear === 'txt' ? 'TXT' : queueToClear === 'zip' ? 'ZIP' : 'Agent'} Queue

                      </h2>

                      <p className="text-gray-300 text-sm leading-relaxed">

                        Are you sure you want to permanently clear the entire queue? <br/>

                        <span className="text-red-400 font-bold">This will delete all corresponding files on the backend server.</span>

                      </p>

                      

                      <div className="flex space-x-4 w-full pt-4">

                        <button

                          onClick={() => setQueueToClear(null)}

                          className="flex-1 py-2.5 bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer"

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

                          className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_10px_rgba(248,113,113,0.5)] hover:shadow-[0_0_15px_rgba(248,113,113,0.8)] transform active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center space-x-2"

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
