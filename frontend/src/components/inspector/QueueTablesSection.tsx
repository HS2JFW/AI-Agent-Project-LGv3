import React, { useState } from 'react';
import { FileText, FileUp, Trash2 } from 'lucide-react';

export interface QueueTablesSectionProps {
  selectedNode: any;
  edges: any[];
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  selectedWorkflowId: string | null;
  updateSelectedNodeData: (field: string, value: any) => void;
  isSelectedPdfQueueNode: boolean;
  isSelectedTxtQueueNode: boolean;
  isSelectedZipQueueNode: boolean;
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
  openDialog: (type: 'agent_result' | 'pdf_queue' | 'json' | 'zip_queue' | 'txt_queue', filename: string, rawContent?: string) => void;
  showAlert: (msg: string, title?: string, type?: 'info' | 'success' | 'error') => void;
  backendUrl?: string;
}

export const QueueTablesSection: React.FC<QueueTablesSectionProps> = ({
  selectedNode,
  edges,
  setNodes,
  selectedWorkflowId,
  updateSelectedNodeData,
  isSelectedPdfQueueNode,
  isSelectedTxtQueueNode,
  isSelectedZipQueueNode,
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
  openDialog,
  showAlert,
  backendUrl,
}) => {
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const getCleanFileName = (fileUrl: any) => {
    if (!fileUrl || typeof fileUrl !== 'string') return '';
    let name = fileUrl;
    if (name.includes('?')) {
      name = name.split('?')[0];
    }
    if (name.includes('/')) {
      name = name.substring(name.lastIndexOf('/') + 1);
    }
    let changed = true;
    while (changed) {
      changed = false;
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_?/;
      if (uuidRegex.test(name)) {
        name = name.replace(uuidRegex, '');
        changed = true;
        continue;
      }
      const nodeRegex = /^node_[a-zA-Z0-9-]+_|^[a-zA-Z0-9-]+_node_[a-zA-Z0-9-]+_|^[0-9a-fA-F-]{36}_[a-zA-Z0-9-]+_/;
      if (nodeRegex.test(name)) {
        name = name.replace(nodeRegex, '');
        changed = true;
        continue;
      }
      if (selectedWorkflowId && name.startsWith(selectedWorkflowId + '_')) {
        name = name.substring(selectedWorkflowId.length + 1);
        changed = true;
        continue;
      }
      const prefixPattern = /^[^_]+_(node_[^_\.]+|[^_\.]+)_/;
      if (prefixPattern.test(name)) {
        name = name.replace(prefixPattern, '');
        changed = true;
        continue;
      }
    }
    return name;
  };


  if (!isSelectedPdfQueueNode && !isSelectedTxtQueueNode && !isSelectedZipQueueNode) {
    return null;
  }

  return (
    <>
                {/* PDF Queue Parameter Editor */}

                {isSelectedPdfQueueNode && (() => {

                  const getPdfList = () => {

                    const cleanList = (rawList: any[]) => {

                      const filtered = rawList.map(item => {

                        if (item && typeof item === 'object') return item.disk_name || item.url || item.filename || '';

                        return typeof item === 'string' ? item : JSON.stringify(item);

                      }).filter(item => {

                        if (!item) return false;

                        const trimmed = item.trim();

                        if (trimmed.includes('/rest/v1') || trimmed.endsWith('/')) {

                          return false;

                        }

                        return true;

                      });

                      return Array.from(new Set(filtered));

                    };



                    const execQueue = selectedNode.data.parameters?.pdfQueue;

                    if (execQueue && Array.isArray(execQueue) && execQueue.length > 0) {

                      return cleanList(execQueue);

                    } else if (execQueue && typeof execQueue === 'object' && Object.keys(execQueue).length > 0) {

                      return cleanList(Object.values(execQueue));

                    }

                    const urlsStr = selectedNode.data.parameters?.supabaseUrls || '';

                    let list: string[] = [];

                    if (urlsStr.trim().startsWith('[') && urlsStr.trim().endsWith(']')) {

                      try {

                        const parsed = JSON.parse(urlsStr);

                        if (Array.isArray(parsed)) {

                          list = parsed.map((item: any) => typeof item === 'object' && item !== null ? (item.file_url || item.url || item.name || JSON.stringify(item)) : String(item));

                        }

                      } catch (e) {}

                    }

                    if (list.length === 0) {

                      list = urlsStr.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);

                    }

                    return cleanList(list);

                  };



                  const handleOpenPdf = (url: string) => {

                        if (!url) return;

                        console.log(`[handleOpenPdf] Clicked URL/Filename:`, url);

                        

                        // Extract just the filename from any URL or path

                        const filename = url.split('/').pop()?.split('?')[0] || url;

                        

                        const wfParam = selectedWorkflowId || 'wf_default';

                        const finalUrl = `${BACKEND_URL}/api/queue-pdf/${encodeURIComponent(filename)}?workflow_id=${encodeURIComponent(wfParam)}`;

                        

                        console.log(`[handleOpenPdf] Extracted filename:`, filename);

                        console.log(`[handleOpenPdf] Opening local backend URL:`, finalUrl);

                        

                        openDialog('pdf_queue', finalUrl);

                      };



                  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

                    const files = e.target.files;

                    if (!files || files.length === 0) return;

                    const formData = new FormData();

                    Array.from(files).forEach((f) => {

                      if (f.name.toLowerCase().endsWith('.pdf')) {

                        formData.append('files', f);

                      }

                    });

                    try {

                      const currentQueueLen = (Array.isArray(selectedNode.data.parameters?.pdfQueue) ? selectedNode.data.parameters?.pdfQueue : getPdfList()).length;

                      const startIdx = currentQueueLen + 1;

                      const uploadUrl = `${BACKEND_URL}/api/upload-pdf-queue?workflow_id=${encodeURIComponent(selectedWorkflowId || 'wf_default')}&node_id=${encodeURIComponent(selectedNode.id)}&start_index=${startIdx}`;

                      const res = await fetch(uploadUrl, {

                        method: 'POST',

                        body: formData,

                      });

                      const data = await res.json();

                      if (data.status === 'success') {

                        const uploadedFiles = Array.isArray(data.filenames) ? data.filenames : [];

                        const currentQueue = Array.isArray(selectedNode.data.parameters?.pdfQueue) ? selectedNode.data.parameters?.pdfQueue : getPdfList();

                        const newQueue = Array.from(new Set([...currentQueue, ...uploadedFiles]));

                        updateSelectedNodeData('parameters', {

                          ...(selectedNode.data.parameters || {}),

                          pdfQueue: newQueue,

                          queueLength: newQueue.length

                        });

                        

                        // SYNC QUEUE LENGTH TO CHILD NODES

                        setNodes((nds) => {

                          const childNodeIds = edges.filter(e => e.source === selectedNode.id).map(e => e.target);

                          if (childNodeIds.length === 0) return nds;

                          return nds.map((n) => {

                            if (childNodeIds.includes(n.id)) {

                              return {

                                ...n,

                                data: {

                                  ...n.data,

                                  parameters: {

                                    ...(n.data.parameters || {}),

                                    queueLength: newQueue.length,

                                    previousMaxList: (() => {

                                      const updated = { ...(n.data.parameters?.previousMaxList || {}) };

                                      delete updated[`${selectedNode.id}_output`];

                                      updated[selectedNode.id] = newQueue.length;

                                      return updated;

                                    })()

                                  }

                                }

                              };

                            }

                            return n;

                          });

                        });

                      }

                    } catch (err) {

                      console.error('Error uploading PDFs:', err);

                    }

                  };



                  const handleClearAllPdfQueue = async () => {

                        try {

                          const wfParam = selectedWorkflowId || 'wf_default';

                          const nodeIdParam = selectedNode?.id || 'node_queue';

                          await fetch(`${BACKEND_URL}/api/clear-pdf-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(nodeIdParam)}`, { method: 'DELETE' });

                          updateSelectedNodeData('parameters', {

                            ...(selectedNode.data.parameters || {}),

                            pdfQueue: [],

                            queueLength: 0

                          });

                          setServerPdfQueueFiles([]);

                          showAlert("PDF Queue cleared successfully.", "Clear Success", "success");

                        } catch (err) {

                          console.error('Error clearing PDF queue:', err);

                          showAlert("Failed to clear PDF queue.", "Clear Error", "error");

                        }

                      };

  

                    const pdfList = getPdfList();

  

                    const orderedPdfList = (() => {

                      if (serverPdfQueueFiles && serverPdfQueueFiles.length > 0) {

                        const serverUrls = serverPdfQueueFiles.map((x: any) => x.filename);

                        const extraLocal = pdfList.filter((u: string) => !serverUrls.includes(u));

                        return [...serverUrls, ...extraLocal];

                      }

                      return [...pdfList];

                    })();

  

                    return (

                      <>

                        {/* PDF Upload / Drag & Drop Zone */}

                        <div className="space-y-1.5">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted flex items-center justify-between">

                              <span>Upload PDF Files (Drop / Select)</span>

                              <span className="text-cyber-neon/70 font-mono lowercase opacity-70" title="Data Source Path">Source: WF/{selectedWorkflowId || 'wf_default'}/Input</span>

                            </label>

                          <div className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group ${isDraggingPdf ? 'border-cyber-neon bg-cyber-dark bg-opacity-70 shadow-[0_0_15px_rgba(0,255,200,0.5)]' : 'border-cyber-border hover:border-cyber-neon bg-cyber-dark bg-opacity-50'}`}>

                            <input

                              type="file"

                              accept=".pdf"

                              multiple

                              onChange={(e) => { setIsDraggingPdf(false); handlePdfFileUpload(e); }}

                              onDragEnter={() => setIsDraggingPdf(true)}

                              onDragLeave={() => setIsDraggingPdf(false)}

                              onDrop={() => setIsDraggingPdf(false)}

                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"

                              title="Click or Drop PDF files here to upload"

                            />

                            <div className="flex flex-col items-center justify-center space-y-2 relative z-0 pointer-events-none">

                              <div className="p-3 bg-cyber-dark rounded-full shadow-inner group-hover:scale-110 transition-transform duration-300 border border-cyber-border">

                                <FileUp className="w-6 h-6 text-cyber-neon" />

                              </div>

                              <div>

                                <span className="font-bold text-cyber-neon uppercase tracking-wide block">Click to upload</span>

                                <span className="text-[10px] text-cyber-muted mt-1 block">or drag and drop</span>

                                <span className="text-[9px] text-cyber-muted opacity-50 block mt-0.5">PDF (MAX. 10MB)</span>

                              </div>

                            </div>

                          </div>

                        </div>



                        {/* Display PDF Queue Table list */}

                        <div className="space-y-1.5">

                          <div className="flex items-center justify-between">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              Queue Files Table ({orderedPdfList.length})

                            </label>

                            <button

                              type="button"

                              onClick={handleClearAllPdfQueue}

                              className="text-[10px] font-mono border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-xs"

                              title="Clear all PDF files from Queue Table & delete files on Backend server"

                            >

                              <Trash2 className="w-2.5 h-2.5" /> Clear

                            </button>

                          </div>

                          <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                            <table className="w-full text-left border-collapse">

                              <thead>

                                <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted">

                                  <th className="py-2 px-3 text-center w-12">View</th>

                                  <th className="py-2 px-3 text-center w-12">ID</th>

                                  <th className="py-2 px-3">File Name / URL</th>

                                  <th className="py-2 px-3 text-center w-20">Status</th>

                                </tr>

                              </thead>

                              <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                {orderedPdfList.length === 0 ? (

                                <tr>

                                  <td colSpan={4} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                    No PDF files in queue. Drop files above or connect inputs.

                                  </td>

                                </tr>

                              ) : (

                                (() => {

                                  const PAGE_SIZE = 10;

                                  const totalPdfPages = Math.ceil(orderedPdfList.length / PAGE_SIZE) || 1;

                                  const currentPdfQueuePage = Math.min(pdfQueuePage, totalPdfPages);

                                  const startIdx = (currentPdfQueuePage - 1) * PAGE_SIZE;

                                  const paginatedPdfList = orderedPdfList.slice(startIdx, startIdx + PAGE_SIZE);



                                  return paginatedPdfList.map((url: string, pageIdx: number) => {

                                    const globalIdx = startIdx + pageIdx;

                                    const cleanName = getCleanFileName(url); void cleanName;

                                    

                                    // Logic for PDF Queue Table Status

                                    const serverUrls = serverPdfQueueFiles ? serverPdfQueueFiles.map((x: any) => x.filename) : [];

                                    const isComplete = serverUrls.includes(url);



                                    return (

                                      <tr key={globalIdx} className={`${

                                        isComplete ? 'text-emerald-300 bg-emerald-950 bg-opacity-20' : 'text-cyber-text'

                                      }`}>

                                        <td className="py-2 px-3 text-center">

                                          <button

                                            onClick={() => handleOpenPdf(url)}

                                            className={`p-1 rounded transition-colors cursor-pointer ${

                                              isComplete ? 'text-emerald-400 hover:bg-emerald-900 hover:bg-opacity-40' : 'text-cyber-muted hover:text-cyber-neon hover:bg-cyber-panel'

                                            }`}

                                            title="Open PDF File"

                                          >

                                            <FileText className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                        <td className="py-2 px-3 text-center font-mono font-bold text-cyber-muted text-[10px]">

                                          {globalIdx + 1}

                                        </td>

                                        <td className="py-2 px-3 truncate max-w-[150px]" title={url}>

                                          {url.split('/').pop()?.split('?')[0] || url}

                                        </td>

                                        <td className="py-2 px-3 text-center">

                                          {isComplete ? (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">

                                              Complete

                                            </span>

                                          ) : (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase text-cyber-muted border border-cyber-border">

                                              Queue

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



                        {/* PDF Queue Table Pagination Controls */}

                        {(() => {

                          const PAGE_SIZE = 10;

                          const totalPdfPages = Math.ceil(orderedPdfList.length / PAGE_SIZE) || 1;

                          const currentPdfQueuePage = Math.min(pdfQueuePage, totalPdfPages);



                          if (totalPdfPages <= 1) return null;

                          return (

                            <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-cyber-muted select-none">

                              <span className="font-mono">

                                Page {currentPdfQueuePage} / {totalPdfPages}

                              </span>

                              <div className="flex items-center gap-1">

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === 1}

                                  onClick={() => setPdfQueuePage(1)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === 1

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="First Page"

                                >

                                  &lt;&lt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === 1}

                                  onClick={() => setPdfQueuePage(prev => Math.max(1, prev - 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === 1

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

                                  let startPage = Math.max(1, currentPdfQueuePage - Math.floor(maxPagesToShow / 2));

                                  let endPage = Math.min(totalPdfPages, startPage + maxPagesToShow - 1);

                                  if (endPage - startPage + 1 < maxPagesToShow) {

                                    startPage = Math.max(1, endPage - maxPagesToShow + 1);

                                  }

                                  for (let p = startPage; p <= endPage; p++) {

                                    pages.push(

                                      <button

                                        key={p}

                                        type="button"

                                        onClick={() => setPdfQueuePage(p)}

                                        className={`px-1.5 py-0.5 rounded border text-[8px] font-mono transition-colors cursor-pointer ${

                                          currentPdfQueuePage === p

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

                                  disabled={currentPdfQueuePage === totalPdfPages}

                                  onClick={() => setPdfQueuePage(prev => Math.min(totalPdfPages, prev + 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === totalPdfPages

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Next Page"

                                >

                                  &gt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === totalPdfPages}

                                  onClick={() => setPdfQueuePage(totalPdfPages)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === totalPdfPages

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



                      <div className="p-3 bg-cyber-dark bg-opacity-70 border border-cyber-border rounded-lg space-y-1 text-[10px] leading-relaxed text-cyber-muted">

                        <span className="font-bold text-cyber-neon uppercase block">📦 Queue Status</span>

                        <div>Current Index: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentIndex ?? 0}</span></div>

                        <div>Queue Length: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.queueLength ?? 0}</span></div>

                        <div className="truncate">Current URL: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentUrl || 'None'}</span></div>

                        <div>Has Next: <span className={selectedNode.data.parameters?.hasNext ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{(selectedNode.data.parameters?.hasNext ?? false).toString()}</span></div>

                      </div>

                    </>

                  );

                })()}



                {/* Zip Queue Parameter Editor */}



                {isSelectedTxtQueueNode && (() => {

                  const getPdfList = () => {

                    const cleanList = (rawList: any[]) => {

                      const filtered = rawList.map(item => {

                        if (item && typeof item === 'object') return item.disk_name || item.url || item.filename || '';

                        return typeof item === 'string' ? item : JSON.stringify(item);

                      }).filter(item => {

                        if (!item) return false;

                        const trimmed = item.trim();

                        if (trimmed.includes('/rest/v1') || trimmed.endsWith('/')) {

                          return false;

                        }

                        return true;

                      });

                      return Array.from(new Set(filtered));

                    };



                    const execQueue = selectedNode.data.parameters?.txtQueue;

                    if (execQueue && Array.isArray(execQueue) && execQueue.length > 0) {

                      return cleanList(execQueue);

                    } else if (execQueue && typeof execQueue === 'object' && Object.keys(execQueue).length > 0) {

                      return cleanList(Object.values(execQueue));

                    }

                    const urlsStr = selectedNode.data.parameters?.supabaseUrls || '';

                    let list: string[] = [];

                    if (urlsStr.trim().startsWith('[') && urlsStr.trim().endsWith(']')) {

                      try {

                        const parsed = JSON.parse(urlsStr);

                        if (Array.isArray(parsed)) {

                          list = parsed.map((item: any) => typeof item === 'object' && item !== null ? (item.file_url || item.url || item.name || JSON.stringify(item)) : String(item));

                        }

                      } catch (e) {}

                    }

                    if (list.length === 0) {

                      list = urlsStr.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);

                    }

                    return cleanList(list);

                  };



                  const handleOpenPdf = (url: string) => {

                        if (!url) return;

                        console.log(`[handleOpenPdf] Clicked URL/Filename:`, url);

                        

                        // Extract just the filename from any URL or path

                        const filename = url.split('/').pop()?.split('?')[0] || url;

                        

                        const wfParam = selectedWorkflowId || 'wf_default';

                        const finalUrl = `${BACKEND_URL}/api/queue-pdf/${encodeURIComponent(filename)}?workflow_id=${encodeURIComponent(wfParam)}`;

                        

                        console.log(`[handleOpenPdf] Extracted filename:`, filename);

                        console.log(`[handleOpenPdf] Opening local backend URL:`, finalUrl);

                        

                        openDialog('txt_queue', finalUrl);

                      };



                  const handleTxtFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

                    const files = e.target.files;

                    if (!files || files.length === 0) return;

                    const formData = new FormData();

                    Array.from(files).forEach((f) => {

                      if (f.name.toLowerCase().endsWith('.txt') || f.name.toLowerCase().endsWith('.md')) {

                        formData.append('files', f);

                      }

                    });

                    try {

                      const currentQueueLen = (Array.isArray(selectedNode.data.parameters?.txtQueue) ? selectedNode.data.parameters?.txtQueue : getPdfList()).length;

                      const startIdx = currentQueueLen + 1;

                      const uploadUrl = `${BACKEND_URL}/api/upload-txt-queue?workflow_id=${encodeURIComponent(selectedWorkflowId || 'wf_default')}&node_id=${encodeURIComponent(selectedNode.id)}&start_index=${startIdx}`;

                      const res = await fetch(uploadUrl, {

                        method: 'POST',

                        body: formData,

                      });

                      const data = await res.json();

                      if (data.status === 'success') {

                        const uploadedFiles = Array.isArray(data.filenames) ? data.filenames : [];

                        const currentQueue = Array.isArray(selectedNode.data.parameters?.txtQueue) ? selectedNode.data.parameters?.txtQueue : getPdfList();

                        const newQueue = Array.from(new Set([...currentQueue, ...uploadedFiles]));

                        updateSelectedNodeData('parameters', {

                          ...(selectedNode.data.parameters || {}),

                          txtQueue: newQueue,

                          queueLength: newQueue.length,

                          currentIndex: selectedNode.data.parameters?.currentIndex || 1

                        });

                        

                        // SYNC QUEUE LENGTH TO CHILD NODES

                        setNodes((nds) => {

                          const childNodeIds = edges.filter(e => e.source === selectedNode.id).map(e => e.target);

                          if (childNodeIds.length === 0) return nds;

                          return nds.map((n) => {

                            if (childNodeIds.includes(n.id)) {

                              return {

                                ...n,

                                data: {

                                  ...n.data,

                                  parameters: {

                                    ...(n.data.parameters || {}),

                                    queueLength: newQueue.length,

                                    previousMaxList: (() => {

                                      const updated = { ...(n.data.parameters?.previousMaxList || {}) };

                                      delete updated[`${selectedNode.id}_output`];

                                      updated[selectedNode.id] = newQueue.length;

                                      return updated;

                                    })()

                                  }

                                }

                              };

                            }

                            return n;

                          });

                        });

                      }

                    } catch (err) {

                      console.error('Error uploading TXTs:', err);

                    }

                  };



                  const handleClearAllTxtQueue = async () => {

                        try {

                          const wfParam = selectedWorkflowId || 'wf_default';

                          const nodeIdParam = selectedNode?.id || 'node_queue';

                          await fetch(`${BACKEND_URL}/api/clear-txt-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(nodeIdParam)}`, { method: 'DELETE' });

                          updateSelectedNodeData('parameters', {

                            ...(selectedNode.data.parameters || {}),

                            txtQueue: [],

                            queueLength: 0

                          });

                          setServerTxtQueueFiles([]);

                          showAlert("TXT Queue cleared successfully.", "Clear Success", "success");

                        } catch (err) {

                          console.error('Error clearing TXT queue:', err);

                          showAlert("Failed to clear TXT queue.", "Clear Error", "error");

                        }

                      };

  

                    const pdfList = getPdfList();

  

                    const orderedPdfList = (() => {

                      if (serverTxtQueueFiles && serverTxtQueueFiles.length > 0) {

                        const serverUrls = serverTxtQueueFiles.map((x: any) => x.filename);

                        const extraLocal = pdfList.filter((u: string) => !serverUrls.includes(u));

                        return [...serverUrls, ...extraLocal];

                      }

                      return [...pdfList];

                    })();

  

                    return (

                      <>

                        {/* TXT Upload / Drag & Drop Zone */}

                        <div className="space-y-1.5">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted flex items-center justify-between">

                              <span>Upload TXT Files (Drop / Select)</span>

                              <span className="text-cyber-neon/70 font-mono lowercase opacity-70" title="Data Source Path">Source: WF/{selectedWorkflowId || 'wf_default'}/Input</span>

                            </label>

                          <div className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group ${isDraggingPdf ? 'border-cyber-neon bg-cyber-dark bg-opacity-70 shadow-[0_0_15px_rgba(0,255,200,0.5)]' : 'border-cyber-border hover:border-cyber-neon bg-cyber-dark bg-opacity-50'}`}>

                            <input

                              type="file"

                              accept=".txt,.md"

                              multiple

                              onChange={(e) => { setIsDraggingPdf(false); handleTxtFileUpload(e); }}

                              onDragEnter={() => setIsDraggingPdf(true)}

                              onDragLeave={() => setIsDraggingPdf(false)}

                              onDrop={() => setIsDraggingPdf(false)}

                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"

                              title="Click or Drop TXT/MD files here to upload"

                            />

                            <div className="flex flex-col items-center justify-center space-y-2 relative z-0 pointer-events-none">

                              <div className="p-3 bg-cyber-dark rounded-full shadow-inner group-hover:scale-110 transition-transform duration-300 border border-cyber-border">

                                <FileUp className="w-6 h-6 text-cyber-neon" />

                              </div>

                              <div>

                                <span className="font-bold text-cyber-neon uppercase tracking-wide block">Click to upload</span>

                                <span className="text-[10px] text-cyber-muted mt-1 block">or drag and drop</span>

                                <span className="text-[9px] text-cyber-muted opacity-50 block mt-0.5">TXT (MAX. 10MB)</span>

                              </div>

                            </div>

                          </div>

                        </div>



                        {/* Display TXT Queue Table list */}

                        <div className="space-y-1.5">

                          <div className="flex items-center justify-between">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              Queue Files Table ({orderedPdfList.length})

                            </label>

                            <button

                              type="button"

                              onClick={handleClearAllTxtQueue}

                              className="text-[10px] font-mono border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-xs"

                              title="Clear all TXT/MD files from Queue Table & delete files on Backend server"

                            >

                              <Trash2 className="w-2.5 h-2.5" /> Clear

                            </button>

                          </div>

                          <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                            <table className="w-full text-left border-collapse">

                              <thead>

                                <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted">

                                  <th className="py-2 px-3 text-center w-12">View</th>

                                  <th className="py-2 px-3 text-center w-12">ID</th>

                                  <th className="py-2 px-3">File Name / URL</th>

                                  <th className="py-2 px-3 text-center w-20">Status</th>

                                </tr>

                              </thead>

                              <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                {orderedPdfList.length === 0 ? (

                                <tr>

                                  <td colSpan={4} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                    No TXT/MD files in queue. Drop files above or connect inputs.

                                  </td>

                                </tr>

                              ) : (

                                (() => {

                                  const PAGE_SIZE = 10;

                                  const totalTxtPages = Math.ceil(orderedPdfList.length / PAGE_SIZE) || 1;

                                  const currentPdfQueuePage = Math.min(txtQueuePage, totalTxtPages);

                                  const startIdx = (currentPdfQueuePage - 1) * PAGE_SIZE;

                                  const paginatedPdfList = orderedPdfList.slice(startIdx, startIdx + PAGE_SIZE);



                                  return paginatedPdfList.map((url: string, pageIdx: number) => {

                                    const globalIdx = startIdx + pageIdx;

                                    const cleanName = getCleanFileName(url); void cleanName;

                                    

                                    // Logic for TXT Queue Table Status

                                    const serverUrls = serverTxtQueueFiles ? serverTxtQueueFiles.map((x: any) => x.filename) : [];

                                    const isComplete = serverUrls.includes(url);



                                    return (

                                      <tr key={globalIdx} className={`${

                                        isComplete ? 'text-emerald-300 bg-emerald-950 bg-opacity-20' : 'text-cyber-text'

                                      }`}>

                                        <td className="py-2 px-3 text-center">

                                          <button

                                            onClick={() => handleOpenPdf(url)}

                                            className={`p-1 rounded transition-colors cursor-pointer ${

                                              isComplete ? 'text-emerald-400 hover:bg-emerald-900 hover:bg-opacity-40' : 'text-cyber-muted hover:text-cyber-neon hover:bg-cyber-panel'

                                            }`}

                                            title="Open TXT File"

                                          >

                                            <FileText className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                        <td className="py-2 px-3 text-center font-mono font-bold text-cyber-muted text-[10px]">

                                          {globalIdx + 1}

                                        </td>

                                        <td className="py-2 px-3 truncate max-w-[150px]" title={url}>

                                          {url.split('/').pop()?.split('?')[0] || url}

                                        </td>

                                        <td className="py-2 px-3 text-center">

                                          {isComplete ? (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">

                                              Complete

                                            </span>

                                          ) : (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase text-cyber-muted border border-cyber-border">

                                              Queue

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



                        {/* TXT Queue Table Pagination Controls */}

                        {(() => {

                          const PAGE_SIZE = 10;

                          const totalTxtPages = Math.ceil(orderedPdfList.length / PAGE_SIZE) || 1;

                          const currentPdfQueuePage = Math.min(txtQueuePage, totalTxtPages);



                          if (totalTxtPages <= 1) return null;

                          return (

                            <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-cyber-muted select-none">

                              <span className="font-mono">

                                Page {currentPdfQueuePage} / {totalTxtPages}

                              </span>

                              <div className="flex items-center gap-1">

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === 1}

                                  onClick={() => setTxtQueuePage(1)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === 1

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="First Page"

                                >

                                  &lt;&lt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === 1}

                                  onClick={() => setTxtQueuePage(prev => Math.max(1, prev - 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === 1

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

                                  let startPage = Math.max(1, currentPdfQueuePage - Math.floor(maxPagesToShow / 2));

                                  let endPage = Math.min(totalTxtPages, startPage + maxPagesToShow - 1);

                                  if (endPage - startPage + 1 < maxPagesToShow) {

                                    startPage = Math.max(1, endPage - maxPagesToShow + 1);

                                  }

                                  for (let p = startPage; p <= endPage; p++) {

                                    pages.push(

                                      <button

                                        key={p}

                                        type="button"

                                        onClick={() => setTxtQueuePage(p)}

                                        className={`px-1.5 py-0.5 rounded border text-[8px] font-mono transition-colors cursor-pointer ${

                                          currentPdfQueuePage === p

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

                                  disabled={currentPdfQueuePage === totalTxtPages}

                                  onClick={() => setTxtQueuePage(prev => Math.min(totalTxtPages, prev + 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === totalTxtPages

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Next Page"

                                >

                                  &gt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentPdfQueuePage === totalTxtPages}

                                  onClick={() => setTxtQueuePage(totalTxtPages)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentPdfQueuePage === totalTxtPages

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



                      <div className="p-3 bg-cyber-dark bg-opacity-70 border border-cyber-border rounded-lg space-y-1 text-[10px] leading-relaxed text-cyber-muted">

                        <span className="font-bold text-cyber-neon uppercase block">📦 Queue Status</span>

                        <div>Current Index: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentIndex ?? 0}</span></div>

                        <div>Queue Length: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.queueLength ?? 0}</span></div>

                        <div className="truncate">Current URL: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentUrl || 'None'}</span></div>

                        <div>Has Next: <span className={selectedNode.data.parameters?.hasNext ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{(selectedNode.data.parameters?.hasNext ?? false).toString()}</span></div>

                      </div>

                    </>

                  );

                })()}



                {/* Zip Queue Parameter Editor */}

                {isSelectedZipQueueNode && (() => {

                  const getPdfList = () => {

                    const cleanList = (rawList: any[]) => {

                      const filtered = rawList.map(item => {

                        if (item && typeof item === 'object') return item.disk_name || item.url || item.filename || '';

                        return typeof item === 'string' ? item : JSON.stringify(item);

                      }).filter(item => {

                        if (!item) return false;

                        const trimmed = item.trim();

                        if (trimmed.includes('/rest/v1') || trimmed.endsWith('/')) {

                          return false;

                        }

                        return true;

                      });

                      return Array.from(new Set(filtered));

                    };



                    const execQueue = selectedNode.data.parameters?.zipQueue;

                    if (execQueue && Array.isArray(execQueue) && execQueue.length > 0) {

                      return cleanList(execQueue);

                    } else if (execQueue && typeof execQueue === 'object' && Object.keys(execQueue).length > 0) {

                      return cleanList(Object.values(execQueue));

                    }

                    const urlsStr = selectedNode.data.parameters?.supabaseUrls || '';

                    let list: string[] = [];

                    if (urlsStr.trim().startsWith('[') && urlsStr.trim().endsWith(']')) {

                      try {

                        const parsed = JSON.parse(urlsStr);

                        if (Array.isArray(parsed)) {

                          list = parsed.map((item: any) => typeof item === 'object' && item !== null ? (item.file_url || item.url || item.name || JSON.stringify(item)) : String(item));

                        }

                      } catch (e) {}

                    }

                    if (list.length === 0) {

                      list = urlsStr.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);

                    }

                    return cleanList(list);

                  };



                  const handleOpenPdf = (url: string) => {

                        if (!url) return;

                        console.log(`[handleOpenPdf] Clicked URL/Filename:`, url);

                        

                        // Extract just the filename from any URL or path

                        const filename = url.split('/').pop()?.split('?')[0] || url;

                        

                        const wfParam = selectedWorkflowId || 'wf_default';

                        const finalUrl = `${BACKEND_URL}/api/queue-zip/${encodeURIComponent(filename)}?workflow_id=${encodeURIComponent(wfParam)}`;

                        

                        console.log(`[handleOpenPdf] Extracted filename:`, filename);

                        console.log(`[handleOpenPdf] Opening local backend URL:`, finalUrl);

                        

                        openDialog('zip_queue', finalUrl);

                      };



                  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

                    const files = e.target.files;

                    if (!files || files.length === 0) return;

                    const formData = new FormData();

                    Array.from(files).forEach((f) => {

                      if (f.name.toLowerCase().endsWith('.zip')) {

                        formData.append('files', f);

                      }

                    });

                    try {

                      const currentQueueLen = (Array.isArray(selectedNode.data.parameters?.zipQueue) ? selectedNode.data.parameters?.zipQueue : getPdfList()).length;

                      const startIdx = currentQueueLen + 1;

                      const uploadUrl = `${BACKEND_URL}/api/upload-zip-queue?workflow_id=${encodeURIComponent(selectedWorkflowId || 'wf_default')}&node_id=${encodeURIComponent(selectedNode.id)}&start_index=${startIdx}`;

                      const res = await fetch(uploadUrl, {

                        method: 'POST',

                        body: formData,

                      });

                      const data = await res.json();

                      if (data.status === 'success') {

                        const uploadedFiles = Array.isArray(data.filenames) ? data.filenames : [];

                        const currentQueue = Array.isArray(selectedNode.data.parameters?.zipQueue) ? selectedNode.data.parameters?.zipQueue : getPdfList();

                        const newQueue = Array.from(new Set([...currentQueue, ...uploadedFiles]));

                        updateSelectedNodeData('parameters', {

                          ...(selectedNode.data.parameters || {}),

                          zipQueue: newQueue,

                          queueLength: newQueue.length

                        });

                        

                        // SYNC QUEUE LENGTH TO CHILD NODES

                        setNodes((nds) => {

                          const childNodeIds = edges.filter(e => e.source === selectedNode.id).map(e => e.target);

                          if (childNodeIds.length === 0) return nds;

                          return nds.map((n) => {

                            if (childNodeIds.includes(n.id)) {

                              return {

                                ...n,

                                data: {

                                  ...n.data,

                                  parameters: {

                                    ...(n.data.parameters || {}),

                                    queueLength: newQueue.length,

                                    previousMaxList: (() => {

                                      const updated = { ...(n.data.parameters?.previousMaxList || {}) };

                                      delete updated[`${selectedNode.id}_output`];

                                      updated[selectedNode.id] = newQueue.length;

                                      return updated;

                                    })()

                                  }

                                }

                              };

                            }

                            return n;

                          });

                        });

                      }

                    } catch (err) {

                      console.error('Error uploading ZIPs:', err);

                    }

                  };



                  const handleClearAllZipQueue = async () => {

                        try {

                          const wfParam = selectedWorkflowId || 'wf_default';

                          const nodeIdParam = selectedNode?.id || 'node_queue';

                          await fetch(`${BACKEND_URL}/api/clear-zip-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(nodeIdParam)}`, { method: 'DELETE' });

                          updateSelectedNodeData('parameters', {

                            ...(selectedNode.data.parameters || {}),

                            zipQueue: [],

                            queueLength: 0

                          });

                          setServerZipQueueFiles([]);

                          showAlert("Zip Queue cleared successfully.", "Clear Success", "success");

                        } catch (err) {

                          console.error('Error clearing ZIP queue:', err);

                          showAlert("Failed to clear Zip queue.", "Clear Error", "error");

                        }

                      };

  

                    const zipList = getPdfList();

  

                    const orderedZipList = (() => {

                      if (serverZipQueueFiles && serverZipQueueFiles.length > 0) {

                        const serverUrls = serverZipQueueFiles.map((x: any) => x.filename);

                        const extraLocal = zipList.filter((u: string) => !serverUrls.includes(u));

                        return [...serverUrls, ...extraLocal];

                      }

                      return [...zipList];

                    })();

  

                    return (

                      <>

                        {/* ZIP Upload / Drag & Drop Zone */}

                        <div className="space-y-1.5">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted flex items-center justify-between">

                              <span>Upload ZIP Files (Drop / Select)</span>

                              <span className="text-cyber-neon/70 font-mono lowercase opacity-70" title="Data Source Path">Source: WF/{selectedWorkflowId || 'wf_default'}/Input</span>

                            </label>

                          <div className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group ${isDraggingPdf ? 'border-cyber-neon bg-cyber-dark bg-opacity-70 shadow-[0_0_15px_rgba(0,255,200,0.5)]' : 'border-cyber-border hover:border-cyber-neon bg-cyber-dark bg-opacity-50'}`}>

                            <input

                              type="file"

                              accept=".zip"

                              multiple

                              onChange={(e) => { setIsDraggingPdf(false); handlePdfFileUpload(e); }}

                              onDragEnter={() => setIsDraggingPdf(true)}

                              onDragLeave={() => setIsDraggingPdf(false)}

                              onDrop={() => setIsDraggingPdf(false)}

                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"

                              title="Click or Drop ZIP files here to upload"

                            />

                            <div className="flex flex-col items-center justify-center space-y-2 relative z-0 pointer-events-none">

                              <div className="p-3 bg-cyber-dark rounded-full shadow-inner group-hover:scale-110 transition-transform duration-300 border border-cyber-border">

                                <FileUp className="w-6 h-6 text-cyber-neon" />

                              </div>

                              <div>

                                <span className="font-bold text-cyber-neon uppercase tracking-wide block">Click to upload</span>

                                <span className="text-[10px] text-cyber-muted mt-1 block">or drag and drop</span>

                                <span className="text-[9px] text-cyber-muted opacity-50 block mt-0.5">ZIP (MAX. 10MB)</span>

                              </div>

                            </div>

                          </div>

                        </div>



                        {/* Display ZIP Queue Table list */}

                        <div className="space-y-1.5">

                          <div className="flex items-center justify-between">

                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                              Queue Files Table ({orderedZipList.length})

                            </label>

                            <button

                              type="button"

                              onClick={handleClearAllZipQueue}

                              className="text-[10px] font-mono border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-xs"

                              title="Clear all ZIP files from Queue Table & delete files on Backend server"

                            >

                              <Trash2 className="w-2.5 h-2.5" /> Clear

                            </button>

                          </div>

                          <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                            <table className="w-full text-left border-collapse">

                              <thead>

                                <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted">

                                  <th className="py-2 px-3 text-center w-12">View</th>

                                  <th className="py-2 px-3 text-center w-12">ID</th>

                                  <th className="py-2 px-3">File Name / URL</th>

                                  <th className="py-2 px-3 text-center w-20">Status</th>

                                </tr>

                              </thead>

                              <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                {orderedZipList.length === 0 ? (

                                <tr>

                                  <td colSpan={4} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                    No ZIP files in queue. Drop files above or connect inputs.

                                  </td>

                                </tr>

                              ) : (

                                (() => {

                                  const PAGE_SIZE = 10;

                                  const totalZipPages = Math.ceil(orderedZipList.length / PAGE_SIZE) || 1;

                                  const currentZipQueuePage = Math.min(zipQueuePage, totalZipPages);

                                  const startIdx = (currentZipQueuePage - 1) * PAGE_SIZE;

                                  const paginatedPdfList = orderedZipList.slice(startIdx, startIdx + PAGE_SIZE);



                                  return paginatedPdfList.map((url: string, pageIdx: number) => {

                                    const globalIdx = startIdx + pageIdx;

                                    const cleanName = getCleanFileName(url); void cleanName;

                                    

                                    // Logic for Zip Queue Table Status

                                    const serverUrls = serverZipQueueFiles ? serverZipQueueFiles.map((x: any) => x.filename) : [];

                                    const isComplete = serverUrls.includes(url);



                                    return (

                                      <tr key={globalIdx} className={`${

                                        isComplete ? 'text-emerald-300 bg-emerald-950 bg-opacity-20' : 'text-cyber-text'

                                      }`}>

                                        <td className="py-2 px-3 text-center">

                                          <button

                                            onClick={() => handleOpenPdf(url)}

                                            className={`p-1 rounded transition-colors cursor-pointer ${

                                              isComplete ? 'text-emerald-400 hover:bg-emerald-900 hover:bg-opacity-40' : 'text-cyber-muted hover:text-cyber-neon hover:bg-cyber-panel'

                                            }`}

                                            title="Open ZIP File"

                                          >

                                            <FileText className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                        <td className="py-2 px-3 text-center font-mono font-bold text-cyber-muted text-[10px]">

                                          {globalIdx + 1}

                                        </td>

                                        <td className="py-2 px-3 truncate max-w-[150px]" title={url}>

                                          {url.split('/').pop()?.split('?')[0] || url}

                                        </td>

                                        <td className="py-2 px-3 text-center">

                                          {isComplete ? (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">

                                              Complete

                                            </span>

                                          ) : (

                                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase text-cyber-muted border border-cyber-border">

                                              Queue

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



                        {/* Zip Queue Table Pagination Controls */}

                        {(() => {

                          const PAGE_SIZE = 10;

                          const totalZipPages = Math.ceil(orderedZipList.length / PAGE_SIZE) || 1;

                          const currentZipQueuePage = Math.min(zipQueuePage, totalZipPages);



                          if (totalZipPages <= 1) return null;

                          return (

                            <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-cyber-muted select-none">

                              <span className="font-mono">

                                Page {currentZipQueuePage} / {totalZipPages}

                              </span>

                              <div className="flex items-center gap-1">

                                <button

                                  type="button"

                                  disabled={currentZipQueuePage === 1}

                                  onClick={() => setZipQueuePage(1)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentZipQueuePage === 1

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="First Page"

                                >

                                  &lt;&lt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentZipQueuePage === 1}

                                  onClick={() => setZipQueuePage(prev => Math.max(1, prev - 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentZipQueuePage === 1

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

                                  let startPage = Math.max(1, currentZipQueuePage - Math.floor(maxPagesToShow / 2));

                                  let endPage = Math.min(totalZipPages, startPage + maxPagesToShow - 1);

                                  if (endPage - startPage + 1 < maxPagesToShow) {

                                    startPage = Math.max(1, endPage - maxPagesToShow + 1);

                                  }

                                  for (let p = startPage; p <= endPage; p++) {

                                    pages.push(

                                      <button

                                        key={p}

                                        type="button"

                                        onClick={() => setZipQueuePage(p)}

                                        className={`px-1.5 py-0.5 rounded border text-[8px] font-mono transition-colors cursor-pointer ${

                                          currentZipQueuePage === p

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

                                  disabled={currentZipQueuePage === totalZipPages}

                                  onClick={() => setZipQueuePage(prev => Math.min(totalZipPages, prev + 1))}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentZipQueuePage === totalZipPages

                                      ? 'opacity-30 cursor-not-allowed'

                                      : 'text-cyber-text hover:text-cyber-neon hover:border-cyber-neon bg-cyber-dark bg-opacity-65'

                                  }`}

                                  title="Next Page"

                                >

                                  &gt;

                                </button>

                                <button

                                  type="button"

                                  disabled={currentZipQueuePage === totalZipPages}

                                  onClick={() => setZipQueuePage(totalZipPages)}

                                  className={`px-1.5 py-0.5 rounded border border-cyber-border font-mono text-[8px] transition-colors cursor-pointer ${

                                    currentZipQueuePage === totalZipPages

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



                      <div className="p-3 bg-cyber-dark bg-opacity-70 border border-cyber-border rounded-lg space-y-1 text-[10px] leading-relaxed text-cyber-muted">

                        <span className="font-bold text-cyber-neon uppercase block">📦 Queue Status</span>

                        <div>Current Index: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentIndex ?? 0}</span></div>

                        <div>Queue Length: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.queueLength ?? 0}</span></div>

                        <div className="truncate">Current URL: <span className="text-cyber-text font-mono">{selectedNode.data.parameters?.currentUrl || 'None'}</span></div>

                        <div>Has Next: <span className={selectedNode.data.parameters?.hasNext ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{(selectedNode.data.parameters?.hasNext ?? false).toString()}</span></div>

                      </div>

                    </>

                  );

                })()}

    </>
  );
};

export default QueueTablesSection;
