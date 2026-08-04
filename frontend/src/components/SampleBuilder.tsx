import React, { useState, useRef } from 'react';
import { Grid3X3, Trash2, GripVertical, Plus, Eye, X, Bold, Italic, List, ListOrdered, Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import StarterKit from '@tiptap/starter-kit';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FloatingDialog, type DialogState } from '../FloatingDialog';

export interface SampleItem {
  id: string;
  name: string;
  scores: Record<string, number>;
}

export interface SampleCriteria {
  id: string;
  name: string;
}

export interface SampleData {
  samples: SampleItem[];
  criteria: SampleCriteria[];
  sampleColumnName?: string;
}

interface SampleBuilderProps {
  initialData?: SampleData;
  onSave: (data: SampleData) => void;
  onClose: () => void;
  nodeLabel?: string;
}

// ----------------------
// Sortable Row Component
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
        class: 'prose prose-invert prose-sm h-full w-full max-w-none focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#38bdf8] rounded p-2 text-cyber-text text-[11px] leading-tight flex-1',
      },
    },
  });

  return (
    <div className="relative group w-full h-full flex flex-col">
      <EditorContent editor={editor} className="w-full flex-1 flex flex-col cursor-text [&>div]:flex-1 [&>div]:h-full" />
    </div>
  );
};

interface SortableRowProps {
  sample: SampleItem;
  criteria: SampleCriteria[];
  updateSample: (id: string, updates: Partial<SampleItem>) => void;
  removeSample: (id: string) => void;
  onViewJson: (id: string) => void;
  columnWidths: Record<string, number>;
  hoveredCol: string | null;
  setHoveredCol: (id: string | null) => void;
  startColResize: (e: React.MouseEvent, id: string) => void;
  setActiveEditor: (editor: Editor | null) => void;
}

