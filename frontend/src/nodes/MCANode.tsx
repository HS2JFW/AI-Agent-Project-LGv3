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
      className={`min-w-[260px] bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_12px_32px_rgba(30,60,110,0.08),0_2px_6px_rgba(30,60,110,0.04)] relative ${
        selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/90 hover:border-blue-300' }`}
    >
      {/* Top curved accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600" />

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-blue-600 shadow-sm"
      />

      <div className="border-b border-slate-100 px-3.5 py-2.5 pt-3 flex items-center space-x-2.5 bg-white">
        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <LayoutPanelTop className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold block select-none">MCA</span>
          <span className="text-xs font-bold text-slate-800 truncate block">{data.label || 'Multi-Criteria Analysis'}</span>
        </div>
      </div>

      <div className="p-2.5 flex flex-col space-y-1.5 relative bg-white">
        {criteria.length === 0 ? (
          <div className="text-xs text-slate-400 italic p-3 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
            No criteria defined. Edit MCA to add.
          </div>
        ) : (
          criteria.map((crit, index) => (
            <div key={crit.id} className="relative bg-[#f8fafc] border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between shadow-sm">
              <div className="flex flex-col overflow-hidden pr-3">
                <span className="text-[11px] font-semibold text-slate-700 truncate">{crit.name || `${index + 1}. Criterion`}</span>
                {crit.weight !== undefined && (
                  <span className="text-[9px] text-blue-600 font-medium">Weight {crit.weight}%</span>
                )}
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* iOS Style blue toggle simulation */}
                <div className="w-7 h-4 bg-blue-600 rounded-full flex items-center p-0.5 justify-end shadow-sm cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`criterion-${crit.id}`}
                className="w-2.5 h-2.5 bg-white border-2 border-blue-600 !right-[-12px] top-1/2 transform -translate-y-1/2 shadow-sm"
                style={{ top: '50%' }}
              />
            </div>
          ))
        )}
      </div>

      <div className="bg-[#f8fafc] border-t border-slate-100 px-3 py-2 text-center relative">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">All MCA Data</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="mca-all"
          className="w-3 h-3 bg-white border-2 border-blue-600 shadow-sm"
        />
      </div>
    </div>
  );
};

export default memo(MCANode);
