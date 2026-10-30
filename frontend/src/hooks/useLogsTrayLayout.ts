import { useState, useEffect } from 'react';

export interface UseLogsTrayLayoutProps {
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  initialHeight?: number;
}

export function useLogsTrayLayout({
  reactFlowWrapper,
  initialHeight = 240,
}: UseLogsTrayLayoutProps) {
  // Log Viewer Tray height states
  const [logsTrayHeight, setLogsTrayHeight] = useState<number>(initialHeight);
  const [isResizingLogsTray, setIsResizingLogsTray] = useState<boolean>(false);
  const [isLogsTrayFullScreen, setIsLogsTrayFullScreen] = useState<boolean>(false);

  useEffect(() => {
    if (!isResizingLogsTray) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (reactFlowWrapper.current) {
        const rect = reactFlowWrapper.current.getBoundingClientRect();
        const newHeight = rect.bottom - e.clientY;
        const clampedHeight = Math.max(100, Math.min(rect.height - 80, newHeight));
        setLogsTrayHeight(clampedHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLogsTray(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLogsTray, reactFlowWrapper]);

  return {
    logsTrayHeight,
    setLogsTrayHeight,
    isResizingLogsTray,
    setIsResizingLogsTray,
    isLogsTrayFullScreen,
    setIsLogsTrayFullScreen,
  };
}

