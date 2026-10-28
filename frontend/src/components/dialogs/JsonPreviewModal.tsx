import React from 'react';
import { X } from 'lucide-react';

export interface JsonPreviewModalProps {
  isOpen: boolean;
  title: string;
  content: string | null;
  accentColor?: 'neon' | 'purple' | 'cyan';
  onClose: () => void;
}

export const JsonPreviewModal: React.FC<JsonPreviewModalProps> = ({
  isOpen,
  title,
  content,
  accentColor = 'neon',
  onClose
}) => {
  if (!isOpen || content === null) return null;

  const borderColor =
    accentColor === 'purple'
      ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
      : accentColor === 'cyan'
      ? 'border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.2)]'
      : 'border-cyber-neon shadow-[0_0_30px_rgba(0,240,255,0.2)]';

  const titleColor =
    accentColor === 'purple'
      ? 'text-purple-400'
      : accentColor === 'cyan'
      ? 'text-cyan-400'
      : 'text-cyber-neon';

  const textColor = accentColor === 'purple' ? 'text-purple-200' : 'text-cyber-text';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`bg-[#0a0a0f] border ${borderColor} w-[800px] max-w-[90vw] h-[80vh] flex flex-col rounded-xl`}>
        <div className="flex items-center justify-between p-4 border-b border-cyber-border bg-[#111116] rounded-t-xl">
          <h3 className={`${titleColor} font-bold text-sm uppercase tracking-wider`}>{title}</h3>
          <button
            onClick={onClose}
            className="text-cyber-muted hover:text-red-400 transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto min-h-0">
          <pre className={`text-xs font-mono ${textColor} whitespace-pre-wrap leading-relaxed`}>
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default JsonPreviewModal;

