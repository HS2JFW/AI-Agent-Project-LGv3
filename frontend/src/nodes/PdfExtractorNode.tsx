import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { FileSearch, Layers } from 'lucide-react';

const PdfExtractorNode = ({ data, selected }: NodeProps) => {
  const isRunning = data.status === 'running';

  return (
    <div 
      className={`relative min-w-[200px] bg-[#111218] border rounded-xl overflow-hidden transition-all duration-300 ${
        isRunning 
          ? 'border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.5)]' 
          : selected 
            ? 'border-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.2)]' 
            : 'border-[#5C5C70] hover:border-[#7A7A90]'
      }`}
    >
      {/* Top running indicator bar */}
      {isRunning && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
      )}

      {/* Main Container */}
      <div className="p-4 flex items-start space-x-3.5">
        {/* Left side: Avatar box */}
        <div className="p-2.5 rounded-xl bg-cyber-dark bg-opacity-70 border border-cyber-border flex items-center justify-center shrink-0 shadow-inner">
          <FileSearch className="w-5 h-5 text-[#38bdf8]" />
        </div>

        {/* Right side: Texts & Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
          <span className="text-[9px] uppercase tracking-widest text-cyber-muted font-bold block select-none">
            {data.category || 'Actions'}
          </span>
          
          <h4 className="text-sm font-extrabold text-cyber-text block truncate mt-0.5">
            {data.label || 'PDF Extractor'}
          </h4>

          {isRunning && (
            <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-cyan-400 font-mono font-bold animate-pulse">
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
        className="w-3.5 h-3.5 bg-cyber-dark border border-cyber-border hover:bg-[#38bdf8] hover:border-[#38bdf8] transition-colors"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3.5 h-3.5 bg-cyber-dark border border-cyber-border hover:bg-[#38bdf8] hover:border-[#38bdf8] transition-colors"
      />
    </div>
  );
};

export default memo(PdfExtractorNode);