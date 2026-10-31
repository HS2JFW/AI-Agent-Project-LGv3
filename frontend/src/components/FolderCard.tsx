import React, { useId, useState } from 'react';
import { Trash2, Folder, FolderPlus, Check, FolderKanban, CornerUpLeft } from 'lucide-react';

export const PALETTE_COLORS = [
  { id: 'blue', label: 'น้ำเงิน', hex: '#1E6BFF', bgClass: 'bg-[#1E6BFF]' },
  { id: 'green', label: 'เขียว', hex: '#16A34A', bgClass: 'bg-[#16A34A]' },
  { id: 'orange', label: 'ส้ม', hex: '#EA580C', bgClass: 'bg-[#EA580C]' },
  { id: 'purple', label: 'ม่วง', hex: '#9333EA', bgClass: 'bg-[#9333EA]' },
  { id: 'brown', label: 'น้ำตาล', hex: '#854D0E', bgClass: 'bg-[#854D0E]' },
  { id: 'red', label: 'แดง', hex: '#DC2626', bgClass: 'bg-[#DC2626]' },
  { id: 'black', label: 'ดำ', hex: '#1E293B', bgClass: 'bg-[#1E293B]' },
];

export const getPaletteHex = (colorId?: string): string => {
  switch (colorId?.toLowerCase()) {
    case 'green': return '#16A34A';
    case 'orange': return '#EA580C';
    case 'purple': return '#9333EA';
    case 'brown': return '#854D0E';
    case 'red': return '#DC2626';
    case 'black': return '#1E293B';
    case 'blue':
    default:
      return '#1E6BFF';
  }
};

