import React, { useState, useEffect, useRef } from 'react';

export function useInspectorLayout(initialWidth: number = 320) {
  // Properties Inspector resizing state
  const [inspectorWidth, setInspectorWidth] = useState<number>(initialWidth);
  const [isResizingInspector, setIsResizingInspector] = useState<boolean>(false);

  useEffect(() => {
    if (!isResizingInspector) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(240, Math.min(600, newWidth));
      setInspectorWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingInspector(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isResizingInspector]);

  // Properties Inspector background drag-to-scroll state
  const inspectorContentRef = useRef<HTMLDivElement>(null);
  const [isDraggingInspectorScroll, setIsDraggingInspectorScroll] = useState<boolean>(false);
  const dragScrollStartYRef = useRef<number>(0);
  const dragScrollTopRef = useRef<number>(0);

  const handleInspectorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only primary mouse button (left click)
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    // Do not initiate drag-scroll on interactive form elements or controls
    if (
      target.closest(
        'input, textarea, select, button, a, [role="button"], [role="slider"], .monaco-editor, .drag-handle-no-scroll'
      )
    ) {
      return;
    }

    const container = inspectorContentRef.current;
    if (!container) return;

    setIsDraggingInspectorScroll(true);
    dragScrollStartYRef.current = e.clientY;
    dragScrollTopRef.current = container.scrollTop;
  };

  useEffect(() => {
    if (!isDraggingInspectorScroll) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = inspectorContentRef.current;
      if (!container) return;

      const deltaY = e.clientY - dragScrollStartYRef.current;
      container.scrollTop = dragScrollTopRef.current - deltaY;
    };

    const handleMouseUp = () => {
      setIsDraggingInspectorScroll(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingInspectorScroll]);

  return {
    inspectorWidth,
    setInspectorWidth,
    isResizingInspector,
    setIsResizingInspector,
    inspectorContentRef,
    isDraggingInspectorScroll,
    handleInspectorMouseDown,
  };
}

