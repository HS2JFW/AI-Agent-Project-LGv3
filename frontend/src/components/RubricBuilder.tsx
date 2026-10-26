import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2, LayoutPanelTop, Bold, ChevronUp, Braces, AlignCenter, ChevronDown, AlignLeft, ListOrdered, AlignRight, GripVertical, Eye, Palette, Plus, Italic, List, X } from 'lucide-react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import StarterKit from '@tiptap/starter-kit';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FloatingDialog, type DialogState } from '../FloatingDialog';

// Types
export interface RubricLevel {
  id: string;
  name: string;
  score: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  descriptions: Record<string, string>;
  weight?: number;
}

export interface RubricData {
  levels: RubricLevel[];
  criteria: RubricCriterion[];
  explain?: string;
}

interface RubricBuilderProps {
  initialData?: RubricData;
  onSave: (data: RubricData) => void;
  onClose: () => void;
  nodeLabel?: string;
  mode?: 'rubric' | 'mca';
}

// ----------------------
// Rich Text Cell Component
// ----------------------
const RichTextCell = ({ content, onChange, setActiveEditor }: { content: string, onChange: (val: string) => void, setActiveEditor: (editor: Editor | null) => void }) => {
  const editor = useEditor({
    extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), TextStyle, Color],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onFocus: ({ editor }) => {
      setActiveEditor(editor);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm h-full w-full max-w-none focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#84CC16] rounded p-2 text-cyber-text text-[11px] leading-tight flex-1',
      },
    },
  });

  return (
    <div className="relative group w-full h-full flex flex-col">
      <EditorContent editor={editor} className="w-full flex-1 flex flex-col cursor-text [&>div]:flex-1 [&>div]:h-full" />
    </div>
  );
};

// ----------------------
// Sortable Row Component
// ----------------------
interface SortableRowProps {
  criterion: RubricCriterion;
  levels: RubricLevel[];
  updateCriterion: (id: string, updates: Partial<RubricCriterion>) => void;
  removeCriterion: (id: string) => void;
    onViewJson: (id: string) => void;
  startColResize: (e: React.MouseEvent, id: string) => void;
  hoveredCol: string | null;
  setHoveredCol: (id: string | null) => void;
  mode?: 'rubric' | 'mca';
  columnWidths: Record<string, number>;
  setActiveEditor: (editor: Editor | null) => void;
}

