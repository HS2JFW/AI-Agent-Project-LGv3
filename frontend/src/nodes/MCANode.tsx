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
      className={`min-w-[250px] bg-cyber-dark border shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-md overflow-hidden transition-all duration-200 ${
        selected ? 'border-cyber-neon shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'border-[#5C5C70]' }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyber-light border-2 border-cyber-dark"
      />

      <div className="bg-cyber-panel border-b border-cyber-border px-3 py-2 flex items-center space-x-2">
        <LayoutPanelTop className="w-4 h-4 text-cyber-neon" />
        <span className="text-xs font-bold text-cyber-text truncate">{data.label || 'Multi-Criteria Analysis'}</span>
      </div>

      <div className="p-2 flex flex-col space-y-1 relative">
        {criteria.length === 0 ? (
          <div className="text-xs text-cyber-muted italic p-2 text-center border border-dashed border-cyber-border rounded">
            No criteria defined. Edit MCA to add.
          </div>
        ) : (
          criteria.map((crit, index) => (
            <div key={crit.id} className="relative bg-cyber-panel border border-cyber-border/50 rounded px-2 py-1.5 flex items-center justify-between">
              <div className="flex flex-col overflow-hidden pr-4">
                <span className="text-[10px] text-cyber-text truncate">{crit.name || `Criterion ${index + 1}`}</span>
                {crit.weight !== undefined && (
                  <span className="text-[9px] text-[#84CC16]">Weight: {crit.weight}%</span>
                )}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`criterion-${crit.id}`}
                className="w-2.5 h-2.5 bg-cyber-neon border border-cyber-dark !right-[-12px] top-1/2 transform -translate-y-1/2"
                style={{ top: '50%' }}
              />
            </div>
          ))
        )}
      </div>

      <div className="bg-cyber-panel/50 border-t border-cyber-border/50 px-2 py-1.5 text-center relative">
        <span className="text-[9px] text-cyber-muted uppercase tracking-wider">All MCA Data</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="mca-all"
          className="w-3 h-3 bg-[#a855f7] border-2 border-cyber-dark"
        />
      </div>
    </div>
  );
};

export default memo(MCANode);
