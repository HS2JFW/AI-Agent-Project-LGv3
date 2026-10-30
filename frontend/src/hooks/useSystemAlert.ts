import { useState } from 'react';

export interface AlertState {
  show: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useSystemAlert() {
  const [customAlert, setCustomAlert] = useState<AlertState>({
    show: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    message: string,
    title: string = 'System Alert',
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setCustomAlert({ show: true, title, message, type });
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type === 'error' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(type === 'error' ? 300 : type === 'success' ? 600 : 440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  const closeAlert = () => {
    setCustomAlert((prev) => ({ ...prev, show: false }));
  };

  return {
    customAlert,
    setCustomAlert,
    showAlert,
    closeAlert,
  };
}
