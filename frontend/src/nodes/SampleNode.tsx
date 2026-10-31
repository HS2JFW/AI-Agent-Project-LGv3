import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Grid3X3 } from 'lucide-react';

interface SampleItem {
  id: string;
  name: string;
  scores: Record<string, number>;
}

interface SampleCriteria {
  id: string;
  name: string;
}

interface SampleData {
  samples: SampleItem[];
  criteria: SampleCriteria[];
}

interface SampleNodeProps {
  data: {
    label: string;
    description?: string;
    sampleData?: SampleData;
  };
  selected?: boolean;
}

const SampleNode = ({ data, selected }: SampleNodeProps) => {
  const samples = data.sampleData?.samples || [];

  return (
    <div
      className={`min-w-[260px] max-w-[320px] rounded-xl bg-white dark:bg-[#141418] border transition-all duration-200 shadow-xs overflow-hidden relative ${
        selected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:ring-indigo-500/30 shadow-md' 
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-500 hover:border-indigo-500 shadow-xs"
      />

      {/* Header (Drag Handle) */}
      <div className="drag-handle px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60 rounded-t-xl cursor-grab select-none">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center text-xs shrink-0 shadow-2xs">
            <Grid3X3 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {data.label || 'Sample Data'}
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium uppercase tracking-wider bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 shrink-0">
          SAMPLE
        </span>
      </div>

      {data.description && (
        <div className="px-3.5 pt-2 text-[10px] text-zinc-500 dark:text-zinc-400 italic line-clamp-2 leading-tight">
          {data.description}
        </div>
      )}

      <div className="p-3 flex flex-col space-y-1.5 relative">
        {samples.length === 0 ? (
          <div className="text-xs text-zinc-400 dark:text-zinc-500 italic p-3 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/50">
            No samples defined. Edit to add.
          </div>
        ) : (
          samples.map((sample, index) => {
            const rawName = sample.name || `Sample ${index + 1}`;
            const displayName = rawName.length > 20 ? rawName.substring(0, 20) + '...' : rawName;
            return (
              <div key={sample.id} className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-2xs">
                <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate pr-4">{displayName}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`sample-${sample.id}`}
                  className="w-2.5 h-2.5 bg-white dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-500 hover:border-indigo-500 shadow-xs !right-[-12px] top-1/2 transform -translate-y-1/2"
                  style={{ top: '50%' }}
                />
              </div>
            );
          })
        )}
      </div>

      <div className="bg-zinc-50/80 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 text-center relative rounded-b-xl">
        <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">All Sample Data</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="sample-all"
          className="w-3 h-3 bg-white dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-500 hover:border-indigo-500 shadow-xs"
        />
      </div>
    </div>
  );
};

export default memo(SampleNode);