export interface FolderCardProps {
  id?: string;
  name: string;
  description?: string;
  childWorkflowsCount?: number;
  childSubgroupsCount?: number;
  createdAt?: string;
  onClick?: () => void;
  onDelete?: () => void;
  onMove?: (e: React.MouseEvent) => void;
  onMoveToPreviousLayer?: (e: React.MouseEvent) => void;
  hasPreviousLayer?: boolean;
  className?: string;
  previewMode?: boolean;
  isSelected?: boolean;
  color?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
  onSelectToggle?: (e: React.MouseEvent) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  id,
  name,
  description,
  createdAt,
  onClick,
  onDelete,
  onMove,
  onMoveToPreviousLayer,
  hasPreviousLayer = false,
  className = '',
  previewMode = false,
  isSelected = false,
  color = 'blue',
  draggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver = false,
  onSelectToggle,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const gradientId = useId().replace(/:/g, '_');
  const displayDate = createdAt ? new Date(createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const showWhiteEdge = isSelected || isHovered || isDragOver;
  const stripeHex = getPaletteHex(color);

  return (
    <div
      data-card-item="true"
      data-grp-id={id}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDragLeave={(e) => {
        onDragLeave?.(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(e);
      }}
      className={`relative group select-none transition-all duration-300 h-[265px] flex flex-col justify-between ${
        isDragOver ? 'scale-[1.03] z-20' : ''
      } ${
        previewMode ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1.5'
      } ${className}`}
      style={{
        filter: isDragOver
          ? 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.25))'
          : isSelected
          ? 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.2))'
          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
      }}
    >
      {/* Die-cut Folder Silhouette SVG Background */}
      <svg
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300 overflow-visible"
      >
        <defs>
          <linearGradient id={`grad-${gradientId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E6BFF" />
            <stop offset="100%" stopColor="#1352CE" />
          </linearGradient>
        </defs>
        <path
          d="M 1.5,18
             C 1.5,9 9,1.5 18,1.5
             L 115,1.5
             C 125,1.5 134,6 140,14
             L 148,23.5
             C 153,29 161,33.5 168,33.5
             L 282,33.5
             C 291,33.5 298.5,41 298.5,50
             L 298.5,182
             C 298.5,191 291,198.5 282,198.5
             L 18,198.5
             C 9,198.5 1.5,191 1.5,182
             Z"
          fill={`url(#grad-${gradientId})`}
          stroke={showWhiteEdge ? '#FFFFFF' : 'transparent'}
          strokeWidth={isDragOver ? '3.5' : '2.5'}
          strokeDasharray={isDragOver ? '6 3' : 'none'}
          vectorEffect="non-scaling-stroke"
          className={`transition-all duration-200 group-hover:brightness-105 group-hover:stroke-white ${
            showWhiteEdge ? 'stroke-white' : 'stroke-transparent'
          }`}
        />
      </svg>

      {/* Drag Over Active Overlay Feedback */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-900/40 backdrop-blur-[2px] rounded-2xl pointer-events-none animate-in fade-in duration-150">
          <div className="px-3.5 py-1.5 rounded-full bg-white text-zinc-900 text-xs font-bold shadow-xl flex items-center space-x-1.5 transform scale-105 animate-bounce">
            <FolderPlus className="w-4 h-4 text-zinc-900" />
            <span>Drop to Move Here</span>
          </div>
        </div>
      )}

      {/* Foreground Content Container - Stretches full height so footer sits at the very bottom */}
      <div className="relative z-10 flex flex-col justify-between h-full text-white">
        {/* Top Header Row: Folder Icon + Folder Label on Left, Move and Delete on Right */}
        <div className="p-4 pb-0 flex items-center justify-between select-none">
          {/* Multi-Select Checkbox as enlarged circle (+30%) with Folder Color background */}
          <div className="flex items-center pt-0.5 pl-0.5">
            {onSelectToggle ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectToggle(e);
                }}
                className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all cursor-pointer border-2 border-white/90 shadow-sm hover:scale-110 active:scale-95 ${
                  isSelected
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900 shadow-md'
                    : 'hover:border-white'
                }`}
                style={{ backgroundColor: stripeHex }}
                title={isSelected ? 'Deselect Folder' : 'Select Folder'}
              >
                <Check className={`w-4 h-4 stroke-[3] text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-60'}`} />
              </button>
            ) : (
              <div
                className="w-[26px] h-[26px] rounded-full border-2 border-white/90 shadow-sm flex items-center justify-center"
                style={{ backgroundColor: stripeHex }}
                title="Folder Color"
              />
            )}
          </div>

        </div>

        {/* Middle Details: Folder Icon in front of Folder Name & Description */}
        <div className="flex-1 flex flex-col justify-center px-4 py-1 text-left overflow-hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-sm shrink-0">
              <Folder className="w-4 h-4 fill-white text-white drop-shadow-sm" />
            </div>
            <h4
              className="text-base font-extrabold text-white truncate tracking-wide drop-shadow-sm flex-1"
              title={name || 'Untitled Group'}
            >
              {name || 'Untitled Group'}
            </h4>
          </div>

          <p className="text-xs text-white/85 line-clamp-2 leading-relaxed font-normal mt-1.5 pl-0.5">
            {description || 'Workflow organization group folder.'}
          </p>
        </div>

        {/* Bottom Row: Move to Previous Layer Button, Creation Date, Move Button, and Arrow Icon placed at the very bottom */}
        <div className="p-4 pt-2.5 pb-3.5 mt-auto border-t border-white/20 flex items-center justify-between text-xs select-none">
          {/* Left: Button to move out to previous layer (แทนที่ข้อมูล workflow และ sub folder) */}
          <div className="flex items-center">
            {onMoveToPreviousLayer && !previewMode ? (
              <button
                type="button"
                disabled={!hasPreviousLayer}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToPreviousLayer(e);
                }}
                className={`p-1.5 rounded-full backdrop-blur-sm transition-all select-none ${
                  hasPreviousLayer
                    ? 'bg-white/20 hover:bg-white/35 active:bg-white/40 text-white shadow-sm hover:shadow-[0_2px_6px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 cursor-pointer'
                    : 'bg-white/10 text-white/40 cursor-not-allowed opacity-40'
                }`}
                title={hasPreviousLayer ? 'ย้ายออกจากโฟลเดอร์นี้ ไป Layer ก่อนหน้า' : 'อยู่ที่หน้าหลัก (Root) แล้ว'}
              >
                <CornerUpLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center space-x-1 text-white/90">
            <span className="text-[10px] font-mono text-white/80 mr-0.5">
              {displayDate}
            </span>

            {/* Move Folder Button at bottom (Opens Drop Down List) */}
            {onMove && !previewMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(e);
                }}
                className="p-1 rounded-full text-white/80 hover:text-white bg-white/15 hover:bg-white/30 shadow-xs hover:shadow-[0_2px_7px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 transition-all cursor-pointer ml-0.5"
                title="ย้าย Layer (เลือกโฟลเดอร์ปลายทาง)"
              >
                <FolderKanban className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete Folder Button at bottom (เหมือน workflow) */}
            {onDelete && !previewMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-full text-white/80 hover:text-white bg-white/15 hover:bg-rose-500/80 shadow-xs hover:shadow-[0_2px_7px_rgba(244,63,94,0.45)] hover:-translate-y-0.5 transition-all cursor-pointer ml-0.5"
                title="Delete Folder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderCard;