const SortableRow = ({ criterion, levels, updateCriterion, removeCriterion, onViewJson, startColResize, hoveredCol, setHoveredCol, mode, setActiveEditor, columnWidths }: SortableRowProps) => {
  const [rowHeight, setRowHeight] = useState<number>(0);
    const [hoveredRow, setHoveredRow] = useState(false);

  const startRowResize = (e: React.MouseEvent) => {
    e.preventDefault();
        const startY = e.clientY;
    // Current height
    const trElement = (e.target as HTMLElement).closest('tr');
    const startHeight = trElement ? trElement.getBoundingClientRect().height : 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      setRowHeight(Math.max(100, startHeight + deltaY));
    };

    const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: criterion.id });

  const style = {
    transform: isDragging ? CSS.Transform.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <tr ref={setNodeRef} style={{ ...style, height: rowHeight ? `${rowHeight}px` : 'auto' }} className={`relative group border-b border-cyber-border/40 hover:bg-cyber-panel/50 ${isDragging ? 'bg-cyber-dark shadow-[0_0_15px_rgba(132,204,22,0.3)] ring-1 ring-[#84CC16]' : ''}`}>
      {/* Drag Handle & Actions */}
      <td className="w-[120px] px-2 py-4 relative sticky left-0 z-[60] bg-[#12121A] border-r border-b border-cyber-border/40">
        <div 
          className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize z-50 transition-colors ${hoveredRow ? 'bg-[#84CC16]' : 'bg-transparent hover:bg-[#84CC16]'}`}
          onMouseEnter={() => setHoveredRow(true)}
          onMouseLeave={() => setHoveredRow(false)}
          onMouseDown={startRowResize}
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity bg-cyber-dark/80 rounded px-1 z-[70]">
          <div {...attributes} {...listeners} className="cursor-grab hover:text-[#84CC16] text-cyber-muted p-1">
            <GripVertical className="w-4 h-4" />
          </div>
          <button onClick={() => onViewJson(criterion.id)} className="text-cyber-muted hover:text-cyan-400 p-1" title="View JSON Output">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => removeCriterion(criterion.id)} className="text-cyber-muted hover:text-red-500 p-1" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
      
      {/* Criteria Name */}
      <td className="h-[1px] p-0 border-r border-cyber-border/40 align-top bg-[#12121A] sticky z-[60] relative" style={{ left: 120, width: 200, minWidth: 200 }}>
        <div 
          className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize z-50 transition-colors ${hoveredRow ? 'bg-[#84CC16]' : 'bg-transparent hover:bg-[#84CC16]'}`}
          onMouseEnter={() => setHoveredRow(true)}
          onMouseLeave={() => setHoveredRow(false)}
          onMouseDown={startRowResize}
        />
        <div 
          className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${hoveredCol === 'criteria' ? 'bg-[#84CC16]' : 'bg-transparent hover:bg-[#84CC16]'}`}
          onMouseEnter={() => setHoveredCol('criteria')}
          onMouseLeave={() => setHoveredCol(null)}
          onMouseDown={(e) => startColResize(e, 'criteria')}
        />
        <div className="flex flex-col h-full w-full px-3 py-4">
          <textarea
            value={criterion.name}
            onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
            className="flex-1 w-full bg-transparent border-none focus:ring-1 focus:ring-[#84CC16] resize-none outline-none text-cyber-text text-sm font-semibold rounded p-1"
            placeholder="ชื่อเกณฑ์"
          />
        </div>
      </td>
      {mode === 'mca' && (
        <td className="h-[1px] p-0 border-r border-cyber-border/40 w-[120px] align-top bg-[#12121A] sticky z-[60] relative" style={{ left: 120 + (columnWidths['criteria'] || 200), width: 120, minWidth: 120 }}>
          <div 
            className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize z-50 transition-colors ${hoveredRow ? 'bg-[#84CC16]' : 'bg-transparent hover:bg-[#84CC16]'}`}
            onMouseEnter={() => setHoveredRow(true)}
            onMouseLeave={() => setHoveredRow(false)}
            onMouseDown={startRowResize}
          />
          <div className="flex flex-col h-full w-full px-3 py-4 items-center justify-start">
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={criterion.weight || 0}
              onChange={(e) => updateCriterion(criterion.id, { weight: parseFloat(e.target.value) || 0 })}
              className="w-full bg-cyber-panel/50 border border-cyber-border/50 text-cyber-neon text-sm focus:outline-none text-center font-bold py-2 rounded focus:ring-1 focus:ring-[#84CC16]"
            />
          </div>
        </td>
      )}

      {/* Level Descriptions */}
      {levels.map(level => (
        <td key={level.id} className="h-[1px] p-0 border-r border-cyber-border/40 align-top relative">
          <div 
            className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize z-50 transition-colors ${hoveredRow ? 'bg-[#84CC16]' : 'bg-transparent hover:bg-[#84CC16]'}`}
            onMouseEnter={() => setHoveredRow(true)}
            onMouseLeave={() => setHoveredRow(false)}
            onMouseDown={startRowResize}
          />
          <div 
            className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${hoveredCol === level.id ? 'bg-[#84CC16]' : 'bg-transparent hover:bg-[#84CC16]'}`}
            onMouseEnter={() => setHoveredCol(level.id)}
            onMouseLeave={() => setHoveredCol(null)}
            onMouseDown={(e) => startColResize(e, level.id)}
          />
          <div className="flex flex-col h-full w-full px-2 py-2">
            <RichTextCell
              content={criterion.descriptions[level.id] || ''}
              onChange={(val) => updateCriterion(criterion.id, {
                descriptions: { ...criterion.descriptions, [level.id]: val }
              })}
              setActiveEditor={setActiveEditor}
            />
          </div>
        </td>
      ))}


    </tr>
  );
};