const SortableRow = ({ sample, criteria, updateSample, removeSample, onViewJson, columnWidths, hoveredCol, setHoveredCol, startColResize, setActiveEditor }: SortableRowProps) => {
  const [rowHeight, setRowHeight] = useState<number>(0);
    const [hoveredRow, setHoveredRow] = useState(false);

  const startRowResize = (e: React.MouseEvent) => {
    e.preventDefault();
        const startY = e.clientY;
    const trElement = (e.target as HTMLElement).closest('tr');
    const startHeight = trElement ? trElement.getBoundingClientRect().height : 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      setRowHeight(Math.max(40, startHeight + deltaY));
    };

    const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sample.id });

  const style = {
    transform: isDragging ? CSS.Transform.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
    height: rowHeight ? `${rowHeight}px` : 'auto'
  };

  return (
    <tr ref={setNodeRef} style={style} className={`relative group border-b border-cyber-border/40 hover:bg-cyber-panel/50 ${isDragging ? 'bg-cyber-dark shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-[#38bdf8]' : ''}`}>
      {/* Actions */}
      <td className="w-[80px] px-2 py-4 relative sticky left-0 z-[60] bg-[#12121A] border-b border-cyber-border/40">
        <div 
          className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize z-50 transition-colors ${hoveredRow ? 'bg-[#38bdf8]' : 'bg-transparent hover:bg-[#38bdf8]'}`}
          onMouseEnter={() => setHoveredRow(true)}
          onMouseLeave={() => setHoveredRow(false)}
          onMouseDown={startRowResize}
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity bg-cyber-dark/80 rounded px-1">
          <div {...attributes} {...listeners} className="cursor-grab hover:text-[#38bdf8] text-cyber-muted p-1">
            <GripVertical className="w-4 h-4" />
          </div>
          <button onClick={() => onViewJson(sample.id)} className="text-cyber-muted hover:text-cyan-400 p-1" title="View JSON Output">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => removeSample(sample.id)} className="text-cyber-muted hover:text-red-500 p-1" title="Delete Sample">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
      
      {/* Sample Name */}
      <td className="h-[1px] p-0 border-r border-cyber-border/40 align-top relative sticky left-[80px] z-[50] bg-[#12121A] border-b" style={{ width: columnWidths['sample'] || 150, minWidth: columnWidths['sample'] || 150 }}>
        <div 
          className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize z-50 transition-colors ${hoveredRow ? 'bg-[#38bdf8]' : 'bg-transparent hover:bg-[#38bdf8]'}`}
          onMouseEnter={() => setHoveredRow(true)}
          onMouseLeave={() => setHoveredRow(false)}
          onMouseDown={startRowResize}
        />
        <div 
          className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${hoveredCol === 'sample' ? 'bg-[#38bdf8]' : 'bg-transparent hover:bg-[#38bdf8]'}`}
          onMouseEnter={() => setHoveredCol('sample')}
          onMouseLeave={() => setHoveredCol(null)}
          onMouseDown={(e) => startColResize(e, 'sample')}
        />
        <div className="flex flex-col h-full w-full px-2 py-2">
          <RichTextCell 
              content={sample.name}
              onChange={(val) => updateSample(sample.id, { name: val })}
              setActiveEditor={setActiveEditor}
            />
        </div>
      </td>

      {/* Criteria Scores */}
      {criteria.map((crit) => (
        <td key={crit.id} className="h-[1px] p-0 border-r border-cyber-border/40 align-top relative" style={{ width: columnWidths[crit.id] || 150, minWidth: columnWidths[crit.id] || 150 }}>
          <div 
            className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize z-50 transition-colors ${hoveredRow ? 'bg-[#38bdf8]' : 'bg-transparent hover:bg-[#38bdf8]'}`}
            onMouseEnter={() => setHoveredRow(true)}
            onMouseLeave={() => setHoveredRow(false)}
            onMouseDown={startRowResize}
          />
          <div 
            className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${hoveredCol === crit.id ? 'bg-[#38bdf8]' : 'bg-transparent hover:bg-[#38bdf8]'}`}
            onMouseEnter={() => setHoveredCol(crit.id)}
            onMouseLeave={() => setHoveredCol(null)}
            onMouseDown={(e) => startColResize(e, crit.id)}
          />
          <div className="flex flex-col h-full w-full px-2 py-2">
            <input
              type="number"
              value={sample.scores[crit.id] ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                updateSample(sample.id, { scores: { ...sample.scores, [crit.id]: val } });
              }}
              className="flex-1 w-full min-h-[30px] bg-cyber-dark/30 border border-cyber-border rounded px-2 py-1.5 text-sm text-center text-white focus:outline-none focus:border-[#38bdf8] focus:bg-cyber-dark transition-colors"
              placeholder="0"
            />
          </div>
        </td>
      ))}
    </tr>
  );
};

const extractPlainText = (val: string | number): string | number => {
  if (typeof val === 'number') return val;
  const plainText = String(val).replace(/<[^>]*>?/gm, '').trim();
  return plainText;
};

export const SampleBuilder = ({ initialData, onSave, onClose, nodeLabel }: SampleBuilderProps) => {
  const [samples, setSamples] = useState<SampleItem[]>(initialData?.samples?.length ? initialData.samples : [
    { id: 'sample-1', name: 'ตัวอย่าง 1', scores: {} }
  ]);
  
  const [sampleColumnName, setSampleColumnName] = useState<string>(initialData?.sampleColumnName || 'Sample');
  const [criteria, setCriteria] = useState<SampleCriteria[]>(initialData?.criteria?.length ? initialData.criteria : [
    { id: 'crit-1', name: '[ชื่อเกณฑ์ที่ 1]' }
  ]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [dialogZIndexCounter, setDialogZIndexCounter] = useState(100);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addSample = () => {
    const id = `sample-${Date.now()}`;
    setSamples([...samples, { id, name: `ตัวอย่าง ${samples.length + 1}`, scores: {} }]);
  };

  const addCriterion = () => {
    const id = `crit-${Date.now()}`;
    setCriteria([...criteria, { id, name: `[ชื่อเกณฑ์ที่ ${criteria.length + 1}]` }]);
    setTimeout(() => {
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTo({ left: tableContainerRef.current.scrollWidth, behavior: 'smooth' });
      }
    }, 100);
  };

  const updateCriterion = (id: string, name: string) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, name } : c));
  };

  const removeCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
    setSamples(samples.map(s => {
      const newScores = { ...s.scores };
      delete newScores[id];
      return { ...s, scores: newScores };
    }));
  };

  const updateSample = (id: string, updates: Partial<SampleItem>) => {
    setSamples(samples.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSample = (id: string) => {
    setSamples(samples.filter(s => s.id !== id));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSamples((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const startColResize = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const currentWidth = columnWidths[id] || 150;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [id]: Math.max(100, currentWidth + delta)
      }));
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleSave = () => {
    onSave({ samples, criteria, sampleColumnName });
  };

  const openJsonDialog = () => {
    const primaryKey = String(extractPlainText(sampleColumnName)) || 'Sample';
    const exportColumns = [primaryKey, ...criteria.map(c => extractPlainText(c.name))];
    const rows = samples.map(sample => {
      const row: Record<string, any> = {};
      row[primaryKey] = extractPlainText(sample.name);
      criteria.forEach(crit => {
        row[String(extractPlainText(crit.name))] = sample.scores[crit.id] || 0;
      });
      return row;
    });
    const data = {
      tableName: nodeLabel || 'Sample Data',
      columns: exportColumns,
      rows
    };
    const newDialog: DialogState = {
      id: `json-${Date.now()}`,
      title: 'Sample Data JSON',
      type: 'json',
      content: JSON.stringify(data, null, 2),
      position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 200 },
      size: { w: 400, h: 400 },
      zIndex: dialogZIndexCounter + 1,
      filename: 'sample_data.json',
      fontSize: 14,
      textColor: '#ffffff',
      currentPage: 1,
      scale: 1
    };
    setDialogZIndexCounter(prev => prev + 1);
    setDialogs(prev => [...prev, newDialog]);
  };

  const openRowJsonDialog = (sampleId: string) => {
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return;
    
    const primaryKey = String(extractPlainText(sampleColumnName)) || 'Sample';
    const row: Record<string, any> = {};
    row[primaryKey] = extractPlainText(sample.name);
    criteria.forEach(crit => {
      row[String(extractPlainText(crit.name))] = sample.scores[crit.id] || 0;
    });

    const data = {
      tableName: nodeLabel || 'Sample Data',
      columns: [sampleColumnName || 'Sample', ...criteria.map(c => c.name)],
      rows: [row]
    };
    const newDialog: DialogState = {
      id: `json-${sampleId}-${Date.now()}`,
      title: `Sample JSON: ${sample.name}`,
      type: 'json',
      content: JSON.stringify(data, null, 2),
      position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 200 },
      size: { w: 400, h: 400 },
      zIndex: dialogZIndexCounter + 1,
      filename: `${sample.name}.json`,
      fontSize: 14,
      textColor: '#ffffff',
      currentPage: 1,
      scale: 1
    };
    setDialogZIndexCounter(prev => prev + 1);
    setDialogs(prev => [...prev, newDialog]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f] text-white flex flex-col font-sans">
      {/* Top Header Full Width */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border/30 bg-[#12121A]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#38bdf8]/10 flex items-center justify-center border border-[#38bdf8]/30">
            <Grid3X3 className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-wider">{nodeLabel || 'ข้อมูลตัวอย่าง'}</h1>
            <p className="text-xs text-cyber-muted">สร้างตารางให้คะแนนสำหรับตัวอย่างของคุณ</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-bold bg-[#38bdf8] text-[#0a0a0f] rounded hover:bg-[#7dd3fc] transition-colors shadow-[0_0_15px_rgba(56,189,248,0.3)] tracking-widest uppercase"
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
          <div ref={tableContainerRef} className="bg-[#12121A] rounded-lg border border-cyber-border min-w-full shadow-2xl overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
            <table className="w-max text-left border-separate border-spacing-0 table-fixed min-w-full">
              <thead>
                <tr className="border-b border-cyber-border/40">
                  <th className="w-[80px] px-2 py-3 bg-[#0a0a0f] sticky top-0 left-0 z-[70] shadow-sm border-r border-cyber-border/40"></th>
                  <th className="px-2 py-3 bg-[#0a0a0f] sticky top-0 left-[80px] z-[70] shadow-sm font-bold text-[#38bdf8] text-xs uppercase tracking-wider border-r border-cyber-border/40" style={{ width: columnWidths['sample'] || 150, minWidth: columnWidths['sample'] || 150 }}>
                    <div 
                      className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${hoveredCol === 'sample' ? 'bg-[#38bdf8]' : 'bg-transparent hover:bg-[#38bdf8]'}`}
                      onMouseEnter={() => setHoveredCol('sample')}
                      onMouseLeave={() => setHoveredCol(null)}
                      onMouseDown={(e) => startColResize(e, 'sample')}
                    />
                    <textarea
                      value={sampleColumnName}
                      onChange={(e) => setSampleColumnName(e.target.value)}
                      className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#38bdf8] rounded px-1 py-0.5 w-full text-[#38bdf8] resize-none"
                      rows={1}
                      placeholder="Sample Name"
                    />
                  </th>
                  {criteria.map((crit) => (
                    <th 
                      key={crit.id} 
                      className="px-2 py-3 bg-[#0a0a0f] sticky top-0 z-[65] shadow-sm border-r border-cyber-border/40 font-bold text-[#38bdf8] text-xs uppercase tracking-wider relative group/th"
                      style={{ width: columnWidths[crit.id] || 150, minWidth: columnWidths[crit.id] || 150 }}
                    >
                      <div className="flex items-center justify-between">
                        <textarea
                          value={crit.name}
                          onChange={(e) => updateCriterion(crit.id, e.target.value)}
                          className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#38bdf8] rounded px-1 py-0.5 w-full text-[#38bdf8] resize-none"
                          rows={1}
                        />
                        <button 
                          onClick={() => removeCriterion(crit.id)}
                          className="opacity-0 group-hover/th:opacity-100 text-cyber-muted hover:text-red-500 transition-opacity ml-1 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Resizer Handle */}
                      <div 
                        className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${hoveredCol === crit.id ? 'bg-[#38bdf8]' : 'bg-cyber-border/20 hover:bg-[#38bdf8]'}`}
                        onMouseEnter={() => setHoveredCol(crit.id)}
                        onMouseLeave={() => setHoveredCol(null)}
                        onMouseDown={(e) => startColResize(e, crit.id)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <tbody>
                  <SortableContext items={samples} strategy={verticalListSortingStrategy}>
                    {samples.map((sample) => (
                      <SortableRow 
                        key={sample.id} 
                        sample={sample} 
                        criteria={criteria}
                        updateSample={updateSample}
                        removeSample={removeSample}
                        onViewJson={openRowJsonDialog}
                        columnWidths={columnWidths}
                        hoveredCol={hoveredCol}
                        setHoveredCol={setHoveredCol}
                        startColResize={startColResize}
                          setActiveEditor={setActiveEditor}
                        />
                    ))}
                  </SortableContext>
                </tbody>
              </DndContext>
            </table>

            {/* Add Sample Button (Bottom Left) */}
            <div className="p-4 bg-[#12121A] sticky left-0 z-[60] w-max border-t border-cyber-border/40 mt-auto">
              <button 
                onClick={addSample}
                className="flex items-center space-x-2 text-[#38bdf8] hover:text-cyan-300 font-bold text-sm group"
              >
                <div className="w-8 h-8 rounded-full border-2 border-[#38bdf8] flex items-center justify-center group-hover:bg-[#38bdf8]/20 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span>[+] เพิ่มตัวอย่าง</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 shrink-0 border-l border-cyber-border bg-[#12121A] flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6 flex-1">
            <button 
              onClick={addCriterion}
              className="w-full flex items-center justify-center space-x-2 py-4 border-2 border-dashed border-[#38bdf8]/50 rounded-xl text-[#38bdf8] hover:bg-[#38bdf8]/10 hover:border-[#38bdf8] transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-[#38bdf8] flex items-center justify-center text-[#0a0a0f] shadow-[0_0_15px_rgba(56,189,248,0.3)] group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-lg">[+] เพิ่มเกณฑ์</span>
            </button>
            {/* Text Formatting Toolbar */}
            <div className="bg-cyber-dark/50 border border-cyber-border rounded-xl p-3 flex flex-col space-y-2 mt-4 mb-4">
              <span className="text-xs text-cyber-muted font-bold uppercase tracking-wider">Text Formatting</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => activeEditor?.chain().focus().toggleBold().run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive('bold') ? 'bg-[#38bdf8] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#38bdf8] hover:bg-cyber-panel'}`}
                  title="Bold"
                ><Bold className="w-4 h-4" /></button>
                <button
                  onClick={() => activeEditor?.chain().focus().toggleItalic().run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive('italic') ? 'bg-[#38bdf8] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#38bdf8] hover:bg-cyber-panel'}`}
                  title="Italic"
                ><Italic className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-cyber-border/50 mx-1 self-center" />
                <button
                  onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive({ textAlign: 'left' }) ? 'bg-[#38bdf8] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#38bdf8] hover:bg-cyber-panel'}`}
                  title="Align Left"
                ><AlignLeft className="w-4 h-4" /></button>
                <button
                  onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive({ textAlign: 'center' }) ? 'bg-[#38bdf8] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#38bdf8] hover:bg-cyber-panel'}`}
                  title="Align Center"
                ><AlignCenter className="w-4 h-4" /></button>
                <button
                  onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive({ textAlign: 'right' }) ? 'bg-[#38bdf8] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#38bdf8] hover:bg-cyber-panel'}`}
                  title="Align Right"
                ><AlignRight className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-cyber-border/50 mx-1 self-center" />
                <button
                  onClick={() => activeEditor?.chain().focus().toggleBulletList().run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive('bulletList') ? 'bg-[#38bdf8] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#38bdf8] hover:bg-cyber-panel'}`}
                  title="Bullet List"
                ><List className="w-4 h-4" /></button>
                <button
                  onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()}
                  disabled={!activeEditor}
                  className={`p-1.5 rounded text-xs ${activeEditor?.isActive('orderedList') ? 'bg-[#38bdf8] text-[#0a0a0f]' : 'text-cyber-muted hover:text-[#38bdf8] hover:bg-cyber-panel'}`}
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
              <button 
                onClick={openJsonDialog}
              className="w-full flex justify-center items-center space-x-2 px-4 py-2 bg-cyber-panel border border-cyber-border text-white rounded hover:bg-cyber-dark transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>ดูข้อมูล JSON ทั้งหมด</span>
            </button>
          </div>
        </div>
      </div>

      {dialogs.map(dialog => (
        <FloatingDialog
          key={dialog.id}
          dialog={dialog}
          onClose={(id) => setDialogs(prev => prev.filter(d => d.id !== id))}
          bringToFront={(id) => {
            const zIndex = dialogZIndexCounter + 1;
            setDialogZIndexCounter(zIndex);
            setDialogs(prev => prev.map(d => d.id === id ? { ...d, zIndex } : d));
          }}
          onUpdate={(id, updates) => {
            setDialogs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
          }}
        />
      ))}
    </div>
  );
};
