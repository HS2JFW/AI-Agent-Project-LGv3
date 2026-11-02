import { getBackendUrl } from '../utils/apiConfig';
import React, { useState, useRef, useEffect } from 'react';
import { canCreateGroup, canDeleteGroup, canMoveItems } from '../utils/rbacPermissions';

export interface UseWorkflowGroupsProps {
  workflows?: any[];
  processes?: any[];
  setProcesses?: React.Dispatch<React.SetStateAction<any[]>>;
  selectedWorkflowId?: string | null;
  setSelectedWorkflowId?: React.Dispatch<React.SetStateAction<string | null>>;
  isRunning?: boolean;
  currentRunId?: string | null;
  handleStopProcess?: (processId: string) => Promise<any> | void;
  setNodes?: React.Dispatch<React.SetStateAction<any[]>>;
  setEdges?: React.Dispatch<React.SetStateAction<any[]>>;
  setAgentNodes?: React.Dispatch<React.SetStateAction<any[]>>;
  setAgentEdges?: React.Dispatch<React.SetStateAction<any[]>>;
  setWorkflowName?: React.Dispatch<React.SetStateAction<string>>;
  setWorkflowDesc?: React.Dispatch<React.SetStateAction<string>>;
  backendUrl?: string;
  currentUser?: any;
}

