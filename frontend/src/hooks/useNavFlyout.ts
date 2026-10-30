import { useState, useRef } from 'react';

export function useNavFlyout() {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const flyoutCloseTimerRef = useRef<any>(null);

  const handleGroupMouseEnter = (groupId: string) => {
    if (flyoutCloseTimerRef.current) {
      clearTimeout(flyoutCloseTimerRef.current);
      flyoutCloseTimerRef.current = null;
    }
    setHoveredGroup(groupId);
  };

  const handleGroupMouseLeave = () => {
    if (flyoutCloseTimerRef.current) {
      clearTimeout(flyoutCloseTimerRef.current);
    }
    flyoutCloseTimerRef.current = setTimeout(() => {
      setHoveredGroup(null);
    }, 150);
  };

  const handleFlyoutMouseEnter = () => {
    if (flyoutCloseTimerRef.current) {
      clearTimeout(flyoutCloseTimerRef.current);
      flyoutCloseTimerRef.current = null;
    }
  };

  const handleFlyoutMouseLeave = () => {
    if (flyoutCloseTimerRef.current) {
      clearTimeout(flyoutCloseTimerRef.current);
    }
    flyoutCloseTimerRef.current = setTimeout(() => {
      setHoveredGroup(null);
    }, 150);
  };

  return {
    hoveredGroup,
    setHoveredGroup,
    flyoutCloseTimerRef,
    handleGroupMouseEnter,
    handleGroupMouseLeave,
    handleFlyoutMouseEnter,
    handleFlyoutMouseLeave,
  };
}
