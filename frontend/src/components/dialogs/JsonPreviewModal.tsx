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
  onClose
}) => {
  if (!isOpen || content === null) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 w-[800px] max-w-[92vw] h-[80vh] flex flex-col rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 shrink-0">
          <h3 className="text-zinc-900 dark:text-zinc-100 font-bold font-mono text-xs uppercase tracking-wider">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto min-h-0 bg-zinc-50/50 dark:bg-[#0c0c0e]">
          <pre className="text-xs font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed select-text">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default JsonPreviewModal;