export function useWorkflowGroups({
  workflows = [],
  processes = [],
  setProcesses = () => {},
  selectedWorkflowId = null,
  setSelectedWorkflowId = () => {},
  isRunning = false,
  currentRunId = null,
  handleStopProcess = () => {},
  setNodes = () => {},
  setEdges = () => {},
  setAgentNodes = () => {},
  setAgentEdges = () => {},
  setWorkflowName = () => {},
  setWorkflowDesc = () => {},
  backendUrl,
  currentUser,
}: UseWorkflowGroupsProps) {
  const BACKEND_URL = backendUrl !== undefined ? backendUrl : getBackendUrl();

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('app_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Workflow Groups & Hierarchy States

  const [groups, setGroups] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    parentId: string | null;
    color?: string;
    createdAt: string;
    ownerId?: string;
    ownerUsername?: string;
    canEdit?: boolean;
    canDelete?: boolean;
  }>>(() => {

    try {

      const saved = localStorage.getItem('app_workflow_groups');

      return saved ? JSON.parse(saved) : [];

    } catch (e) {

      return [];

    }

  });



  const [workflowGroupMap, setWorkflowGroupMap] = useState<Record<string, string>>(() => {

    try {

      const saved = localStorage.getItem('app_workflow_group_map');

      return saved ? JSON.parse(saved) : {};

    } catch (e) {

      return {};

    }

  });



  const [workflowColorMap, setWorkflowColorMap] = useState<Record<string, string>>(() => {

    try {

      const saved = localStorage.getItem('app_workflow_color_map');

      return saved ? JSON.parse(saved) : {};

    } catch (e) {

      return {};

    }

  });

  // 1. Fetch Groups from Server & Run Auto-Migration if client has local groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/groups`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) return;
        const data = await res.json();
        const serverGroups = data.map((g: any) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          parentId: g.parent_id,
          color: g.color || 'blue',
          createdAt: g.created_at,
          ownerId: g.owner_id,
          ownerUsername: g.owner_username,
          canEdit: g.can_edit,
          canDelete: g.can_delete
        }));

        try {
          const localSaved = localStorage.getItem('app_workflow_groups');
          const localGroups = localSaved ? JSON.parse(localSaved) : [];
          const serverIds = new Set(serverGroups.map((g: any) => g.id));
          const unsynced = localGroups.filter((g: any) => !serverIds.has(g.id));

          const localGroupMapRaw = localStorage.getItem('app_workflow_group_map');
          const localGroupMap = localGroupMapRaw ? JSON.parse(localGroupMapRaw) : {};

          const localColorMapRaw = localStorage.getItem('app_workflow_color_map');
          const localColorMap = localColorMapRaw ? JSON.parse(localColorMapRaw) : {};

          const token = localStorage.getItem('app_auth_token');
          if (unsynced.length > 0 && token) {
            const syncRes = await fetch(`${BACKEND_URL}/api/groups/sync`, {
              method: 'POST',
              headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                groups: unsynced.map((g: any) => ({
                  id: g.id,
                  name: g.name,
                  description: g.description,
                  color: g.color || 'blue',
                  parent_id: g.parentId || null
                })),
                workflow_group_map: localGroupMap,
                workflow_color_map: localColorMap
              })
            });

            if (syncRes.ok) {
              const refreshRes = await fetch(`${BACKEND_URL}/api/groups`, { headers: getAuthHeaders() });
              if (refreshRes.ok) {
                const freshData = await refreshRes.json();
                const freshGroups = freshData.map((g: any) => ({
                  id: g.id,
                  name: g.name,
                  description: g.description,
                  parentId: g.parent_id,
                  color: g.color || 'blue',
                  createdAt: g.created_at,
                  ownerId: g.owner_id,
                  ownerUsername: g.owner_username,
                  canEdit: g.can_edit,
                  canDelete: g.can_delete
                }));
                setGroups(freshGroups);
                localStorage.setItem('app_workflow_groups', JSON.stringify(freshGroups));
                return;
              }
            }
          }
        } catch (syncErr) {}

        setGroups(serverGroups);
        localStorage.setItem('app_workflow_groups', JSON.stringify(serverGroups));
      } catch (e) {
        console.warn("Could not fetch groups from server, using local cache:", e);
      }
    };

    fetchGroups();
  }, [BACKEND_URL, currentUser]);

  // 2. Sync Workflows from DB into workflowGroupMap and workflowColorMap
  useEffect(() => {
    if (workflows && workflows.length > 0) {
      setWorkflowGroupMap(prev => {
        const next = { ...prev };
        let changed = false;
        workflows.forEach((wf: any) => {
          if (wf && wf.id) {
            if (wf.group_id) {
              if (next[wf.id] !== wf.group_id) {
                next[wf.id] = wf.group_id;
                changed = true;
              }
            }
          }
        });
        return changed ? next : prev;
      });

      setWorkflowColorMap(prev => {
        const next = { ...prev };
        let changed = false;
        workflows.forEach((wf: any) => {
          if (wf && wf.id && wf.color) {
            if (next[wf.id] !== wf.color) {
              next[wf.id] = wf.color;
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }
  }, [workflows]);

  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);

  const [newGroupName, setNewGroupName] = useState<string>('');

  const [newGroupDesc, setNewGroupDesc] = useState<string>('');

  const [newGroupColor, setNewGroupColor] = useState<string>('blue');

  const [moveMenuState, setMoveMenuState] = useState<{

    workflowIds: string[];

    groupIds: string[];

    anchorRect: { top: number; bottom: number; left: number; right: number };

  } | null>(null);

  const [groupToDelete, setGroupToDelete] = useState<any | null>(null);

  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<string[]>([]);

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  const [dragOverCrumbId, setDragOverCrumbId] = useState<string | null | 'root'>(null);

  const [marqueeBox, setMarqueeBox] = useState<{

    startX: number;

    startY: number;

    currentX: number;

    currentY: number;

    isSelecting: boolean;

  } | null>(null);



  const lastSelectedWfIndexRef = useRef<number | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  const initialSelectedWfsRef = useRef<string[]>([]);

  const initialSelectedGrpsRef = useRef<string[]>([]);



  // Check if targetId is a descendant of parentId in groups tree

  const isGroupDescendant = (parentId: string, targetId: string, allGroups: Array<{ id: string; parentId: string | null }>): boolean => {

    let cur = allGroups.find(g => g.id === targetId);

    while (cur) {

      if (cur.parentId === parentId) return true;

      cur = allGroups.find(g => g.id === cur?.parentId);

    }

    return false;

  };



  // Build preceding hierarchy layers starting from closest layer to current folder down to farthest (Root)

  const getPathHierarchyLayers = (currentId: string | null, allGroups: Array<{ id: string; name: string; parentId: string | null }>) => {

    if (!currentId) return [];



    const layers: Array<{ id: string | null; name: string; isRoot: boolean }> = [];

    let curr = allGroups.find(g => g.id === currentId);

    while (curr && curr.parentId) {

      const parent = allGroups.find(g => g.id === curr?.parentId);

      if (parent) {

        layers.push({ id: parent.id, name: parent.name, isRoot: false });

        curr = parent;

      } else {

        break;

      }

    }

    // Farthest layer (Root) at the bottom

    layers.push({ id: null, name: 'Projects', isRoot: true });



    return layers;

  };



  // Window mouse listener for marquee rubberband selection

  useEffect(() => {

    if (!marqueeBox?.isSelecting) return;



    const handleMouseMove = (e: MouseEvent) => {

      setMarqueeBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);



      const boxLeft = Math.min(marqueeBox.startX, e.clientX);

      const boxTop = Math.min(marqueeBox.startY, e.clientY);

      const boxRight = Math.max(marqueeBox.startX, e.clientX);

      const boxBottom = Math.max(marqueeBox.startY, e.clientY);



      if (boxRight - boxLeft > 5 || boxBottom - boxTop > 5) {

        const hitWfs: string[] = [];

        const hitGrps: string[] = [];



        const cards = gridContainerRef.current?.querySelectorAll('[data-card-item="true"]');

        cards?.forEach(card => {

          const rect = card.getBoundingClientRect();

          const isIntersecting = !(

            rect.left > boxRight ||

            rect.right < boxLeft ||

            rect.top > boxBottom ||

            rect.bottom < boxTop

          );



          if (isIntersecting) {

            const wfId = card.getAttribute('data-wf-id');

            const grpId = card.getAttribute('data-grp-id');

            if (wfId) hitWfs.push(wfId);

            if (grpId) hitGrps.push(grpId);

          }

        });



        const mergedWfs = Array.from(new Set([...initialSelectedWfsRef.current, ...hitWfs]));

        const mergedGrps = Array.from(new Set([...initialSelectedGrpsRef.current, ...hitGrps]));

        setSelectedWorkflowIds(mergedWfs);

        setSelectedGroupIds(mergedGrps);

      }

    };



    const handleMouseUp = () => {

      setMarqueeBox(null);

    };



    window.addEventListener('mousemove', handleMouseMove);

    window.addEventListener('mouseup', handleMouseUp);

    return () => {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseup', handleMouseUp);

    };

  }, [marqueeBox?.isSelecting]);



  const handleContainerMouseDown = (e: React.MouseEvent) => {

    if (e.button !== 0) return;

    const target = e.target as HTMLElement;

    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('select')) {

      return;

    }

    if (target.closest('[data-card-item="true"]')) {

      return;

    }



    if (e.ctrlKey || e.metaKey) {

      initialSelectedWfsRef.current = selectedWorkflowIds;

      initialSelectedGrpsRef.current = selectedGroupIds;

    } else {

      initialSelectedWfsRef.current = [];

      initialSelectedGrpsRef.current = [];

      setSelectedWorkflowIds([]);

      setSelectedGroupIds([]);

    }



    setMarqueeBox({

      startX: e.clientX,

      startY: e.clientY,

      currentX: e.clientX,

      currentY: e.clientY,

      isSelecting: true,

    });

  };



  const handleGroupSelectToggle = (_e: React.MouseEvent, grpId: string) => {

    setSelectedGroupIds(prev => {

      if (prev.includes(grpId)) return prev.filter(id => id !== grpId);

      return [...prev, grpId];

    });

  };



  const handleWorkflowCardClick = (e: React.MouseEvent, wfId: string, index: number, allWfs: any[]) => {

    if (e.ctrlKey || e.metaKey) {

      setSelectedWorkflowIds(prev => {

        if (prev.includes(wfId)) {

          return prev.filter(id => id !== wfId);

        } else {

          return [...prev, wfId];

        }

      });

      lastSelectedWfIndexRef.current = index;

    } else if (e.shiftKey) {

      const lastIndex = lastSelectedWfIndexRef.current ?? 0;

      const start = Math.min(lastIndex, index);

      const end = Math.max(lastIndex, index);

      const rangeIds = allWfs.slice(start, end + 1).map(p => p.workflowId || p.id);

      setSelectedWorkflowIds(prev => {

        const merged = new Set([...prev, ...rangeIds]);

        return Array.from(merged);

      });

    } else {

      setSelectedWorkflowIds(prev => (prev.length === 1 && prev[0] === wfId ? [] : [wfId]));

      lastSelectedWfIndexRef.current = index;

    }

  };



  const handleWorkflowDragStart = (e: React.DragEvent, wfId: string) => {

    let idsToMove = selectedWorkflowIds;

    if (!selectedWorkflowIds.includes(wfId)) {

      idsToMove = [wfId];

      setSelectedWorkflowIds([wfId]);

    }

    const payload = {

      workflowIds: idsToMove,

      groupIds: selectedGroupIds,

    };

    e.dataTransfer.setData('application/json', JSON.stringify(payload));

    e.dataTransfer.setData('text/plain', JSON.stringify(payload));

    e.dataTransfer.effectAllowed = 'move';

  };



  const handleGroupDragStart = (e: React.DragEvent, grpId: string) => {

    let grpsToMove = selectedGroupIds;

    if (!selectedGroupIds.includes(grpId)) {

      grpsToMove = [grpId];

      setSelectedGroupIds([grpId]);

    }

    const payload = {

      workflowIds: selectedWorkflowIds,

      groupIds: grpsToMove,

    };

    e.dataTransfer.setData('application/json', JSON.stringify(payload));

    e.dataTransfer.setData('text/plain', JSON.stringify(payload));

    e.dataTransfer.effectAllowed = 'move';

  };



  const handleDropWorkflowsOnFolder = (targetGroupId: string | null, e: React.DragEvent) => {

    e.preventDefault();

    setDragOverGroupId(null);

    setDragOverCrumbId(null);



    let payload: { workflowIds?: string[]; groupIds?: string[] } = {};

    try {

      const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');

      if (raw) {

        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {

          payload = { workflowIds: parsed, groupIds: [] };

        } else {

          payload = parsed;

        }

      }

    } catch (err) {}



    const wfsToMove = payload.workflowIds?.length ? payload.workflowIds : selectedWorkflowIds;

    const grpsToMove = payload.groupIds?.length ? payload.groupIds : selectedGroupIds;



    // 1. Move Workflows

    if (wfsToMove.length > 0) {

      setWorkflowGroupMap(prev => {

        const next = { ...prev };

        wfsToMove.forEach(rawId => {

          const proc = processes.find(p => p.id === rawId || p.workflowId === rawId);

          const wfKey = proc ? (proc.workflowId || proc.id) : rawId;

          if (targetGroupId === null) {

            delete next[wfKey];

            if (proc?.id) delete next[proc.id];

            if (proc?.workflowId) delete next[proc.workflowId];

          } else {

            next[wfKey] = targetGroupId;

            if (proc?.id) next[proc.id] = targetGroupId;

            if (proc?.workflowId) next[proc.workflowId] = targetGroupId;

          }

        });

        try {

          localStorage.setItem('app_workflow_group_map', JSON.stringify(next));

        } catch (err) {}

        return next;

      });

    }



    // 2. Move Groups / Folders

    if (grpsToMove.length > 0) {

      setGroups(prev => {

        const updated = prev.map(g => {

          if (grpsToMove.includes(g.id)) {

            if (targetGroupId === g.id) return g;

            if (targetGroupId && isGroupDescendant(g.id, targetGroupId, prev)) return g;

            return { ...g, parentId: targetGroupId };

          }

          return g;

        });

        grpsToMove.forEach((gId: string) => {
          if (gId === targetGroupId) return;
          fetch(`${BACKEND_URL}/api/groups/${encodeURIComponent(gId)}`, {
            method: 'PATCH',
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ parent_id: targetGroupId || null })
          }).catch(() => {});
        });

        try {

          localStorage.setItem('app_workflow_groups', JSON.stringify(updated));

        } catch (err) {}

        return updated;

      });

    }



    setSelectedWorkflowIds([]);

    setSelectedGroupIds([]);

  };



  const executeMoveItems = (targetGroupId: string | null, customWfIds?: string[], customGrpIds?: string[]) => {
    if (!canMoveItems(currentUser)) {
      setMoveMenuState(null);
      return;
    }

    const workflowIds: string[] = customWfIds || (moveMenuState ? moveMenuState.workflowIds : []);

    const groupIds: string[] = customGrpIds || (moveMenuState ? moveMenuState.groupIds : []);



    if (workflowIds && workflowIds.length > 0) {

      setWorkflowGroupMap(prev => {

        const next = { ...prev };

        workflowIds.forEach((rawId: string) => {

          const proc = processes.find(p => p.id === rawId || p.workflowId === rawId);

          const wfKey = proc ? (proc.workflowId || proc.id) : rawId;

          if (targetGroupId === null) {

            delete next[wfKey];

            if (proc?.id) delete next[proc.id];

            if (proc?.workflowId) delete next[proc.workflowId];

          } else {

            next[wfKey] = targetGroupId;

            if (proc?.id) next[proc.id] = targetGroupId;

            if (proc?.workflowId) next[proc.workflowId] = targetGroupId;

          }

          if (wfKey && wfKey !== 'default' && wfKey !== 'wf_default') {
            fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(wfKey)}`, {
              method: 'PATCH',
              headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ group_id: targetGroupId || null })
            }).catch(() => {});
          }

        });

        try {

          localStorage.setItem('app_workflow_group_map', JSON.stringify(next));

        } catch (err) {}

        return next;

      });

    }



    if (groupIds && groupIds.length > 0) {

      setGroups(prev => {

        const updated = prev.map(g => {

          if (groupIds.includes(g.id)) {

            if (targetGroupId === g.id) return g;

            if (targetGroupId && isGroupDescendant(g.id, targetGroupId, prev)) return g;

            return { ...g, parentId: targetGroupId };

          }

          return g;

        });

        try {

          localStorage.setItem('app_workflow_groups', JSON.stringify(updated));

        } catch (err) {}

        return updated;

      });

    }



    setMoveMenuState(null);

    setSelectedWorkflowIds([]);

    setSelectedGroupIds([]);

  };



  // Move item(s) out to the immediate previous layer (parent folder or Root)

  // If multiple items are selected, move ALL selected items together at once

  const handleMoveToPreviousLayer = (itemId: string, itemType: 'workflow' | 'folder') => {

    if (currentGroupId === null) return;

    const currentGroup = groups.find(g => g.id === currentGroupId);

    const targetGroupId = currentGroup?.parentId || null;



    let wfIds: string[] = [];

    let grpIds: string[] = [];



    const hasMultiSelect = selectedWorkflowIds.length > 0 || selectedGroupIds.length > 0;

    if (hasMultiSelect) {

      wfIds = itemType === 'workflow'

        ? Array.from(new Set([...selectedWorkflowIds, itemId]))

        : [...selectedWorkflowIds];

      grpIds = itemType === 'folder'

        ? Array.from(new Set([...selectedGroupIds, itemId]))

        : [...selectedGroupIds];

    } else {

      if (itemType === 'workflow') {

        wfIds = [itemId];

      } else {

        grpIds = [itemId];

      }

    }



    executeMoveItems(targetGroupId, wfIds, grpIds);

  };



  const handleCreateGroup = async () => {
    if (!canCreateGroup(currentUser)) {
      setShowCreateGroupModal(false);
      return;
    }
    if (!newGroupName.trim()) return;

    const groupPayload = {
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      parent_id: currentGroupId,
      color: newGroupColor,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/groups`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupPayload)
      });

      if (res.ok) {
        const created = await res.json();
        const newGroup = {
          id: created.id,
          name: created.name,
          description: created.description,
          parentId: created.parent_id,
          color: created.color || 'blue',
          createdAt: created.created_at,
          ownerId: created.owner_id,
          ownerUsername: created.owner_username,
          canEdit: created.can_edit,
          canDelete: created.can_delete
        };
        setGroups(prev => {
          const updated = [...prev, newGroup];
          try { localStorage.setItem('app_workflow_groups', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      } else {
        const fallbackGroup = {
          id: 'grp_' + Date.now(),
          name: groupPayload.name,
          description: groupPayload.description,
          parentId: groupPayload.parent_id,
          color: groupPayload.color,
          createdAt: new Date().toISOString()
        };
        setGroups(prev => {
          const updated = [...prev, fallbackGroup];
          try { localStorage.setItem('app_workflow_groups', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
    } catch (e) {
      const fallbackGroup = {
        id: 'grp_' + Date.now(),
        name: groupPayload.name,
        description: groupPayload.description,
        parentId: groupPayload.parent_id,
        color: groupPayload.color,
        createdAt: new Date().toISOString()
      };
      setGroups(prev => {
        const updated = [...prev, fallbackGroup];
        try { localStorage.setItem('app_workflow_groups', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateGroupModal(false);
  };



  const handleBackGroup = () => {

    if (!currentGroupId) return;

    const current = groups.find(g => g.id === currentGroupId);

    if (current) {

      setCurrentGroupId(current.parentId || null);

    } else {

      setCurrentGroupId(null);

    }

  };



  const handleDeleteGroup = async (groupId: string, deleteWorkflows: boolean = false) => {
    if (!canDeleteGroup(currentUser)) {
      console.warn("Permission denied: cannot delete group with role", currentUser?.role);
      setGroupToDelete(null);
      return;
    }

    const childGroupIds = new Set<string>();

    const findChildren = (pid: string) => {

      groups.forEach(g => {

        if (g.parentId === pid) {

          childGroupIds.add(g.id);

          findChildren(g.id);

        }

      });

    };

    findChildren(groupId);

    childGroupIds.add(groupId);



    if (deleteWorkflows) {

      const contained = processes.filter((p: any) => childGroupIds.has(workflowGroupMap[p.workflowId || p.id]));

      contained.forEach((proc: any) => {

        if (isRunning && currentRunId === proc.id) {

          handleStopProcess(proc.id);

        }

      });



      for (const proc of contained) {

        const targetWfId = proc.workflowId || proc.id;

        if (targetWfId && targetWfId !== 'default' && targetWfId !== 'wf_default') {

          try {

            await fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(targetWfId)}`, { method: 'DELETE' });

          } catch (e) {}

        }

        if (proc.id && proc.id !== targetWfId) {

          try {

            await fetch(`${BACKEND_URL}/api/workflows/runs/${encodeURIComponent(proc.id)}`, { method: 'DELETE' });

          } catch (e) {}

        }

      }



      const containedIdSet = new Set(contained.map(p => p.id));

      const containedWfIdSet = new Set(contained.map(p => p.workflowId || p.id));

      setProcesses((prev: any[]) => prev.filter((p: any) => !containedIdSet.has(p.id) && !containedWfIdSet.has(p.workflowId || p.id)));



      if (contained.some((p: any) => p.id === selectedWorkflowId || p.workflowId === selectedWorkflowId)) {

        setNodes([]);

        setEdges([]);

        setAgentNodes([]);

        setAgentEdges([]);

        setSelectedWorkflowId(null);

        setWorkflowName('');

        setWorkflowDesc('');

      }



      setWorkflowColorMap(prev => {

        const next = { ...prev };

        containedWfIdSet.forEach(id => delete next[id]);

        try {

          localStorage.setItem('app_workflow_color_map', JSON.stringify(next));

        } catch (e) {}

        return next;

      });



      setSelectedWorkflowIds(prev => prev.filter(id => !containedIdSet.has(id) && !containedWfIdSet.has(id)));

    }



    // Call backend API to delete group
    try {
      await fetch(`${BACKEND_URL}/api/groups/${encodeURIComponent(groupId)}?delete_workflows=${deleteWorkflows}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn("Error calling DELETE /api/groups:", err);
    }

    const updatedGroups = groups.filter(g => !childGroupIds.has(g.id));

    setGroups(updatedGroups);

    try {

      localStorage.setItem('app_workflow_groups', JSON.stringify(updatedGroups));

    } catch (e) {}



    setWorkflowGroupMap((prev: Record<string, string>) => {
      const next = { ...prev };
      Object.keys(next).forEach((wfId: string) => {
        if ((childGroupIds as Set<string>).has(next[wfId])) {

          delete next[wfId];

        }

      });

      try {

        localStorage.setItem('app_workflow_group_map', JSON.stringify(next));

      } catch (e) {}

      return next;

    });



    if (currentGroupId && childGroupIds.has(currentGroupId)) {

      handleBackGroup();

    }

    setGroupToDelete(null);

  };


  return {
    groups,
    setGroups,
    workflowGroupMap,
    setWorkflowGroupMap,
    workflowColorMap,
    setWorkflowColorMap,
    currentGroupId,
    setCurrentGroupId,
    showCreateGroupModal,
    setShowCreateGroupModal,
    newGroupName,
    setNewGroupName,
    newGroupDesc,
    setNewGroupDesc,
    newGroupColor,
    setNewGroupColor,
    moveMenuState,
    setMoveMenuState,
    groupToDelete,
    setGroupToDelete,
    selectedWorkflowIds,
    setSelectedWorkflowIds,
    selectedGroupIds,
    setSelectedGroupIds,
    dragOverGroupId,
    setDragOverGroupId,
    dragOverCrumbId,
    setDragOverCrumbId,
    marqueeBox,
    setMarqueeBox,
    gridContainerRef,
    isGroupDescendant,
    getPathHierarchyLayers,
    handleContainerMouseDown,
    handleGroupSelectToggle,
    handleWorkflowCardClick,
    handleWorkflowDragStart,
    handleGroupDragStart,
    handleDropWorkflowsOnFolder,
    executeMoveItems,
    handleMoveToPreviousLayer,
    handleCreateGroup,
    handleBackGroup,
    handleDeleteGroup,
  };
}
