import React from 'react';
import { Clock } from 'lucide-react';

export interface TimerCountdownProps {
  parameters: any;
  title?: string;
  isWorkflowTimer?: boolean;
  onToggleActive?: () => void;
}

export const TimerCountdown: React.FC<TimerCountdownProps> = ({
  parameters,
  title,
  isWorkflowTimer = false,
  onToggleActive
}) => {
  const isActive = parameters?.schedulerActive === true;
  const remaining = parameters?.remainingSeconds;
  const intervalVal = parameters?.intervalValue !== undefined ? Math.max(1, Number(parameters.intervalValue)) : 2;
  const intervalUnit = parameters?.intervalUnit || 'seconds';
  const unitSuffix = intervalUnit.startsWith('min') ? 'm' : intervalUnit.startsWith('hour') ? 'h' : intervalUnit.startsWith('day') ? 'd' : 's';

  let countdownText = `${intervalVal}${unitSuffix} (Ready)`;
  let isTimerActiveStyle = false;

  if (isActive) {
    isTimerActiveStyle = true;
    if (remaining === undefined || remaining === null) {
      countdownText = 'Starting...';
    } else if (remaining <= 0) {
      countdownText = isWorkflowTimer ? 'Waking up...' : 'Triggering...';
    } else {
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const mins = Math.floor((remaining % 3600) / 60);
      const secs = remaining % 60;
      
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);
      countdownText = parts.join(' ');
    }
  } else if (remaining !== undefined && remaining !== null && remaining > 0) {
    countdownText = `${remaining}${unitSuffix} (Paused)`;
  }

  const defaultTitle = isWorkflowTimer ? "Workflow Timer Countdown (นับถอยหลัง)" : "Next Trigger Countdown";
  const displayTitle = title || defaultTitle;

  return (
    <div className="space-y-2 bg-cyber-dark bg-opacity-50 p-2.5 rounded-lg border border-cyber-border border-opacity-60">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-cyber-muted font-bold select-none flex items-center space-x-1.5">
          <Clock className={`w-3.5 h-3.5 ${isTimerActiveStyle ? 'text-cyber-neon animate-pulse' : 'text-cyber-muted'}`} />
          <span className={isTimerActiveStyle ? 'text-cyber-neon font-bold' : ''}>{displayTitle}</span>
        </div>
        <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
          isActive 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' 
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          {isActive ? "ACTIVE" : "PAUSED / READY"}
        </span>
      </div>

      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
        isTimerActiveStyle 
          ? 'bg-cyber-dark bg-opacity-90 border-cyber-neon shadow-[0_0_12px_rgba(0,240,255,0.25)]' 
          : 'bg-cyber-dark bg-opacity-60 border-cyber-border'
      }`}>
        <div className="flex items-center space-x-2">
          <Clock className={`w-4 h-4 ${isTimerActiveStyle ? 'text-cyber-neon animate-pulse' : 'text-cyber-muted'}`} />
          <span className={`text-sm font-mono font-black tracking-wider ${
            isTimerActiveStyle ? 'text-cyber-neon' : 'text-gray-300'
          }`}>
            {countdownText}
          </span>
        </div>
        {onToggleActive && (
          <button
            onClick={onToggleActive}
            className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center space-x-1 ${
              isActive
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                : 'bg-cyber-neon/20 hover:bg-cyber-neon/30 text-cyber-neon border border-cyber-neon/40 shadow-[0_0_4px_rgba(0,240,255,0.2)]'
            }`}
          >
            <span>{isActive ? 'Pause Timer' : 'Start Timer'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TimerCountdown;