// ----------------------
// Main Builder Component
// ----------------------
export default function RubricBuilder({ initialData, onSave, onClose, nodeLabel, mode = 'rubric' }: RubricBuilderProps) {
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [levels, setLevels] = useState<RubricLevel[]>(initialData?.levels?.length ? initialData.levels : [
    { id: 'l1', name: 'ดีเยี่ยม', score: 4 },
    { id: 'l2', name: 'เชี่ยวชาญ', score: 3 },
    { id: 'l3', name: 'ผ่านเกณฑ์', score: 2 },
    { id: 'l4', name: 'ต้องปรับปรุง', score: 1 },
  ]);

  const [explainText, setExplainText] = useState<string>(initialData?.explain || 'สูตรสมการ MCA$$Total Score = \\sum_{i=1}^{n} (S_i \\times W_i)$$เขียนเป็นภาษาที่เข้าใจง่าย:คะแนนรวม MCA = (คะแนนดิบด้านที่ 1 $\\times$ น้ำหนักด้านที่ 1) + (คะแนนดิบด้านที่ 2 $\\times$ น้ำหนักด้านที่ 2) + ... + (คะแนนดิบด้านที่ 5 $\\times$ น้ำหนักด้านที่ 5)');
  const [criteria, setCriteria] = useState<RubricCriterion[]>(initialData?.criteria?.length ? initialData.criteria : [
    { id: 'c1', name: '1. เนื้อหาและความชัดเจน', descriptions: {} }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevLevelsLength = useRef(levels.length);

  useEffect(() => {
    if (levels.length > prevLevelsLength.current) {
      if (scrollContainerRef.current) {
        // slight delay to let DOM render the new column
        setTimeout(() => {
          const lastLevel = levels[levels.length - 1];
          if (lastLevel) {
            const el = document.getElementById(`col-${lastLevel.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' });
            }
          }
        }, 100);
      }
    }
    prevLevelsLength.current = levels.length;
  }, [levels.length, levels]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const startColResize = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const thElement = (e.target as HTMLElement).closest('th');
    const startWidth = thElement ? thElement.getBoundingClientRect().width : 200;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColumnWidths(prev => ({ ...prev, [colId]: Math.max(100, startWidth + deltaX) }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const [dialogZIndexCounter, setDialogZIndexCounter] = useState(100);

  const closeDialog = (id: string) => {
    setDialogs(prev => prev.filter(d => d.id !== id));
  };

  const updateDialog = (id: string, updates: Partial<DialogState>) => {
    setDialogs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const bringToFront = (id: string) => {
    setDialogZIndexCounter(prev => prev + 1);
    updateDialog(id, { zIndex: dialogZIndexCounter + 1 });
  };

  const openJsonDialog = (title: string, data: any) => {
        const newDialog: DialogState = {
      id: `json-${Date.now()}`,
      title: title,
      type: 'json',
      content: JSON.stringify(data, null, 2),
      position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 200 },
      size: { w: 400, h: 400 },
      zIndex: dialogZIndexCounter + 1,
      filename: title.toLowerCase().replace(/\s+/g, '_') + '.json',
      fontSize: 14,
      textColor: '#ffffff',
      currentPage: 1,
      scale: 1
    };
    setDialogZIndexCounter(prev => prev + 1);
    setDialogs(prev => [...prev, newDialog]);
  };

  const handleViewCriterionJson = (criterionId: string) => {
    const crit = criteria.find(c => c.id === criterionId);
    if (!crit) return;
    
    const row: Record<string, any> = {};
    row["เกณฑ์"] = crit.name;
    if (mode === 'mca') {
      row["Weight (%)"] = crit.weight || 0;
    }
    levels.forEach(l => {
      row[`${l.name} ${l.score} คะแนน`] = crit.descriptions[l.id] || "";
    });

    const columns = ["เกณฑ์"];
    if (mode === 'mca') columns.push("Weight (%)");
    levels.forEach(l => columns.push(`${l.name} ${l.score} คะแนน`));

    let explain = "";
    if (mode === 'mca') {
      const total = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
      let warning = "";
      if (Math.abs(total - 100) > 0.01) {
        warning = `[Warning: Total weight is ${total}%. It should be exactly 100%.] `;
      }
      explain = warning + explainText;
    }

    const output: any = {
      tableName: nodeLabel || (mode === 'mca' ? 'MCA Data' : 'Rubric Data'),
      columns,
      rows: [row]
    };
    
    if (mode === 'mca') {
      output.explain = explain;
    }

    openJsonDialog(`JSON: ${crit.name}`, output);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCriteria((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addCriterion = () => {
    const newId = `c${Date.now()}`;
    setCriteria([...criteria, { id: newId, name: `New Criteria`, descriptions: {}, weight: 0 }]);
  };

  const updateCriterion = (id: string, updates: Partial<RubricCriterion>) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCriterion = (id: string) => {
    setCriteria((items) => items.filter((i) => i.id !== id));
  };

  const addLevel = () => {
    const newId = `l${Date.now()}`;
    setLevels([...levels, { id: newId, name: 'New Level', score: 0 }]);
  };

  const updateLevel = (id: string, updates: Partial<RubricLevel>) => {
    setLevels(levels.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLevel = (id: string) => {
    setLevels(levels.filter(l => l.id !== id));
  };

  const totalScore = useMemo(() => {
    const maxLevelScore = levels.length > 0 ? Math.max(...levels.map(l => l.score)) : 0;
    return criteria.length * maxLevelScore;
  }, [levels, criteria]);

  const handleSave = () => {
    if (mode === 'mca') {
      const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        alert(`น้ำหนักรวมทุกข้อต้องเท่ากับ 100% (ปัจจุบัน: ${totalWeight}%)`);
        return;
      }
    }
    onSave({ levels, criteria, explain: explainText });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex flex-col font-sans text-cyber-text">
      {/* Header */}
      <div className="h-16 border-b border-cyber-border bg-cyber-dark flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center space-x-4">
          <LayoutPanelTop className="w-6 h-6 text-[#84CC16]" />
          <h1 className="text-xl font-bold">{nodeLabel || 'Rubric'}</h1>
        </div>
        <div className="flex items-center space-x-4">

          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-bold bg-[#84CC16] text-[#0a0a0f] rounded hover:bg-[#A3E635] transition-colors"
          >
            SAVE
          </button>
          <button onClick={onClose} className="p-2 hover:bg-cyber-panel rounded-full transition-colors text-cyber-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Table Area */}
        <div className="flex-1 flex flex-col p-8 relative min-w-0">
          <div ref={scrollContainerRef} className="bg-[#12121A] rounded-lg border border-cyber-border min-w-full shadow-2xl overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
            <table className="w-max text-left border-separate border-spacing-0 table-fixed">
              <thead>
                {/* Level Header Row */}
                <tr>
                  <th className="w-[120px] bg-[#1A1A24] border-b border-cyber-border/50 sticky top-0 left-0 z-[70]"></th>
                  <th 
                    className="px-3 py-4 bg-[#1A1A24] border-r border-b border-cyber-border/50 font-bold text-[#38bdf8] text-center align-middle sticky top-0 z-[70]"
                    style={{ left: 120, width: columnWidths['criteria'] || 200, minWidth: columnWidths['criteria'] || 200 }}
                  >
                    เกณฑ์
                    <div 
                      className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${hoveredCol === 'criteria' ? 'bg-[#84CC16]' : 'bg-transparent hover:bg-[#84CC16]'}`}
                      onMouseEnter={() => setHoveredCol('criteria')}
                      onMouseLeave={() => setHoveredCol(null)}
                      onMouseDown={(e) => startColResize(e, 'criteria')}
                    />
                  </th>
                  {mode === 'mca' && (
                    <th 
                      className="px-2 py-4 bg-[#1A1A24] border-r border-b border-cyber-border/50 font-bold text-[#facc15] text-center align-middle sticky top-0 z-[70]"
                      style={{ left: 120 + (columnWidths['criteria'] || 200), width: 120, minWidth: 120 }}
                    >
                      Weight (%)
                    </th>
                  )}
                  {levels.map((level) => {
                    return (
                    <th 
                      key={level.id}
                      id={`col-${level.id}`} 
                      className="px-2 py-2 bg-[#1A1A24] border-r border-b border-cyber-border/50 text-center relative group sticky top-0 z-[50]"
                      style={{ width: columnWidths[level.id] || 250, minWidth: columnWidths[level.id] || 250 }}
                    >

                      <div 
                        className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${hoveredCol === level.id ? 'bg-[#84CC16]' : 'bg-cyber-border/20 hover:bg-[#84CC16]'}`}
                        onMouseEnter={() => setHoveredCol(level.id)}
                        onMouseLeave={() => setHoveredCol(null)}
                        onMouseDown={(e) => startColResize(e, level.id)}
                      />
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex flex-col space-y-1">
                         <button onClick={() => removeLevel(level.id)} className="text-cyber-muted hover:text-red-500"><X className="w-3 h-3"/></button>
                      </div>
                      <input
                        value={level.name}
                        onChange={(e) => updateLevel(level.id, { name: e.target.value })}
                        className="w-full bg-transparent text-center font-bold text-sm focus:outline-none focus:text-[#84CC16]"
                        placeholder="ระดับ"
                      />
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <span className="text-xs text-cyber-muted">(</span>
                        <input
                          type="number"
                          value={level.score}
                          onChange={(e) => updateLevel(level.id, { score: parseInt(e.target.value) || 0 })}
                          className="w-8 bg-transparent text-center text-xs text-cyber-muted focus:outline-none focus:text-[#84CC16]"
                        />
                        <span className="text-xs text-cyber-muted">คะแนน)</span>
                      </div>
                    </th>
                  );
                })}
                  
                </tr>
              </thead>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <tbody>
                  <SortableContext items={criteria.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {criteria.map((crit) => (
                      <SortableRow
                        key={crit.id}
                        columnWidths={columnWidths}
                        criterion={crit}
                        levels={levels}
                        updateCriterion={updateCriterion}
                        removeCriterion={removeCriterion}
                                                onViewJson={handleViewCriterionJson}
                        startColResize={startColResize}
                        hoveredCol={hoveredCol}
                        setHoveredCol={setHoveredCol}
                        mode={mode}
                        setActiveEditor={setActiveEditor}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </DndContext>
            </table>
            
            {/* Bottom Actions and Explain */}
            <div className="p-4 bg-[#12121A] sticky left-0 z-[60] border-t border-cyber-border/40 flex flex-col space-y-4">
              <button 
                onClick={addCriterion}
                className="flex items-center space-x-2 text-[#84CC16] hover:text-[#A3E635] font-bold text-sm group w-max"
              >
                <div className="w-8 h-8 rounded-full border-2 border-[#84CC16] flex items-center justify-center group-hover:bg-[#84CC16]/20 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span>[+] เพิ่มเกณฑ์</span>
              </button>

              {mode === 'mca' && (
                <div className="w-[calc(100vw-400px)] mt-4 pr-8">
                  <label className="block text-xs text-cyber-muted font-bold uppercase tracking-wider mb-2">คำอธิบายสมการ MCA (Explain)</label>
                  <textarea
                    value={explainText}
                    onChange={(e) => setExplainText(e.target.value)}
                    className="w-full bg-cyber-dark/50 border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-[#84CC16] focus:ring-1 focus:ring-[#84CC16] transition-colors resize-y min-h-[60px]"
                    placeholder="ป้อนคำอธิบายสมการ..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Total Score Summary) */}
        <div className="w-80 shrink-0 border-l border-cyber-border bg-[#0F0F16] flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6 flex-1">
            
            <button 
              onClick={addLevel}
              className="w-full flex items-center justify-center space-x-2 py-4 border-2 border-dashed border-[#84CC16]/50 rounded-xl text-[#84CC16] hover:bg-[#84CC16]/10 hover:border-[#84CC16] transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-[#84CC16] flex items-center justify-center text-[#0a0a0f] shadow-[0_0_15px_rgba(132,204,22,0.5)] group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-lg">[+] เพิ่มระดับ</span>
            </button>

            {/* TEXT TOOLBAR */}
            <div className="space-y-2 pb-4">
              <label className="text-xs font-bold text-cyber-muted uppercase tracking-wider">Text Formatting</label>
              <div className="bg-[#12121A] border border-cyber-border/50 rounded-lg p-2 flex flex-wrap gap-1">
                <button
                  onClick={() => activeEditor?.chain().focus().toggleBold().run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive('bold') ? 'bg-[#84CC16] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#84CC16] hover:bg-cyber-panel'}`}
                  title="Bold"
                ><Bold className="w-4 h-4" /></button>
                <button
                  onClick={() => activeEditor?.chain().focus().toggleItalic().run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive('italic') ? 'bg-[#84CC16] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#84CC16] hover:bg-cyber-panel'}`}
                  title="Italic"
                ><Italic className="w-4 h-4" /></button>
                
                <div className="w-px h-6 bg-cyber-border/50 mx-1 self-center" />
                
                <button
                  onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive({ textAlign: 'left' }) ? 'bg-[#84CC16] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#84CC16] hover:bg-cyber-panel'}`}
                  title="Align Left"
                ><AlignLeft className="w-4 h-4" /></button>
                <button
                  onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive({ textAlign: 'center' }) ? 'bg-[#84CC16] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#84CC16] hover:bg-cyber-panel'}`}
                  title="Align Center"
                ><AlignCenter className="w-4 h-4" /></button>
                <button
                  onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive({ textAlign: 'right' }) ? 'bg-[#84CC16] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#84CC16] hover:bg-cyber-panel'}`}
                  title="Align Right"
                ><AlignRight className="w-4 h-4" /></button>
                
                <div className="w-px h-6 bg-cyber-border/50 mx-1 self-center" />
                
                <button
                  onClick={() => activeEditor?.chain().focus().toggleBulletList().run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive('bulletList') ? 'bg-[#84CC16] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#84CC16] hover:bg-cyber-panel'}`}
                  title="Bullet List"
                ><List className="w-4 h-4" /></button>
                <button
                  onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive('orderedList') ? 'bg-[#84CC16] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#84CC16] hover:bg-cyber-panel'}`}
                  title="Numbered List"
                ><ListOrdered className="w-4 h-4" /></button>
                
                <div className="w-px h-6 bg-cyber-border/50 mx-1 self-center" />
                
                <div className="relative group/color">
                  <input
                    type="color"
                    onInput={(e) => activeEditor?.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                    value={activeEditor?.getAttributes('textStyle').color || '#ffffff'}
                    disabled={!activeEditor}
                    className="w-7 h-7 p-0 border-0 rounded cursor-pointer self-center bg-transparent appearance-none"
                    title="Text Color"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <Palette className="w-4 h-4 mix-blend-difference opacity-50" />
                  </div>
                </div>
              </div>
              {!activeEditor && <div className="text-[10px] text-cyber-muted italic text-center mt-2">Click inside a cell to format text</div>}
            </div>

            <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-cyber-border/50 pt-2 pb-2">Total Score</h2>

            <div className="bg-cyber-dark/50 border border-cyber-border rounded-xl p-4 space-y-4">
              <div className="text-sm text-cyber-muted flex justify-between">
                <span>ระดับคะแนน</span>
                <span>=</span>
              </div>
              <div className="text-sm text-cyber-muted flex justify-between">
                <span>ระดับคะแนนที่</span>
                <span>=</span>
              </div>
              <div className="text-lg font-bold text-white flex justify-between items-center bg-cyber-panel p-2 rounded">
                <span>ค่าทีได้</span>
                <span className="text-[#84CC16]">{criteria.length} * {levels.length > 0 ? Math.max(...levels.map(l => l.score)) : 0} = {totalScore}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-cyber-muted">คะแนนรวมสูงสุดตามเกณฑ์</label>
              <div className="relative">
                <select className="w-full bg-cyber-dark border border-cyber-border rounded p-3 appearance-none focus:outline-none focus:border-[#84CC16]">
                  <option>4 +</option>
                  <option>3 +</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-cyber-muted">Points</label>
              <div className="flex bg-cyber-dark border border-cyber-border rounded overflow-hidden">
                <input 
                  type="number" 
                  value={totalScore} 
                  readOnly 
                  className="w-full bg-transparent p-3 outline-none"
                />
                <div className="flex flex-col border-l border-cyber-border w-8">
                  <button className="flex-1 flex items-center justify-center hover:bg-cyber-panel border-b border-cyber-border">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button className="flex-1 flex items-center justify-center hover:bg-cyber-panel">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#84CC16]/30">
            <div className="flex flex-col items-center justify-center space-y-1">
              <span className="text-sm text-cyber-muted font-bold uppercase tracking-wider">คะแนนรวม</span>
              <span className="text-5xl font-black text-[#84CC16] drop-shadow-[0_0_15px_rgba(132,204,22,0.6)]">
                {totalScore}
              </span>
            </div>
            <button 
              onClick={() => {
                const columns = ["เกณฑ์"];
                if (mode === 'mca') columns.push("Weight (%)");
                levels.forEach(l => columns.push(`${l.name} ${l.score} คะแนน`));
            
                const rows = criteria.map(crit => {
                  const row: Record<string, any> = {};
                  row["เกณฑ์"] = crit.name;
                  if (mode === 'mca') {
                    row["Weight (%)"] = crit.weight || 0;
                  }
                  levels.forEach(l => {
                    row[`${l.name} ${l.score} คะแนน`] = crit.descriptions[l.id] || "";
                  });
                  return row;
                });
            
                const outData: any = {
                  tableName: nodeLabel || (mode === 'mca' ? 'MCA Data' : 'Rubric Data'),
                  columns,
                  rows
                };
                
                if (mode === 'mca') {
                  const total = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
                  let warning = "";
                  if (Math.abs(total - 100) > 0.01) {
                    warning = `[Warning: Total weight is ${total}%. It should be exactly 100%.] `;
                  }
                  outData.explain = warning + explainText;
                }

                openJsonDialog(`Full ${mode === 'mca' ? 'MCA' : 'Rubric'} JSON`, outData);
              }}
              className="w-full mt-6 flex items-center justify-center space-x-2 py-3 bg-cyber-dark hover:bg-cyber-panel border border-cyber-border rounded-xl text-cyan-400 transition-all shadow-lg"
            >
              <Braces className="w-5 h-5" />
              <span className="font-bold">View JSON</span>
            </button>
          </div>
        </div>
      </div>

      {dialogs.map(dialog => (
        <FloatingDialog
          key={dialog.id}
          dialog={dialog}
          onClose={closeDialog}
          onUpdate={updateDialog}
          bringToFront={bringToFront}
        />
      ))}
    </div>
  );
}
