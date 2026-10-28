import { useState, useCallback } from 'react';

export interface UseQueueManagerOptions {
  backendUrl?: string;
  defaultWorkflowId?: string;
}

export function useQueueManager(options: UseQueueManagerOptions = {}) {
  const {
    backendUrl = '',
    defaultWorkflowId = 'wf_default',
  } = options;

  const [pdfQueueFiles, setPdfQueueFiles] = useState<string[]>([]);
  const [txtQueueFiles, setTxtQueueFiles] = useState<string[]>([]);
  const [zipQueueFiles, setZipQueueFiles] = useState<string[]>([]);
  const [agentOutputFiles, setAgentOutputFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueues = useCallback(
    async (workflowId: string = defaultWorkflowId, nodeId?: string) => {
      setIsLoading(true);
      setError(null);
      const wfParam = encodeURIComponent(workflowId);
      const nodeParam = nodeId ? `&node_id=${encodeURIComponent(nodeId)}` : '';

      try {
        // 1. Fetch PDF Queue
        const resPdf = await fetch(`${backendUrl}/api/list-pdf-queue?workflow_id=${wfParam}${nodeParam}`);
        if (resPdf.ok) {
          const dataPdf = await resPdf.json();
          if (dataPdf.status === 'success' && Array.isArray(dataPdf.files)) {
            setPdfQueueFiles(dataPdf.files);
          }
        }

        // 2. Fetch TXT Queue
        const resTxt = await fetch(`${backendUrl}/api/list-txt-queue?workflow_id=${wfParam}${nodeParam}`);
        if (resTxt.ok) {
          const dataTxt = await resTxt.json();
          if (dataTxt.status === 'success' && Array.isArray(dataTxt.files)) {
            setTxtQueueFiles(dataTxt.files);
          }
        }

        // 3. Fetch ZIP Queue
        const resZip = await fetch(`${backendUrl}/api/list-zip-queue?workflow_id=${wfParam}${nodeParam}`);
        if (resZip.ok) {
          const dataZip = await resZip.json();
          if (dataZip.status === 'success' && Array.isArray(dataZip.files)) {
            setZipQueueFiles(dataZip.files);
          }
        }

        // 4. Fetch Agent Outputs
        const resOutputs = await fetch(`${backendUrl}/api/list-agent-results?workflow_id=${wfParam}`);
        if (resOutputs.ok) {
          const dataOutputs = await resOutputs.json();
          if (dataOutputs.status === 'success' && Array.isArray(dataOutputs.files)) {
            setAgentOutputFiles(dataOutputs.files);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch queues:', err);
        setError(err.message || 'Failed to fetch queue data');
      } finally {
        setIsLoading(false);
      }
    },
    [backendUrl, defaultWorkflowId]
  );

  const uploadQueueFile = useCallback(
    async (
      type: 'pdf' | 'txt' | 'zip',
      file: File,
      workflowId: string = defaultWorkflowId,
      nodeId: string = '',
      startIndex: number = 0
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const endpoint =
        type === 'pdf'
          ? '/api/upload-pdf-queue'
          : type === 'txt'
          ? '/api/upload-txt-queue'
          : '/api/upload-zip-queue';

      const url = `${backendUrl}${endpoint}?workflow_id=${encodeURIComponent(
        workflowId
      )}&node_id=${encodeURIComponent(nodeId)}&start_index=${startIndex}`;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          throw new Error(`Upload failed with status ${res.status}`);
        }
        await fetchQueues(workflowId, nodeId);
        return true;
      } catch (err: any) {
        console.error(`Upload error (${type}):`, err);
        setError(err.message || 'File upload failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [backendUrl, defaultWorkflowId, fetchQueues]
  );

  const deleteQueueFile = useCallback(
    async (
      type: 'pdf' | 'txt' | 'zip',
      filename: string,
      workflowId: string = defaultWorkflowId,
      nodeId: string = ''
    ): Promise<boolean> => {
      try {
        const url = `${backendUrl}/api/delete-${type}-queue?workflow_id=${encodeURIComponent(
          workflowId
        )}&node_id=${encodeURIComponent(nodeId)}&filename=${encodeURIComponent(filename)}`;
        const res = await fetch(url, { method: 'DELETE' });
        if (res.ok) {
          await fetchQueues(workflowId, nodeId);
          return true;
        }
        return false;
      } catch (err) {
        console.error(`Delete file error (${type}):`, err);
        return false;
      }
    },
    [backendUrl, defaultWorkflowId, fetchQueues]
  );

  const downloadOutput = useCallback(
    (filename: string) => {
      const downloadUrl = `${backendUrl}/api/download-agent-output?filename=${encodeURIComponent(
        filename
      )}`;
      window.open(downloadUrl, '_blank');
    },
    [backendUrl]
  );

  return {
    pdfQueueFiles,
    txtQueueFiles,
    zipQueueFiles,
    agentOutputFiles,
    isLoading,
    error,
    fetchQueues,
    uploadQueueFile,
    deleteQueueFile,
    downloadOutput,
    setPdfQueueFiles,
    setTxtQueueFiles,
    setZipQueueFiles,
    setAgentOutputFiles,
  };
}

