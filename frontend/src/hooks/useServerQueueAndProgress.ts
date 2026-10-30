import { useState, useEffect } from 'react';
import type { Node } from 'reactflow';

export interface UseServerQueueAndProgressProps {
  selectedNode: Node | null;
  selectedWorkflowId: string | null;
  isRunning: boolean;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  backendUrl: string;
}

export function useServerQueueAndProgress({
  selectedNode,
  selectedWorkflowId,
  isRunning,
  setNodes,
  backendUrl,
}: UseServerQueueAndProgressProps) {
  const [pdfQueuePage, setPdfQueuePage] = useState(1);
  const [zipQueuePage, setZipQueuePage] = useState(1);
  const [agentOutputsPage, setAgentOutputsPage] = useState(1);
  const [serverPdfQueueFiles, setServerPdfQueueFiles] = useState<any[]>([]);
  const [serverTxtQueueFiles, setServerTxtQueueFiles] = useState<any[]>([]);
  const [txtQueuePage, setTxtQueuePage] = useState(1);
  const [serverZipQueueFiles, setServerZipQueueFiles] = useState<any[]>([]);
  const [serverAgentOutputsFiles, setServerAgentOutputsFiles] = useState<string[]>([]);
  const [nodeLiveProgress, setNodeLiveProgress] = useState<Record<string, {
    currentIndex?: number;
    currentPage?: number;
    totalPages?: number;
    percent?: number;
    status?: string;
    stepMessage?: string;
    filename?: string;
    updatedAt?: number;
  }>>({});

  useEffect(() => {
    setPdfQueuePage(1);
    setAgentOutputsPage(1);
    if (!selectedNode) return;
    const fetchLists = async () => {
      const wfParam = selectedWorkflowId || 'wf_default';
      try {
        const resPdf = await fetch(
          `${backendUrl}/api/list-pdf-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(selectedNode.id)}`
        );
        if (resPdf.ok) {
          const dataPdf = await resPdf.json();
          if (dataPdf.status === 'success' && Array.isArray(dataPdf.files)) {
            setServerPdfQueueFiles(dataPdf.files);
          }
        }
      } catch (e) {}

      try {
        const resTxt = await fetch(
          `${backendUrl}/api/list-txt-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(selectedNode.id)}`
        );
        if (resTxt.ok) {
          const dataTxt = await resTxt.json();
          if (dataTxt.status === 'success' && Array.isArray(dataTxt.files)) {
            setServerTxtQueueFiles(dataTxt.files);
          }
        }
      } catch (e) {}

      try {
        const resZip = await fetch(
          `${backendUrl}/api/list-zip-queue?workflow_id=${encodeURIComponent(wfParam)}&node_id=${encodeURIComponent(selectedNode.id)}`
        );
        if (resZip.ok) {
          const dataZip = await resZip.json();
          if (dataZip.status === 'success' && Array.isArray(dataZip.files)) {
            setServerZipQueueFiles(dataZip.files);
          }
        }
      } catch (e) {}

      try {
        const resAgent = await fetch(
          `${backendUrl}/api/list-agent-results?workflow_id=${encodeURIComponent(wfParam)}`
        );
        if (resAgent.ok) {
          const dataAgent = await resAgent.json();
          if (dataAgent.status === 'success' && Array.isArray(dataAgent.files)) {
            setServerAgentOutputsFiles(dataAgent.files);
          }
        }
      } catch (e) {}
    };

    fetchLists();
    const interval = setInterval(fetchLists, 3000);
    return () => clearInterval(interval);
  }, [backendUrl, selectedNode?.id, selectedWorkflowId]);

  // Real-time polling for workflow & nodes execution progress
  useEffect(() => {
    let isSubscribed = true;

    const fetchProgress = async () => {
      try {
        // 1. Fetch workflow-wide progress map if a workflow is selected
        if (selectedWorkflowId) {
          const resWf = await fetch(`${backendUrl}/api/workflows/${encodeURIComponent(selectedWorkflowId)}/progress`);
          if (resWf.ok) {
            const dataWf = await resWf.json();
            if (dataWf.status === 'success' && dataWf.progressMap && isSubscribed) {
              setNodeLiveProgress((prev) => ({
                ...prev,
                ...dataWf.progressMap,
              }));

              // Sync progress into nodes state so Canvas Nodes show live progress bar
              setNodes((nds) =>
                nds.map((n) => {
                  const live = dataWf.progressMap[n.id];
                  if (live && live.status === 'Active' && typeof live.percent === 'number') {
                    if (n.data.parameters?.progress !== live.percent || n.data.status !== 'running') {
                      return {
                        ...n,
                        data: {
                          ...n.data,
                          status: 'running',
                          parameters: {
                            ...(n.data.parameters || {}),
                            progress: live.percent,
                            stepMessage: live.stepMessage,
                          },
                        },
                      };
                    }
                  }
                  return n;
                })
              );
            }
          }
        }

        // 2. Also fetch directly for selectedNode
        if (selectedNode) {
          const res = await fetch(`${backendUrl}/api/nodes/${encodeURIComponent(selectedNode.id)}/progress`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'success' && data.progress && isSubscribed) {
              setNodeLiveProgress((prev) => ({
                ...prev,
                [selectedNode.id]: data.progress,
              }));
            }
          }
        }
      } catch (e) {}
    };

    fetchProgress();
    const intervalTime = isRunning ? 800 : 2500;
    const interval = setInterval(fetchProgress, intervalTime);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [backendUrl, isRunning, selectedNode?.id, selectedWorkflowId, setNodes]);

  return {
    pdfQueuePage,
    setPdfQueuePage,
    zipQueuePage,
    setZipQueuePage,
    agentOutputsPage,
    setAgentOutputsPage,
    serverPdfQueueFiles,
    setServerPdfQueueFiles,
    serverTxtQueueFiles,
    setServerTxtQueueFiles,
    txtQueuePage,
    setTxtQueuePage,
    serverZipQueueFiles,
    setServerZipQueueFiles,
    serverAgentOutputsFiles,
    setServerAgentOutputsFiles,
    nodeLiveProgress,
    setNodeLiveProgress,
  };
}

