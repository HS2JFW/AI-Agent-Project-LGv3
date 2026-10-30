import { useState } from 'react';
import { type DialogState } from '../FloatingDialog';

export interface UseFloatingDialogsProps {
  selectedWorkflowId: string | null;
  backendUrl: string;
}

export function useFloatingDialogs({
  selectedWorkflowId,
  backendUrl,
}: UseFloatingDialogsProps) {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const [dialogZIndexCounter, setDialogZIndexCounter] = useState(100);

  const openDialog = (
    type: 'agent_result' | 'pdf_queue' | 'json' | 'zip_queue' | 'txt_queue',
    filename: string,
    rawContent?: string
  ) => {
    const title = filename.split('/').pop()?.split('?')[0] || filename;
    const wfParam = encodeURIComponent(selectedWorkflowId || 'wf_default');
    let url = '';
    if (type === 'agent_result') {
      url = `${backendUrl}/api/agent-result/${encodeURIComponent(title)}?workflow_id=${wfParam}`;
    } else if (type === 'pdf_queue') {
      url = `${backendUrl}/api/queue-pdf/${encodeURIComponent(title)}?workflow_id=${wfParam}`;
    } else if (type === 'txt_queue') {
      url = `${backendUrl}/api/queue-txt/${encodeURIComponent(title)}?workflow_id=${wfParam}`;
    } else if (type === 'zip_queue') {
      url = `${backendUrl}/api/queue-zip/${encodeURIComponent(title)}?workflow_id=${wfParam}`;
    } else if (filename.startsWith('http://') || filename.startsWith('https://')) {
      url = filename;
      if ((url.includes('/api/queue-pdf') || url.includes('/api/agent-result')) && !url.includes('workflow_id=')) {
        url += (url.includes('?') ? '&' : '?') + `workflow_id=${wfParam}`;
      }
    }

    const newZIndex = dialogZIndexCounter + 1;
    setDialogZIndexCounter(newZIndex);

    const newDialog: DialogState = {
      id: Date.now().toString() + Math.random().toString(),
      type,
      filename: title,
      title,
      url: type === 'json' ? undefined : url,
      content: type === 'json' ? rawContent : undefined,
      position: {
        x: window.innerWidth / 2 - 250 + dialogs.length * 20,
        y: window.innerHeight / 2 - 200 + dialogs.length * 20,
      },
      size: {
        w: type === 'pdf_queue' || type === 'txt_queue' ? 600 : 500,
        h: type === 'pdf_queue' || type === 'txt_queue' ? 800 : 400,
      },
      zIndex: newZIndex,
      fontSize: 14,
      textColor: '#00ffff',
      currentPage: 1,
      scale: 1.0,
    };

    setDialogs((prev) => [...prev, newDialog]);
  };

  const closeDialog = (id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDialog = (id: string, partial: Partial<DialogState>) => {
    setDialogs((prev) => prev.map((d) => (d.id === id ? { ...d, ...partial } : d)));
  };

  const bringToFront = (id: string) => {
    const newZIndex = dialogZIndexCounter + 1;
    setDialogZIndexCounter(newZIndex);
    updateDialog(id, { zIndex: newZIndex });
  };

  return {
    dialogs,
    setDialogs,
    openDialog,
    closeDialog,
    updateDialog,
    bringToFront,
  };
}

