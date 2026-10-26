export interface NodeLiveProgress {
  nodeId: string;
  workflowId?: string;
  currentIndex: number;
  currentPage: number;
  totalPages: number;
  percent: number;
  status: 'Queue' | 'Active' | 'Complete' | 'Error' | 'idle';
  stepMessage?: string;
  filename?: string;
  updatedAt: number;
}

export const nodeProgressRegistry: Record<string, NodeLiveProgress> = {};

export function updateNodeProgress(nodeId: string, info: Partial<NodeLiveProgress>) {
  if (!nodeId) return;
  const prev = nodeProgressRegistry[nodeId] || {
    nodeId,
    currentIndex: 0,
    currentPage: 0,
    totalPages: 0,
    percent: 0,
    status: 'idle',
    updatedAt: Date.now()
  };
  nodeProgressRegistry[nodeId] = {
    ...prev,
    ...info,
    nodeId,
    updatedAt: Date.now()
  };
}

export function getNodeProgress(nodeId: string): NodeLiveProgress {
  return nodeProgressRegistry[nodeId] || {
    nodeId,
    currentIndex: 0,
    currentPage: 0,
    totalPages: 0,
    percent: 0,
    status: 'idle',
    updatedAt: Date.now()
  };
}
