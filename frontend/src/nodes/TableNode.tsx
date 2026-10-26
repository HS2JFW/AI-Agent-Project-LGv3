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

      <div className="p-3 border-b border-slate-100 flex items-center space-x-2.5">
        <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
          <Table className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-slate-800 truncate">{data.label || 'Table Data'}</span>
      </div>

      <div className="p-2.5 flex flex-col space-y-1.5 relative">
        {rows.length === 0 ? (
          <div className="text-xs text-slate-400 italic p-2.5 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            No rows defined. Edit to add.
          </div>
        ) : (
          rows.map((row, index) => {
            const rawText = extractText(row.name);
            const displayText = rawText === 'Empty' ? `Row ${index + 1}` : rawText;
            return (
              <div key={row.id} className="relative bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-700 truncate pr-4">{displayText}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`table-row-${row.id}`}
                  className="w-2.5 h-2.5 bg-white border-2 border-blue-600 shadow-sm !right-[-12px] top-1/2 transform -translate-y-1/2"
                  style={{ top: '50%' }}
                />
              </div>
            );
          })
        )}
      </div>

      <div className="bg-slate-50/80 border-t border-slate-100 px-3 py-2 text-center relative">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">All Table Data</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="table-all"
          className="w-3 h-3 bg-white border-2 border-blue-600 shadow-sm"
        />
      </div>
    </div>
  );
};

export default memo(TableNode);
