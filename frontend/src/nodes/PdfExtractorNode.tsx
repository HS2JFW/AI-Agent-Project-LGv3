import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { FileSearch, Layers } from 'lucide-react';

const PdfExtractorNode = ({ data, selected }: NodeProps) => {
  const isRunning = data.status === 'running';

  return (
    <div 
      className={`relative min-w-[220px] bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_12px_32px_rgba(30,60,110,0.08),0_2px_6px_rgba(30,60,110,0.04)] ${
        isRunning 
          ? 'border-blue-500 shadow-[0_0_20px_rgba(30,107,255,0.25)]' 
          : selected 
            ? 'border-blue-500 ring-2 ring-blue-500/20' 
            : 'border-slate-200/90 hover:border-blue-300'
      }`}
    >
      {/* Top curved accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600" />

      {/* Main Container */}
      <div className="p-4 pt-4.5 flex items-start space-x-3.5 bg-white">
        {/* Left side: Avatar box */}
        <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
          <FileSearch className="w-5 h-5 text-blue-600" />
        </div>

        {/* Right side: Texts & Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
          <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold block select-none">
            {data.category || 'Actions'}
          </span>
          
          <h4 className="text-sm font-bold text-slate-800 block truncate mt-0.5">
            {data.label || 'PDF Extractor'}
          </h4>

          {isRunning && (
            <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-blue-600 font-mono font-bold animate-pulse">
              <Layers className="w-3 h-3" />
              <span>Extracting text...</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Sockets (Handles) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="w-3 h-3 bg-white border-2 border-blue-600 hover:bg-blue-600 transition-colors shadow-sm"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3 h-3 bg-white border-2 border-blue-600 hover:bg-blue-600 transition-colors shadow-sm"
      />
    </div>
  );
};

export default memo(PdfExtractorNode);