import { useState } from 'react';

export function useTimePickers() {
  // Custom calendar picker states
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
  const [selectedCalTime, setSelectedCalTime] = useState('09:00');

  // Clock Picker Modal State
  const [isClockOpen, setIsClockOpen] = useState(false);
  const [clockTimeValue, setClockTimeValue] = useState('09:00');
  const [clockOnSaveCallback, setClockOnSaveCallback] = useState<((time: string) => void) | null>(null);
  const [clockPosition, setClockPosition] = useState<{ top: number; left: number } | null>(null);

  const openClockPicker = (event: React.MouseEvent, initTime: string, onSave: (time: string) => void) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left - 160 + rect.width / 2; // Center horizontally

    // Boundary checks
    if (left < 10) left = 10;
    if (left + 320 > window.innerWidth) left = window.innerWidth - 330;
    if (top + 400 > window.innerHeight) {
      top = rect.top - 410; // Position above if overflowing bottom
    }
    if (top < 10) top = 10;

    setClockPosition({ top, left });
    setClockTimeValue(initTime || '09:00');
    setClockOnSaveCallback(() => onSave);
    setIsClockOpen(true);
  };

  // Day of Month Popover State
  const [isDayPopoverOpen, setIsDayPopoverOpen] = useState(false);
  const [dayPopoverValue, setDayPopoverValue] = useState(1);
  const [dayPopoverOnSaveCallback, setDayPopoverOnSaveCallback] = useState<((day: number) => void) | null>(null);
  const [dayPopoverPosition, setDayPopoverPosition] = useState<{ top: number; left: number } | null>(null);

  const openDayPopover = (event: React.MouseEvent, initDay: number, onSave: (day: number) => void) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left - 100 + rect.width / 2; // Center horizontally

    // Boundary checks
    if (left < 10) left = 10;
    if (left + 220 > window.innerWidth) left = window.innerWidth - 230;
    if (top + 280 > window.innerHeight) {
      top = rect.top - 290; // Position above if overflowing bottom
    }
    if (top < 10) top = 10;

    setDayPopoverPosition({ top, left });
    setDayPopoverValue(initDay || 1);
    setDayPopoverOnSaveCallback(() => onSave);
    setIsDayPopoverOpen(true);
  };

  return {
    calMonth,
    setCalMonth,
    calYear,
    setCalYear,
    selectedCalDate,
    setSelectedCalDate,
    selectedCalTime,
    setSelectedCalTime,
    isClockOpen,
    setIsClockOpen,
    clockTimeValue,
    setClockTimeValue,
    clockOnSaveCallback,
    setClockOnSaveCallback,
    clockPosition,
    setClockPosition,
    openClockPicker,
    isDayPopoverOpen,
    setIsDayPopoverOpen,
    dayPopoverValue,
    setDayPopoverValue,
    dayPopoverOnSaveCallback,
    setDayPopoverOnSaveCallback,
    dayPopoverPosition,
    setDayPopoverPosition,
    openDayPopover,
  };
}
