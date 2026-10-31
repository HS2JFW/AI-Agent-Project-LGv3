import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { LayoutPanelTop } from 'lucide-react';

interface RubricLevel {
  id: string;
  name: string;
  score: number;
}

interface RubricCriterion {
  id: string;
  name: string;
  descriptions: Record<string, string>;
  weight?: number;
}

interface RubricData {
  levels: RubricLevel[];
  criteria: RubricCriterion[];
}

interface MCANodeProps {
  data: {
    label: string;
    rubricData?: RubricData;
  };
  selected?: boolean;
}

const MCANode = ({ data, selected }: MCANodeProps) => {
  const criteria = data.rubricData?.criteria || [];

  return (
    <div
      className={`min-w-[260px] max-w-[320px] rounded-xl bg-white dark:bg-[#141418] border transition-all duration-200 shadow-xs relative ${
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
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs shrink-0 shadow-2xs">
            <LayoutPanelTop className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {data.label || 'Multi-Criteria Analysis'}
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
          MCA
        </span>
      </div>

      <div className="p-3 flex flex-col space-y-1.5 relative">
        {criteria.length === 0 ? (
          <div className="text-xs text-zinc-400 dark:text-zinc-500 italic p-3 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/50">
            No criteria defined. Edit MCA to add.
          </div>
        ) : (
          criteria.map((crit, index) => (
            <div key={crit.id} className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-2xs">
              <div className="flex flex-col overflow-hidden pr-3">
                <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate">{crit.name || `${index + 1}. Criterion`}</span>
                {crit.weight !== undefined && (
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">Weight {crit.weight}%</span>
                )}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`criterion-${crit.id}`}
                className="w-2.5 h-2.5 bg-white dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-500 hover:border-indigo-500 !right-[-12px] top-1/2 transform -translate-y-1/2 shadow-xs"
                style={{ top: '50%' }}
              />
            </div>
          ))
        )}
      </div>

      <div className="bg-zinc-50/80 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 text-center relative rounded-b-xl">
        <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">All MCA Data</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="mca-all"
          className="w-3 h-3 bg-white dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-500 hover:border-indigo-500 shadow-xs"
        />
      </div>
    </div>
  );
};

export default memo(MCANode);
