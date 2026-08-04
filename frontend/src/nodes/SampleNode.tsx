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
      className={`min-w-[250px] bg-cyber-dark border shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-md overflow-hidden transition-all duration-200 ${
        selected ? 'border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'border-[#5C5C70]' }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyber-light border-2 border-cyber-dark"
      />

      <div className="bg-cyber-panel border-b border-cyber-border px-3 py-2 flex flex-col justify-center">
        <div className="flex items-center space-x-2">
          <Grid3X3 className="w-4 h-4 text-[#38bdf8]" />
          <span className="text-xs font-bold text-cyber-text truncate">{data.label || 'Sample Data'}</span>
        </div>
        {data.description && (
          <div className="mt-1 text-[10px] text-cyber-muted italic line-clamp-2 leading-tight">
            {data.description}
          </div>
        )}
      </div>

      <div className="p-2 flex flex-col space-y-1 relative">
        {samples.length === 0 ? (
          <div className="text-xs text-cyber-muted italic p-2 text-center border border-dashed border-cyber-border rounded">
            No samples defined. Edit to add.
          </div>
        ) : (
          samples.map((sample, index) => {
            const rawName = sample.name || `Sample ${index + 1}`;
            const displayName = rawName.length > 20 ? rawName.substring(0, 20) + '...' : rawName;
            return (
            <div key={sample.id} className="relative bg-cyber-panel border border-cyber-border/50 rounded px-2 py-1.5 flex items-center justify-between">
              <span className="text-[10px] text-cyber-text truncate pr-4">{displayName}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={`sample-${sample.id}`}
                className="w-2.5 h-2.5 bg-[#38bdf8] border border-cyber-dark !right-[-12px] top-1/2 transform -translate-y-1/2"
                style={{ top: '50%' }}
              />
            </div>
            );
          })
        )}
      </div>

      <div className="bg-cyber-panel/50 border-t border-cyber-border/50 px-2 py-1.5 text-center relative">
        <span className="text-[9px] text-cyber-muted uppercase tracking-wider">All Sample Data</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="sample-all"
          className="w-3 h-3 bg-[#a855f7] border-2 border-cyber-dark"
        />
      </div>
    </div>
  );
};

export default memo(SampleNode);
