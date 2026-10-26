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
      className={`min-w-[260px] bg-white text-slate-800 rounded-2xl shadow-[0_12px_32px_rgba(30,60,110,0.08),0_2px_6px_rgba(30,60,110,0.04)] border transition-all duration-200 overflow-hidden ${
        selected ? 'border-blue-500 ring-2 ring-blue-400/40' : 'border-slate-200/90'
      }`}
    >
      {/* Top curved blue gradient accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600" />

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-blue-600 shadow-sm"
      />

      <div className="p-3 border-b border-slate-100 flex flex-col justify-center">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            <Grid3X3 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800 truncate">{data.label || 'Sample Data'}</span>
        </div>
        {data.description && (
          <div className="mt-1 text-[10px] text-slate-500 italic line-clamp-2 leading-tight">
            {data.description}
          </div>
        )}
      </div>

      <div className="p-2.5 flex flex-col space-y-1.5 relative">
        {samples.length === 0 ? (
          <div className="text-xs text-slate-400 italic p-2.5 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            No samples defined. Edit to add.
          </div>
        ) : (
          samples.map((sample, index) => {
            const rawName = sample.name || `Sample ${index + 1}`;
            const displayName = rawName.length > 20 ? rawName.substring(0, 20) + '...' : rawName;
            return (
              <div key={sample.id} className="relative bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-700 truncate pr-4">{displayName}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`sample-${sample.id}`}
                  className="w-2.5 h-2.5 bg-white border-2 border-blue-600 shadow-sm !right-[-12px] top-1/2 transform -translate-y-1/2"
                  style={{ top: '50%' }}
                />
              </div>
            );
          })
        )}
      </div>

      <div className="bg-slate-50/80 border-t border-slate-100 px-3 py-2 text-center relative">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">All Sample Data</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="sample-all"
          className="w-3 h-3 bg-white border-2 border-blue-600 shadow-sm"
        />
      </div>
    </div>
  );
};

export default memo(SampleNode);
