import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Table } from 'lucide-react';

interface TableCell {
  type: 'int' | 'text';
  value: string | number;
}

interface TableItem {
  id: string;
  name: TableCell;
  cells: Record<string, TableCell>;
}

interface TableColumn {
  id: string;
  name: TableCell;
}

interface TableData {
  rows: TableItem[];
  columns: TableColumn[];
  primaryColumn?: TableCell;
}

interface TableNodeProps {
  data: {
    label: string;
    tableData?: TableData;
  };
  selected?: boolean;
}

const extractText = (cell?: TableCell): string => {
  if (!cell) return '';
  if (cell.type === 'int') return String(cell.value);
  // For text cells, we might have HTML from Tiptap. Let's strip it for a clean plain-text preview.
  const val = String(cell.value);
  const plainText = val.replace(/<[^>]*>?/gm, '').trim();
  return plainText || 'Empty';
};

const TableNode = ({ data, selected }: TableNodeProps) => {
  const rows = data.tableData?.rows || [];

  return (
    <div
      className={`min-w-[250px] bg-cyber-dark border shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-md overflow-hidden transition-all duration-200 ${
        selected ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'border-[#5C5C70]' }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyber-light border-2 border-cyber-dark"
      />

      <div className="bg-cyber-panel border-b border-cyber-border px-3 py-2 flex items-center space-x-2">
        <Table className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-bold text-cyber-text truncate">{data.label || 'Table Data'}</span>
      </div>

      <div className="p-2 flex flex-col space-y-1 relative">
        {rows.length === 0 ? (
          <div className="text-xs text-cyber-muted italic p-2 text-center border border-dashed border-cyber-border rounded">
            No rows defined. Edit to add.
          </div>
        ) : (
          rows.map((row, index) => {
            const rawText = extractText(row.name);
            const displayText = rawText === 'Empty' ? `Row ${index + 1}` : rawText;
            return (
              <div key={row.id} className="relative bg-cyber-panel border border-cyber-border/50 rounded px-2 py-1.5 flex items-center justify-between">
                <span className="text-[10px] text-cyber-text truncate pr-4">{displayText}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`table-row-${row.id}`}
                  className="w-2.5 h-2.5 bg-emerald-400 border border-cyber-dark !right-[-12px] top-1/2 transform -translate-y-1/2"
                  style={{ top: '50%' }}
                />
              </div>
            );
          })
        )}
      </div>

      <div className="bg-cyber-panel/50 border-t border-cyber-border/50 px-2 py-1.5 text-center relative">
        <span className="text-[9px] text-cyber-muted uppercase tracking-wider">All Table Data</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="table-all"
          className="w-3 h-3 bg-emerald-400 border-2 border-cyber-dark"
        />
      </div>
    </div>
  );
};

export default memo(TableNode);
