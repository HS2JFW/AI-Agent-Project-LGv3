import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { FileSearch, Layers } from 'lucide-react';

const PdfExtractorNode = ({ data, selected }: NodeProps) => {
  const isRunning = data.status === 'running';

  return (
    <div 
      className={`relative min-w-[260px] max-w-[300px] rounded-xl bg-white dark:bg-[#141418] border transition-all duration-200 shadow-xs ${
        isRunning 
          ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/30' 
          : selected 
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:ring-indigo-500/30 shadow-md' 
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Header (Drag Handle) */}
      <div className="drag-handle px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60 rounded-t-xl cursor-grab select-none">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs shrink-0 shadow-2xs">
            <FileSearch className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {data.label || 'PDF Extractor'}
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
          INPUT
        </span>
      </div>

      {/* Main Body */}
      <div className="p-3.5 space-y-2 text-xs">
        <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">Selected Extraction Engine:</div>
        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 flex items-center justify-between shadow-2xs">
          <span className="truncate">PyMuPDF-4LLM</span>
          <span className="text-zinc-400 dark:text-zinc-500 shrink-0 ml-1">Structured</span>
        </div>
        {isRunning && (
          <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold animate-pulse">
            <Layers className="w-3 h-3" />
            <span>Extracting text & tables...</span>
          </div>
        )}
      </div>

      {/* Connection Sockets (Handles) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="w-3 h-3 bg-white dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-500 hover:border-indigo-500 transition-colors shadow-xs"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3 h-3 bg-white dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-500 hover:border-indigo-500 transition-colors shadow-xs"
      />
    </div>
  );
};

export default memo(PdfExtractorNode);
