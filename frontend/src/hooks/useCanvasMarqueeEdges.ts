import { useEffect, useRef } from 'react';
import { useStoreApi, type Edge } from 'reactflow';

export interface UseCanvasMarqueeEdgesProps {
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export function useCanvasMarqueeEdges({ setEdges }: UseCanvasMarqueeEdgesProps) {
  const store = useStoreApi();
  const previousSelectionActive = useRef(false);

  useEffect(() => {
    const unsubscribe = store.subscribe((state: any) => {
      const active = state.userSelectionActive;
      if (!active && previousSelectionActive.current) {
        const rect = state.userSelectionRect;
        if (rect) {
          const nodesState = state.getNodes();
          setEdges((eds) => {
            let hasChanges = false;
            const newEds = eds.map((e) => {
              const sourceNode = nodesState.find((n: any) => n.id === e.source);
              const targetNode = nodesState.find((n: any) => n.id === e.target);
              if (sourceNode && targetNode) {
                const padding = 50;
                const minX = Math.min(sourceNode.position.x, targetNode.position.x) - padding;
                const maxX =
                  Math.max(
                    sourceNode.position.x + (sourceNode.width || 0),
                    targetNode.position.x + (targetNode.width || 0)
                  ) + padding;
                const minY = Math.min(sourceNode.position.y, targetNode.position.y) - padding;
                const maxY =
                  Math.max(
                    sourceNode.position.y + (sourceNode.height || 0),
                    targetNode.position.y + (targetNode.height || 0)
                  ) + padding;

                const intersects = !(
                  rect.x > maxX ||
                  rect.x + rect.width < minX ||
                  rect.y > maxY ||
                  rect.y + rect.height < minY
                );

                if (intersects && !e.selected) {
                  hasChanges = true;
                  return { ...e, selected: true };
                }
              }
              return e;
            });
            return hasChanges ? newEds : eds;
          });
        }
      }
      previousSelectionActive.current = active;
    });
    return unsubscribe;
  }, [store, setEdges]);
}

